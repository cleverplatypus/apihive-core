import { type LoggerFacade, type LogLevel, ConsoleLogger } from '@apihive/logger-facade';
import HTTPError from './HTTPError.js';
import type {
  FeatureName,
  QueryParameterValue,
  ResponseBodyTransformer,
  SSEListener,
  SSERequestType,
  SSESubscription,
  URLParamValue,
} from './types.js';
import { maybeFunction } from './utils.js';
import { applyResponseBodyTransformers } from './response-utils.js';
import { composeURL as composeURLUtil } from './url-utils.js';

type SharedFactoryMethods = {
  requireFeature: (featureName: FeatureName) => void;
};

export type SSERequestConfig = {
  templateURLHistory: string[];
  urlParams: Record<string, URLParamValue>;
  queryParams: Record<string, QueryParameterValue>;
  timeout: number;
  logLevel: LogLevel;
  meta: Record<string, any>;
  responseBodyTransformers: ResponseBodyTransformer[];
  sseListeners: SSEListener[];
  errorInterceptors: Array<(error: HTTPError) => boolean | Promise<boolean>>;
};

export type SSEInterceptorControls = {
  abort(): void;
  replaceURL(newURL: string, newURLParams?: Record<string, URLParamValue>): void;
  getProvisionalURL(): string;
  finaliseURL(): string;
  updateQueryParams(params: Record<string, QueryParameterValue>): void;
};

export type SSERequestInterceptor = (
  config: Readonly<SSERequestConfig>,
  controls: SSEInterceptorControls
) => any | Promise<any> | void;

export class SSERequest implements SSERequestType {
  private config: SSERequestConfig;
  private _abortController = new AbortController();
  private logger: LoggerFacade = new ConsoleLogger();
  private factoryMethods: SharedFactoryMethods;
  private finalizedURL?: string;
  private wasUsed = false;
  private timeoutId?: any;
  private interceptors: SSERequestInterceptor[] = [];

  constructor(args: {
    url: string;
    factoryMethods: SharedFactoryMethods;
    defaultConfigBuilders?: Array<(req: SSERequest) => void>;
  }) {
    this.config = {
      templateURLHistory: [args.url],
      urlParams: {},
      queryParams: {},
      timeout: 0,
      logLevel: 'error',
      meta: {},
      responseBodyTransformers: [],
      sseListeners: [],
      errorInterceptors: [],
    };
    this.factoryMethods = args.factoryMethods;
    args.defaultConfigBuilders?.forEach((fn) => fn(this));
  }

  // Builders
  withSSEListeners(...listeners: SSEListener[]) { this.config.sseListeners.push(...listeners); return this; }
  withURLParam(name: string, value: URLParamValue) { this.config.urlParams[name] = value; return this; }
  withURLParams(params: Record<string, URLParamValue>) { Object.assign(this.config.urlParams, params); return this; }
  withQueryParam(name: string, value: QueryParameterValue) { this.config.queryParams[name] = value; return this; }
  withQueryParams(params: Record<string, QueryParameterValue>) { Object.assign(this.config.queryParams, params); return this; }
  withTimeout(ms: number) { this.config.timeout = ms; return this; }
  withLogLevel(level: LogLevel) { this.config.logLevel = level; return this; }
  withMeta(keyOrObj: string | Record<string, any>, val?: any) {
    if (typeof keyOrObj === 'string') this.config.meta[keyOrObj] = val; else Object.assign(this.config.meta, keyOrObj);
    return this;
  }
  withResponseBodyTransformers(...t: ResponseBodyTransformer[]) { this.config.responseBodyTransformers.push(...t); return this; }
  withRequestInterceptors(...i: SSERequestInterceptor[]) { this.interceptors.push(...i); return this; }
  withErrorInterceptors(...i: Array<(error: HTTPError) => boolean | Promise<boolean>>) { this.config.errorInterceptors.push(...i); return this; }
  get abortController() { return this._abortController; }

  private isFinalized() { return typeof this.finalizedURL === 'string'; }

  private composeURL(): string {
    return composeURLUtil({
      templateURLHistory: this.config.templateURLHistory,
      urlParams: this.config.urlParams,
      queryParams: this.config.queryParams,
      evaluateParam: (v) => typeof v === 'function' ? (v as Function)(this.config) : v,
      evaluateQuery: (v) => maybeFunction<any>(v, this.config as any)
    });
  }

  private getLogger() { return this.logger.withMinimumLevel(this.config.logLevel); }
  withLogger(logger: LoggerFacade) { this.logger = logger; return this; }

  private createInterceptorControls(): SSEInterceptorControls {
    return {
      abort: () => { clearTimeout(this.timeoutId); this._abortController.abort(); },
      replaceURL: (newURL: string, newURLParams?: Record<string, URLParamValue>) => {
        if (this.isFinalized()) throw new Error('The request has already been finalised.');
        this.config.templateURLHistory.push(newURL);
        if (newURLParams) this.config.urlParams = newURLParams;
      },
      getProvisionalURL: () => this.composeURL(),
      finaliseURL: () => { if (!this.isFinalized()) this.finalizedURL = this.composeURL(); return this.finalizedURL!; },
      updateQueryParams: (params: Record<string, QueryParameterValue>) => {
        Object.assign(this.config.queryParams, params);
      },
    };
  }

  async execute(): Promise<SSESubscription> {
    if (this.wasUsed) throw new Error('SSERequest cannot be reused. Create a new one each time.');
    this.wasUsed = true;

    this.factoryMethods.requireFeature('sse-request');

    // Interceptors (short-circuit allowed)
    const controls = this.createInterceptorControls();
    for (const i of this.interceptors) {
      const ret = await i({ ...this.config }, controls);
      if (ret !== undefined) {
        // Return as immediate value to listeners after transformers
        const data = await applyResponseBodyTransformers(ret, { responseBodyTransformers: this.config.responseBodyTransformers } as any);
        const fanout = () => this.config.sseListeners.forEach((l) => { try { l(data); } catch (e) { this.getLogger().warn('SSE listener error', e as any); } });
        // no connection; return a dummy subscription resolved immediately
        return { ready: Promise.resolve().then(fanout as any), close() {} } as SSESubscription;
      }
    }

    this.finalizedURL = this.composeURL();

    // Timeout applies to connection attempt only
    if (this.config.timeout) {
      this.timeoutId = setTimeout(() => {
        this.getLogger().debug('SSERequest : connection timeout', `Timeout after ${this.config.timeout} ms`);
        this._abortController.abort();
      }, this.config.timeout);
    }

    // Wire abort -> error interceptors mapping
    this._abortController.signal.addEventListener('abort', async () => {
      const abortError = new HTTPError(-1, 'Request aborted');
      for (const e of this.config.errorInterceptors) { if (await e(abortError)) break; }
    }, { once: true });

    // Create native EventSource directly (headers cannot be customized except Accept)
    let es: EventSource | null = null;
    let readyResolve!: () => void;
    let readyReject!: (err: any) => void;
    const ready = new Promise<void>((resolve, reject) => { readyResolve = resolve; readyReject = reject; });

    try {
      es = new (globalThis as any).EventSource(this.finalizedURL);
    } catch (e) {
      // Initial construction failure
      clearTimeout(this.timeoutId);
      throw new HTTPError(-1, 'Failed to open SSE connection', e as any);
    }

    const handleOpen = () => {
      readyResolve();
    };

    const handleError = async (ev: MessageEvent | Event) => {
      const err = new HTTPError(-1, 'SSE connection error', ev as any);
      for (const e of this.config.errorInterceptors) { if (await e(err)) break; }
      try { readyReject(err); } catch {}
    };

    const handleMessage = async (ev: MessageEvent) => {
      const raw = ev.data;
      let data: any = raw;
      if (typeof raw === 'string') {
        try { data = JSON.parse(raw); } catch { /* leave as string */ }
      }
      try {
        const transformed = await applyResponseBodyTransformers(data, { responseBodyTransformers: this.config.responseBodyTransformers } as any);
        for (const l of this.config.sseListeners) { try { l(transformed); } catch (e) { this.getLogger().warn('SSE listener error', e as any); } }
      } catch (e) {
        this.getLogger().warn('SSERequest : transformer error', e as any);
      }
    };

    es.addEventListener('open', handleOpen as any);
    es.addEventListener('error', handleError as any);
    es.addEventListener('message', handleMessage as any);

    // Wire abort -> close
    const abortListener = () => { try { es?.close(); } catch {} };
    this._abortController.signal.addEventListener('abort', abortListener, { once: true });

    // Clear the timeout once the stream opens
    ready.then(() => { clearTimeout(this.timeoutId); }).catch(() => { clearTimeout(this.timeoutId); });

    return {
      ready,
      close: () => {
        try {
          this._abortController.signal.removeEventListener('abort', abortListener as any);
          es?.removeEventListener('open', handleOpen as any);
          es?.removeEventListener('error', handleError as any);
          es?.removeEventListener('message', handleMessage as any);
          es?.close();
        } catch {}
        es = null;
      }
    } as SSESubscription;
  }
}

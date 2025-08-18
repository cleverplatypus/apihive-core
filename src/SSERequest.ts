import { type LoggerFacade, type LogLevel, ConsoleLogger } from '@apihive/logger-facade';
import HTTPError from './HTTPError.js';
import { applyResponseBodyTransformers } from './response-utils.js';
import type {
  QueryParameterValue,
  ResponseBodyTransformer,
  SSEListener,
  SSERequestType,
  SSESubscription,
  URLParamValue,
  WrappedResponse,
  WrappedSSEResponse
} from './types.js';
import { composeURL as composeURLUtil } from './url-utils.js';

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
  private finalizedURL?: string;
  private wasUsed = false;
  private timeoutId?: any;
  private interceptors: SSERequestInterceptor[] = [];
  private wrapErrors: boolean = false;

  constructor(args: {
    url: string;
    defaultConfigBuilders?: Array<(req: SSERequest) => void>;
    wrapErrors?: boolean;
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
      errorInterceptors: []
    };
    this.wrapErrors = !!args.wrapErrors;
    args.defaultConfigBuilders?.forEach((fn) => fn(this));
  }

  // Builders
  /**
   * Adds the provided SSE listeners to the request.
   *
   * See [SSE Listeners](http://cleverplatypus.github.io/apihive-core/guide/sse-listeners.html) in the docs.
   *
   * @param listeners the listeners to add
   * @returns the request instance
   */
  withSSEListeners(...listeners: SSEListener[]) {
    this.config.sseListeners.push(...listeners);
    return this;
  }
  /**
   * Adds the provided URL parameters to the request.
   *
   * See [URL Parameters](http://cleverplatypus.github.io/apihive-core/guide/url-parameters.html) in the docs.
   *
   * @param listeners the listeners to add
   * @returns the request instance
   */
  withURLParam(name: string, value: URLParamValue) {
    this.config.urlParams[name] = value;
    return this;
  }
  /**
   * Adds the provided URL parameters to the request.
   *
   * See [URL Parameters](http://cleverplatypus.github.io/apihive-core/guide/url-parameters.html) in the docs.
   *
   * @param listeners the listeners to add
   * @returns the request instance
   */
  withURLParams(params: Record<string, URLParamValue>) {
    Object.assign(this.config.urlParams, params);
    return this;
  }
  /**
   * Adds the provided query parameters to the request.
   *
   * See [Query Parameters](http://cleverplatypus.github.io/apihive-core/guide/query-parameters.html) in the docs.
   *
   * @param listeners the listeners to add
   * @returns the request instance
   */
  withQueryParam(name: string, value: QueryParameterValue) {
    this.config.queryParams[name] = value;
    return this;
  }
  /**
   * Adds the provided query parameters to the request.
   *
   * See [Query Parameters](http://cleverplatypus.github.io/apihive-core/guide/query-parameters.html) in the docs.
   *
   * @param listeners the listeners to add
   * @returns the request instance
   */
  withQueryParams(params: Record<string, QueryParameterValue>) {
    Object.assign(this.config.queryParams, params);
    return this;
  }
  /**
   * Sets the timeout for the SSE connection attempt.
   *
   * See [Timeout](http://cleverplatypus.github.io/apihive-core/guide/timeout.html) in the docs.
   *
   * @param listeners the listeners to add
   * @returns the request instance
   */
  withTimeout(ms: number) {
    this.config.timeout = ms;
    return this;
  }
  /**
   * Sets the log level for the request.
   * @param level the log level
   * @returns the request instance
   */
  withLogLevel(level: LogLevel) {
    this.config.logLevel = level;
    return this;
  }
  /**
   * Adds metadata to the request.
   * @param keyOrObj the key or object of metadata
   * @param val the value of metadata
   * @returns the request instance
   */
  withMeta(keyOrObj: string | Record<string, any>, val?: any) {
    if (typeof keyOrObj === 'string') this.config.meta[keyOrObj] = val;
    else Object.assign(this.config.meta, keyOrObj);
    return this;
  }
  /**
   * Adds response body transformers to the request.
   * @param transformers the transformers to add
   * @returns the request instance
   */
  withResponseBodyTransformers(...transformers: ResponseBodyTransformer[]) {
    this.config.responseBodyTransformers.push(...transformers);
    return this;
  }
  /**
   * Adds request interceptors to the request.
   * @param interceptors the interceptors to add
   * @returns the request instance
   */
  withRequestInterceptors(...interceptors: SSERequestInterceptor[]) {
    this.interceptors.push(...interceptors);
    return this;
  }
  /**
   * Adds error interceptors to the request.
   * @param interceptors the interceptors to add
   * @returns the request instance
   */
  withErrorInterceptors(...interceptors: Array<(error: HTTPError) => boolean | Promise<boolean>>) {
    this.config.errorInterceptors.push(...interceptors);
    return this;
  }

  /**
   * Returns the AbortController associated with the request.
   * @returns the AbortController
   */
  get abortController() {
    return this._abortController;
  }

  private isFinalized() {
    return typeof this.finalizedURL === 'string';
  }

  private composeURL(): string {
    return composeURLUtil({
      templateURLHistory: this.config.templateURLHistory,
      urlParams: this.config.urlParams,
      queryParams: this.config.queryParams,
      config: this.config
    });
  }

  private getLogger() {
    return this.logger.withMinimumLevel(this.config.logLevel);
  }
  withLogger(logger: LoggerFacade) {
    this.logger = logger;
    return this;
  }

  private createInterceptorControls(): SSEInterceptorControls {
    return {
      abort: () => {
        clearTimeout(this.timeoutId);
        this._abortController.abort();
      },
      replaceURL: (newURL: string, newURLParams?: Record<string, URLParamValue>) => {
        if (this.isFinalized()) throw new Error('The request has already been finalised.');
        this.config.templateURLHistory.push(newURL);
        if (newURLParams) this.config.urlParams = newURLParams;
      },
      getProvisionalURL: () => this.composeURL(),
      finaliseURL: () => {
        if (!this.isFinalized()) this.finalizedURL = this.composeURL();
        return this.finalizedURL!;
      },
      updateQueryParams: (params: Record<string, QueryParameterValue>) => {
        Object.assign(this.config.queryParams, params);
      }
    };
  }

  async execute(): Promise<SSESubscription | WrappedSSEResponse> {
    if (this.wasUsed) throw new Error('SSERequest cannot be reused. Create a new one each time.');
    this.wasUsed = true;

    // Interceptors (short-circuit allowed)
    const controls = this.createInterceptorControls();
    for (const i of this.interceptors) {
      const ret = await i({ ...this.config }, controls);
      if (ret !== undefined) {
        // Return as immediate value to listeners after transformers
        const data = await applyResponseBodyTransformers(ret, {
          responseBodyTransformers: this.config.responseBodyTransformers
        } as any);
        const fanout = () =>
          this.config.sseListeners.forEach((l) => {
            try {
              l(data);
            } catch (e) {
              this.getLogger().warn('SSE listener error', e as any);
            }
          });
        // no connection; return a dummy subscription resolved immediately
        return { ready: Promise.resolve().then(fanout as any), close() {} } as SSESubscription;
      }
    }

    this.finalizedURL = this.composeURL();

    // Timeout applies to connection attempt only
    if (this.config.timeout) {
      this.timeoutId = setTimeout(() => {
        this.getLogger()
          .debug('SSERequest : connection timeout', `Timeout after ${this.config.timeout} ms`);
        this._abortController.abort();
      }, this.config.timeout);
    }

    // Wire abort -> error interceptors mapping
    this._abortController.signal.addEventListener(
      'abort',
      async () => {
        const abortError = new HTTPError(-1, 'Request aborted');
        for (const e of this.config.errorInterceptors) {
          if (await e(abortError)) break;
        }
      },
      { once: true }
    );

    // Create native EventSource directly (headers cannot be customized except Accept)
    let eventSource: EventSource | null = null;
    let opened = false;
    let readyResolve!: () => void;
    let readyReject!: (err: any) => void;
    const ready = new Promise<void>((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
    });

    try {
      eventSource = new (globalThis as any).EventSource(this.finalizedURL);
    } catch (e) {
      // Initial construction failure
      clearTimeout(this.timeoutId);
      const err = new HTTPError(-1, 'Failed to open SSE connection', e as any);
      // Run error interceptors
      for (const itc of this.config.errorInterceptors) {
        try {
          if (await itc(err)) break;
        } catch {}
      }
      return this.wrapErrors ? ({ error: err } as any) : Promise.reject(err);
    }

    const handleOpen = () => {
      opened = true;
      readyResolve();
    };

    const handleError = async (ev: MessageEvent | Event) => {
      const err = new HTTPError(-1, 'SSE connection error', ev as any);
      for (const e of this.config.errorInterceptors) {
        if (await e(err)) break;
      }
      try {
        readyReject(err);
      } catch {}
    };

    const handleMessage = async (event: MessageEvent) => {
      const raw = event.data;
      let data: any = raw;
      if (typeof raw === 'string') {
        try {
          data = JSON.parse(raw);
        } catch {
          this.getLogger().debug('SSERequest : received non-JSON data', raw);
        }
      }
      try {
        const transformed = await applyResponseBodyTransformers(data, {
          responseBodyTransformers: this.config.responseBodyTransformers
        } as any);
        for (const l of this.config.sseListeners) {
          try {
            l(transformed);
          } catch (e) {
            this.getLogger().warn('SSE listener error', e as any);
          }
        }
      } catch (e) {
        this.getLogger().warn('SSERequest : transformer error', e as any);
      }
    };

    eventSource.addEventListener('open', handleOpen as any);
    eventSource.addEventListener('error', handleError as any);
    eventSource.addEventListener('message', handleMessage as any);

    // Wire abort -> close and reject initial open if not yet opened
    const abortListener = () => {
      try {
        if (!opened) {
          const err = new HTTPError(-1, 'Request aborted');
          try { readyReject(err); } catch {}
        }
        eventSource?.close();
      } catch {}
    };
    this._abortController.signal.addEventListener('abort', abortListener, { once: true });

    // Wait for initial open before returning
    try {
      await ready;
    } catch (err: any) {
      clearTimeout(this.timeoutId);
      // Ensure listeners are removed
      try {
        this._abortController.signal.removeEventListener('abort', abortListener as any);
        eventSource?.removeEventListener('open', handleOpen as any);
        eventSource?.removeEventListener('error', handleError as any);
        eventSource?.removeEventListener('message', handleMessage as any);
        eventSource?.close();
      } catch {}
      eventSource = null;
      return this.wrapErrors ? ({ error: err } as any) : Promise.reject(err);
    }

    clearTimeout(this.timeoutId);

    const subscription: SSESubscription = {
      close: () => {
        try {
          this._abortController.signal.removeEventListener('abort', abortListener as any);
          eventSource?.removeEventListener('open', handleOpen as any);
          eventSource?.removeEventListener('error', handleError as any);
          eventSource?.removeEventListener('message', handleMessage as any);
          eventSource?.close();
        } catch {}
        eventSource = null;
      },
      getEventSource: () => eventSource
    } as any;

    return this.wrapErrors ? ({ subscription } as any) : subscription;
  }
}

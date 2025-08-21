import { type LoggerFacade, type LogLevel, ConsoleLogger } from '@apihive/logger-facade';
import HTTPError from './HTTPError.js';
import type {
  BeforeFetchHook,
  ErrorInterceptor,
  FeatureName,
  FeatureRequestDelegates,
  HeaderValue,
  HTTPMethod,
  ProgressHandlerConfig,
  QueryParameterValue,
  RequestConfig,
  RequestConfigBuilder,
  RequestHashOptions,
  RequestInterceptor,
  RequestInterceptorControls,
  ResponseBodyTransformer,
  ResponseInterceptor,
  ResponseInterceptorControls,
  URLParams,
  URLParamValue,
  WrappedResponse
} from './types.js';
import { maybeFunction } from './utils.js';

import { DEFAULT_JSON_MIME_TYPES, DEFAULT_TEXT_MIME_TYPES } from './constants.js';
import { applyResponseBodyTransformers } from './response-utils.js';
import { composeURL as composeURLUtil } from './url-utils.js';
import { HTTPRequestFactory } from './HTTPRequestFactory.js';

type SharedFactoryMethods = {
  requireFeature: (featureName: FeatureName) => void;
};

type RequestConstructorArgs = {
  url: string;
  method: HTTPMethod;
  defaultConfigBuilders: RequestConfigBuilder[];
  featureDelegates: FeatureRequestDelegates;
  factoryMethods: SharedFactoryMethods;
  wrapErrors: boolean;
  factory : HTTPRequestFactory;
};
/**
 * @remarks This class shouldn't be instanciated directly.<br>Use {@link HTTPRequestFactory} createXXXRequest() instead
 */
export class HTTPRequest {
  // ---------------------------------------------------------------------------
  // Private fields
  // ---------------------------------------------------------------------------
  private configBuilders: RequestConfigBuilder[];
  private wasUsed: boolean = false;
  private logger: LoggerFacade = new ConsoleLogger();
  private config: RequestConfig;
  private timeoutID?: any;
  private fetchBody: RequestInit | null = null;
  private _abortController = new AbortController();
  private readOnlyConfig: RequestConfig | null = null;
  private finalizedURL?: string;
  private beforeFetchHooks: BeforeFetchHook[] = [];
  private featureDelegates: FeatureRequestDelegates;
  private factoryMethods: SharedFactoryMethods;
  private abortListeners: ((event: Event) => void)[] = [];
  private wrapErrors: boolean = false;
  private factory : HTTPRequestFactory;

  // ---------------------------------------------------------------------------
  // Public getters
  // ---------------------------------------------------------------------------
  get abortController() {
    return this._abortController;
  }
  /**
   * Returns the fetch response content in its appropriate format.
   * If progress handlers are enabled, the response will be processed
   * using the download progress handler.
   * 
   * @internal
   * @param response the fetch response
   */
  private readResponse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get('content-type')?.split(/;\s?/)[0];
    if (!contentType) {
      this.getLogger().info(`No content-type header found for response`);
      return null;
    }
    if (this.config.jsonMimeTypes.find((type) => new RegExp(type).test(contentType))) return response.json();

    if (this.config.textMimeTypes.find((type) => new RegExp(type).test(contentType))) {
      return await response.text();
    }

    if (this.config.progressHandlers?.find((handler) => !!handler.download)) {
      this.factoryMethods.requireFeature('download-progress');

      return this.featureDelegates.handleDownloadProgress({
        response,
        abortController: this._abortController,
        config: this.getReadOnlyConfig()
      });
    }

    return await response.blob();
  };

  constructor({ 
      url,
      method,
      defaultConfigBuilders,
      featureDelegates,
      factoryMethods,
      factory,
      wrapErrors = false }: RequestConstructorArgs) {
    this.configBuilders = defaultConfigBuilders;
    this.wasUsed = false;
    this.config = this.createConfigObject(url, method);
    this.featureDelegates = featureDelegates;
    this.factory = factory;
    this.factoryMethods = factoryMethods;
      this.wrapErrors = wrapErrors;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------
  /**
   * Creates a new request config object.
   * 
   * @internal
   * @param url the URL of the request
   * @param method the HTTP method of the request
   * @returns a new request config object
   */
  private createConfigObject(url: string, method: HTTPMethod): RequestConfig {
    const config: RequestConfig = {
      templateURLHistory: [url],
      headers: {},
      body: null,
      timeout: 0,
      ignoreResponseBody: false,
      method,
      // Defaults: match application/json and application/*+json
      jsonMimeTypes: [...DEFAULT_JSON_MIME_TYPES],
      // Defaults: common textual types
      textMimeTypes: [...DEFAULT_TEXT_MIME_TYPES],
      credentials: 'same-origin',
      logLevel: 'error',
      corsMode: 'cors',
      meta: {},
      queryParams: {},
      expectedResponseFormat: 'auto',
      acceptedMIMETypes: ['*/*'],
      urlParams: {},
      errorInterceptors: [],
      responseInterceptors: [],
      requestInterceptors: [],
      responseBodyTransformers: [],
      progressHandlers: [],
    };
    Object.defineProperty(config, 'templateURL', {
      get: () => config.templateURLHistory[config.templateURLHistory.length - 1],
      configurable: false,
      enumerable: true
    });
    return config;
  }

  private isFinalized(): boolean {
    return typeof this.finalizedURL === 'string';
  }

  private throwIfFinalized() {
    if (this.isFinalized()) {
      throw new Error('The request has already been finalised. Request modification is not allowed.');
    }
  }
  private getLogger() {
    return this.logger.withMinimumLevel(this.config.logLevel);
  }

  private setupHeaders() {
    const headers = this.config.headers;
    for (let n in headers) {
      headers[n] = maybeFunction(headers[n], this);
      headers[n] ?? delete headers[n];
    }
    this.fetchBody!.headers = headers as HeadersInit;
  }

  private setupTimeout() {
    if (this.config.timeout) {
      this.timeoutID = setTimeout(() => {
        this.getLogger().debug(
          'HttpRequestFactory : Fetch timeout',
          `Request timeout after ${this.config.timeout / 1000} seconds`
        );
        this._abortController.abort();
      }, this.config.timeout);
    }
    this.getLogger().debug('HttpRequestFactory : Fetch invoked', this.fetchBody);
  }

  private registerAbortListeners() {
    this._abortController.signal.addEventListener('abort', (event) => {
      for (const listener of this.abortListeners) {
        listener(event);
      }
    });
  }
  private setupBody() {
    if (!this.config.body) return;
    if([
      'GET',
      'HEAD',
      'DELETE',
      'TRACE'
    ].includes(this.config.method)) {
      this.getLogger().warn('HTTPRequest.replaceBody', 'HEAD, DELETE, GET or TRACE requests do not have a body');
    }

    this.fetchBody.body = this.config.body();
  }

  // Build the final URL without mutating template or params
  private composeURL(): string {
    return composeURLUtil({
      templateURLHistory: this.config.templateURLHistory,
      urlParams: this.config.urlParams,
      queryParams: this.config.queryParams,
      config: this.config
    });
  }

  // ---------------------------------------------------------------------------
  // Execution
  // ---------------------------------------------------------------------------
  /**
   * Executes the fetch request and returns a Promise that resolves with the parsed result.
   *
   * @returns A Promise that resolves with the result of the request.
   */
  async execute(): Promise<any | WrappedResponse> {
    if (this.wasUsed) {
      throw new Error('HttpRequests cannot be reused. Please call a request factory method for every new call');
    }
    const logger = this.getLogger();

    this.configBuilders.forEach((config) => {
      config(this, this.getReadOnlyConfig());
    });

    this.fetchBody = {
      method: this.config.method,
      mode: this.config.corsMode,

      credentials: this.config.credentials
    };

    this.fetchBody!.signal = this._abortController.signal;

    
    let response;
    try {
      this.setupHeaders();
  
      this.setupTimeout();
  
      
      this.wasUsed = true;
      
      // Create controls for interceptors
      const requestInterceptorControls = this.createRequestInterceptorControls();
      
      for (const interceptor of this.config.requestInterceptors || []) {
        let skipBodyTransformers = false;
        let interceptorResponse = await interceptor({
          config: this.getReadOnlyConfig(), 
          controls : {
          ...requestInterceptorControls,
          skipBodyTransformers: () => {
            skipBodyTransformers = true;
          }, 
        },
        factory : this.factory
        });
        if (interceptorResponse === undefined) {
          continue;
        }
        if(!skipBodyTransformers)
          interceptorResponse = await applyResponseBodyTransformers(interceptorResponse, this.getReadOnlyConfig());

        return this.wrapErrors ? { response: interceptorResponse } : interceptorResponse;
      }
      this.setupBody();
      this.finalizedURL = this.composeURL();

      logger.debug('HttpRequestFactory : Fetch url to be called', this.finalizedURL);
      if (this.config.progressHandlers?.find((handler) => !!handler.upload)) {
        this.factoryMethods.requireFeature('upload-progress');
      }
      for (const hook of this.beforeFetchHooks) {
        // Keep mutable config for hooks to support adapters/tests that set fetchImpl dynamically
        await hook(this.fetchBody, this.config as any);
      }
      const fetchImpl = this.featureDelegates.getFetchImpl?.(this.getReadOnlyConfig()) || globalThis.fetch;

      this.registerAbortListeners();
      response = await fetchImpl(this.finalizedURL, this.fetchBody);

      logger.trace('HttpRequestFactory : Fetch response', response);

      if (this.config.responseInterceptors.length) {
        const responseControls = this.createResponseControls();
        for (const interceptor of this.config.responseInterceptors) {
          let skipBodyTransformers = false;

          let interceptorResponse = await interceptor({
            response,
            config: this.getReadOnlyConfig(),
            controls: {
              ...responseControls,
              skipBodyTransformers: () => {
                skipBodyTransformers = true;
              }
            },
            factory: this.factory
          });
          if (interceptorResponse !== undefined) {
            if (!skipBodyTransformers) {
              interceptorResponse = await applyResponseBodyTransformers(interceptorResponse, this.getReadOnlyConfig());
            }
            return this.wrapErrors ? { response: interceptorResponse } : interceptorResponse;
          }
        }
      }
      if (response.ok) {
        if (this.config.ignoreResponseBody || response.status === 204) {
          return this.wrapErrors ? { response: undefined } : undefined;
        }
        let body = await this.readResponse(response);
        body = await applyResponseBodyTransformers(body, this.getReadOnlyConfig());
        return this.wrapErrors ? { response: body } : body;
      } else {
        const error = new HTTPError(response.status, response.statusText, await this.readResponse(response));
        for (const interceptor of this.config.errorInterceptors || []) {
          if (await interceptor(error)) {
            break;
          }
        }
        return this.wrapErrors ? { error } : Promise.reject(error);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        const abortError = new HTTPError(-1, 'Request aborted');
        // Call error interceptors for abort errors
        for (const interceptor of this.config.errorInterceptors || []) {
          if (await interceptor(abortError)) {
            break;
          }
        }
        return this.wrapErrors ? { error: abortError } : Promise.reject(abortError);
      }

      logger.error('HttpRequestFactory : Fetch error', {
        type: 'fetch-error',
        endpoint: this.composeURL(),
        details: error
      });

      // Convert network error to HTTPError and call error interceptors
      const httpError = new HTTPError(-1, error.message || 'Network error', error);
      for (const interceptor of this.config.errorInterceptors || []) {
        if (await interceptor(httpError)) {
          break;
        }
      }

      return this.wrapErrors ? { error: httpError } : Promise.reject(httpError);
    } finally {
      clearTimeout(this.timeoutID);
    }
  }

  // ---------------------------------------------------------------------------
  // Read-only configuration view
  // ---------------------------------------------------------------------------
  /**
   * Retrieves a read-only copy of configuration with lazy evaluation.
   * Function-based values (body, headers) are only evaluated when accessed.
   *
   * @returns A read-only configuration object with lazy evaluation.
   */
  getReadOnlyConfig(): RequestConfig {
    if (this.readOnlyConfig) return this.readOnlyConfig;
    // IMPORTANT: Proxy the live config object (no cloning) so updates remain visible.
    const target = this.config;

    const readonly = new Proxy(target, {
      get: (t, prop: string | symbol) => {
        // Expose finalURL if finalized; warn if accessed prematurely
        if (prop === 'finalURL') {
          if (!this.isFinalized()) {
            this.getLogger().warn('HttpRequestFactory : Access to finalURL before URL finalisation', {
              type: 'final-url-access-before-finalise'
            });
            return undefined;
          }
          return this.finalizedURL;
        }

        // Expose the current template URL tip
        if (prop === 'templateURL') {
          const tip = t.templateURLHistory[t.templateURLHistory.length - 1];
          return tip;
        }

        if (prop === 'body') {
          try {
            return maybeFunction(t.body, readonly);
          } catch (error) {
            this.getLogger().warn('HttpRequestFactory : Error evaluating body', {
              type: 'body-error',
              endpoint: target.templateURL,
              details: error
            });
            return null;
          }
        }

        if (prop === 'headers') {
          const headersTarget = t.headers || {};
          return new Proxy(headersTarget as Record<string, any>, {
            get: (hTarget, hProp: string | symbol) => {
              const headerValue = hTarget[hProp as string];
              try {
                return maybeFunction(headerValue, readonly);
              } catch (error) {
                this.getLogger().warn('HttpRequestFactory : Error evaluating header', {
                  type: 'header-error',
                  key: String(hProp),
                  endpoint: target.templateURL,
                  details: error
                });
                return undefined;
              }
            },
            ownKeys: (hTarget) => Object.keys(hTarget),
            getOwnPropertyDescriptor: (hTarget, hProp) => {
              if (Object.prototype.hasOwnProperty.call(hTarget, hProp)) {
                let evaluatedValue: any;
                try {
                  evaluatedValue = maybeFunction(hTarget[hProp as string], readonly);
                } catch (error) {
                  this.getLogger().warn('HttpRequestFactory : Error evaluating header', {
                    type: 'header-error',
                    key: String(hProp),
                    endpoint: target.templateURL,
                    details: error
                  });
                  evaluatedValue = undefined;
                }
                return {
                  enumerable: true,
                  configurable: false,
                  writable: false,
                  value: evaluatedValue
                } as PropertyDescriptor;
              }
              return undefined;
            },
            set: () => false,
            deleteProperty: () => false
          });
        }

        return (t as any)[prop as any];
      },
      set: () => false,
      deleteProperty: () => false
    });

    this.readOnlyConfig = readonly as unknown as RequestConfig;
    return this.readOnlyConfig;
  }

  /**
   * Creates request controls for interceptors to manipulate the request during execution.
   * @internal
   */
  private createRequestInterceptorControls(): RequestInterceptorControls {
    return {
      abort: () => {
        //Makes sure that any existing timeout is cleared not to invoke
        //the abort controller later
        if (this.timeoutID) {
          clearTimeout(this.timeoutID);
        }
        this._abortController.abort();
      },

      replaceURL: (newURL: string) => {
        this.throwIfFinalized();
        // Push new template (absolute or relative), placeholders allowed
        if(newURL)
          this.config.templateURLHistory.push(newURL);
      },

      replaceURLParams: (newURLParams: URLParams) => {
        this.throwIfFinalized();
        if (newURLParams) {
          this.config.urlParams = newURLParams;
        }
      },

      getProvisionalURL: () => {
        return this.composeURL();
      },

      updateHeaders: (headers: Record<string, string | null>) => {
        this.throwIfFinalized();
        Object.assign(this.config.headers, headers);
        this.setupHeaders();
      },

      finaliseURL: (): string => {
        if (!this.isFinalized()) {
          this.finalizedURL = this.composeURL();
        }
        return this.finalizedURL!;
      },

      replaceBody: (replacer: (body: any) => any) => {
        this.throwIfFinalized();
        const oldBody = this.config.body();
        this.config.body = () => {
          return replacer(oldBody);
        }
      },

      getHash: (options?: RequestHashOptions) => {
        this.factoryMethods.requireFeature('request-hash');
        return this.getHash(options);
      },

      getLogger: () => this.getLogger(),

      /**
       * Skips body transformers for the response
       */
      skipBodyTransformers: () => null
        
    };
  }

  /**
   * Creates response controls for response interceptors.
   * @internal
   */
  private createResponseControls(): Omit<ResponseInterceptorControls, 'skipBodyTransformers'> {
    return {
      getLogger: () => this.getLogger(),
      getHash: (options?: RequestHashOptions) => this.getHash(options)
    };
  }

  // ---------------------------------------------------------------------------
  // Configuration builders
  // ---------------------------------------------------------------------------
  /**
   * Configures the request with metadata that can be inspected later.
   *
   * @param param1 The key or object containing the key-value pairs to update the meta property.
   * @param param2 The value to associate with the key when param1 is a string.
   * @returns The current object instance for method chaining.
   */
  withMeta(param1: string | Record<string, any>, param2?: any) {
    this.throwIfFinalized();
    if (typeof param1 === 'string') {
      this.config.meta[param1] = param2;
    } else if (typeof param1 === 'object') {
      Object.assign(this.config.meta, param1);
    }
    return this;
  }

  /**
   * Sets an LoggerFacade compatible logger for the request.
   * Normally the logger will be set by the factory.
   *
   * @param logger The logger to be set.
   * @returns The updated HTTP request instance.
   */
  withLogger(logger: LoggerFacade) {
    this.throwIfFinalized();
    this.logger = logger;
    return this;
  }

  // Note: SSE-specific builders have been moved to SSERequest

  /**
   * Sets the credentials policy for the HTTP request.
   *
   * @param config The configuration for the credentials.
   * @returns The updated HTTP request instance.
   */
  withCredentialsPolicy(config: RequestCredentials): HTTPRequest {
    this.throwIfFinalized();
    this.config.credentials = config;
    return this;
  }

  /**
   * Clears the config builders array and returns the instance.
   * Useful in cases where you want to create a new request that doesn't inherit
   * from API/factory settings that might have headers or other unwanted configuration
   *
   * @returns the updated request
   */
  blank() {
    this.throwIfFinalized();
    this.configBuilders.splice(0, this.configBuilders.length);
    return this;
  }

  /**
   * Adds an abort handler to the request.
   *
   * @param handler The abort handler to add.
   * @returns The updated request instance.
   */
  withAbortListener(handler: (event: Event) => void) {
    this.abortListeners.push(handler);
    return this;
  }

  // ---------------------------------------------------------------------------
  // MIME type helpers
  // ---------------------------------------------------------------------------
  /**
   * Sets the accepted MIME types for the request.
   *
   * Short hand for `withHeader('Accept', 'application/json')`
   *
   * @param mimeTypes An array of MIME types to accept.
   * @returns The updated request instance.
   */
  withAccept(...mimeTypes: string[]) {
    this.throwIfFinalized();
    this.config.acceptedMIMETypes = mimeTypes;
    return this;
  }
  /**
   * Adds a URL parameter to the request configuration.
   *
   * @param name The name of the URL parameter.
   * @param value The value of the URL parameter.
   * @returns The updated request instance.
   */
  withURLParam(name: string, value: URLParamValue) {
    this.throwIfFinalized();
    this.config.urlParams[name] = value;
    return this;
  }

  /**
   * Assigns multiple query params to the request configuration.
   *
   * @param params The URL parameters to assign.
   * @returns The updated request instance.
   */
  withURLParams(params: Record<string, URLParamValue>) {
    this.throwIfFinalized();
    Object.assign(this.config.urlParams, params);
    return this;
  }

  /**
   * Sets the request body to a form encoded string.
   *
   * @param data The form encoded string to set as the request body.
   * @returns The updated request instance.
   */
  withFormEncodedBody(data: string) {
    this.throwIfFinalized();
    this.withHeader('content-type', 'application/x-www-form-urlencoded');
    this.config.body = () => {
      return data;
    };
    return this;
  }

  /**
   * Adds error interceptors to the request configuration.
   *
   * Error interceptors are executed in the order they are added.
   * - If an error interceptor returns a rejected promise, the request will fail.
   * - If an error interceptor returns a resolved promise, the promise's result will be used as the response.
   * - If the interceptor returns `undefined`, the request will continue to the next interceptor, if present, or to the regular request handling
   *
   * See [Error Interceptors](https://cleverplatypus.github.io/apihive-core/guide/error-interceptors.html)
   *
   * @param interceptors The error interceptors to add.
   * @returns The updated request instance.
   */
  withErrorInterceptors(...interceptors: ErrorInterceptor[]) {
    this.throwIfFinalized();
    this.config.errorInterceptors.push(...interceptors);
    return this;
  }

  /**
   * Adds a request interceptor to the request configuration.
   * Interceptors are executed in the order they are added.
   * - If a request interceptor returns a rejected promise, the request will fail.
   * - If a request interceptor returns a resolved promise, the promise's result will be used as the response.
   * - If the interceptor returns `undefined`, the request will continue to the next interceptor, if present, or to the regular request handling
   * - the interceptor's second parameter is is a function that can be used to remove the interceptor from further request handling
   *
   * @param interceptors The interceptors to add.
   * @returns The updated request instance.
   */
  withRequestInterceptors(...interceptors: RequestInterceptor[]) {
    this.throwIfFinalized();
    this.config.requestInterceptors.push(...interceptors);
    return this;
  }

  /**
   * Set the request body as a JSON object or string.
   *
   * @param json The JSON object or string to set as the request body.
   * @returns The updated request instance.
   */
  withJSONBody(json: any) {
    this.throwIfFinalized();
    this.withHeader('content-type', 'application/json');
    this.config.body = () => {
      switch (typeof json) {
        case 'string':
          try {
            JSON.parse(json);

            return json;
          } catch {
            //do nothing. logging below
          }
          break;
        case 'object':
          return JSON.stringify(json);
      }
      this.getLogger().error('POSTHttpRequest.withJSONBody', 'Passed body is not a valid JSON string', json);
    };
    return this;
  }

  /**
   * Set the request body to a FormData object and allows customizing the form data before sending the request.
   *
   * @param composerCallBack The callback function that customizes the FormData object
   * @returns The updated request instance.
   */
  withFormDataBody(
    composerCallBack: (formData: FormData) => void = () => {
      throw new Error('No composer callback provided');
    }
  ): HTTPRequest {
    this.throwIfFinalized();
    this.config.body = () => {
      const formData = new FormData();
      composerCallBack(formData);
      return formData;
    };
    return this;
  }

  /**
   * Short-hand for setting the accepted MIME types to ['*\/*'] which means the API accepts any MIME type.
   *
   * @returns The current object instance.
   */
  withAcceptAny() {
    this.throwIfFinalized();
    this.config.acceptedMIMETypes = ['*/*'];
    return this;
  }

  /**
   * When called, the request will not try to parse the response
   *
   * @returns The updated request instance.
   */
  ignoreResponseBody() {
    this.throwIfFinalized();
    this.config.ignoreResponseBody = true;
    return this;
  }

  /**
   * Adds multiple query parameters to the existing query parameters
   * of the API configuration.
   *
   * Parameter values can be literal values or a function that receives
   * the request config as an argument and returns a value.
   *
   * See [Query Parameters](https://cleverplatypus.github.io/apihive-core/guide/query-parameters.html)
   *
   * @param params The query parameters
   * to be added.
   * @returns The updated request instance.
   */
  withQueryParams(params: Record<string, QueryParameterValue>) {
    this.throwIfFinalized();
    Object.assign(this.config.queryParams, params);
    return this;
  }

  /**
   * Adds a query parameter to the request.
   *
   * The value can be a literal value or a function that receives
   * the request config as an argument and returns a value.
   *
   * @param name The name of the query parameter.
   * @param value The value of the query parameter.
   * @returns The updated request instance.
   */
  withQueryParam(name: string, value: QueryParameterValue) {
    this.throwIfFinalized();
    this.config.queryParams[name] = value;
    return this;
  }

  /**
   * Sets the CORS mode to 'no-cors' and returns the current object.
   *
   * @returns The current object.
   */
  withNoCors() {
    this.throwIfFinalized();
    this.config.corsMode = 'no-cors';
    return this;
  }

  /**
   * Sets the MIME types that are considered JSON on top of the default
   * patterns.
   *
   * @param mimeTypes The MIME types to add.
   * @returns The updated request instance.
   */
  withJSONMimeTypes(...mimeTypes: string[]) {
    this.throwIfFinalized();
    // Extend current patterns (avoid replacing defaults)
    this.config.jsonMimeTypes = [...this.config.jsonMimeTypes, ...mimeTypes];
    return this;
  }

  /**
   * Sets the MIME types that are considered text on top of the default
   * patterns.
   *
   * @param mimeTypes The MIME types to add.
   * @returns The updated request instance.
   */
  withTextMimeTypes(...mimeTypes: string[]) {
    this.throwIfFinalized();
    // Extend current patterns (avoid replacing defaults)
    this.config.textMimeTypes = [...this.config.textMimeTypes, ...mimeTypes];
    return this;
  }

  /**
   *
   * @param level the log level to apply for this request
   * Overrides the default log level.
   * @returns The updated request instance.
   */
  withLogLevel(level: LogLevel) {
    this.throwIfFinalized();
    this.config.logLevel = level;
    return this;
  }

  /**
   * Sets the request headers for the request.
   * Header values can be literal values or a function that receives
   * the request config as an argument and returns a value.
   *
   * If the value is undefined, the corresponding header will be removed if present
   *
   * @param {Object} headers name-value pairs to set as headers
   * @returns The updated request instance.
   */
  withHeaders(headers: Record<string, HeaderValue>) {
    this.throwIfFinalized();
    if (typeof headers === 'object') {
      const normalised = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
      Object.assign(this.config.headers, normalised);
    }
    return this;
  }

  /**
   * Sets a single header for the request.
   * Header values can be literal values or a function that receives
   * the request config as an argument and returns a value.
   *
   * If the value is undefined, the corresponding header will be removed if present
   *
   * @param name header name
   * @param value the value for the header, omit this parameter to remove the header
   * @returns The updated request instance.
   */
  withHeader(name: string, value: HeaderValue) {
    this.throwIfFinalized();
    this.config.headers[name.toLowerCase()] = value;
    return this;
  }

  /**
   * Sets the response body transformer for the request. The provided function will be called
   * after the request body is parsed.
   * This is especially useful when used in conjuncion with APIs definition
   * to hide some data massaging logic specific to the api.
   *
   * Transformers are executed in the order they are added.
   *
   * @param transformers The response body transformers to apply.
   * @returns The updated request object.
   */
  withResponseBodyTransformers(...transformers: ResponseBodyTransformer[]) {
    this.throwIfFinalized();
    this.config.responseBodyTransformers.push(...transformers);
    return this;
  }

  /**
   *
   * @param timeout milliseconds to wait before failing the request as timed out
   * @returns The updated request instance.
   */
  withTimeout(timeout: number) {
    this.throwIfFinalized();
    this.config.timeout = timeout;
    return this;
  }

  /**
   *
   * @param interceptors The response interceptors to apply.
   * 
   * See [Response Interceptors](https://cleverplatypus.github.io/apihive-core/guide/response-interceptors.html)
   * 
   * @returns The updated request instance.
   */
  withResponseInterceptors(...interceptors: Array<ResponseInterceptor>): HTTPRequest {
    this.config.responseInterceptors.push(...interceptors);
    return this;
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------
  /**
   * Generates a hash of the request configuration.
   * The hash is deterministic and includes method, URL, relevant headers,
   * query parameters, and body content to ensure consistent identification.
   * This key can be used for request caching purposes.
   * 
   * @remarks This is an optional feature (request-hash) that must be enabled on the factory.
   *
   * @returns {string} A unique hash-based identifier for this request
   */
  getHash(options?: RequestHashOptions): string {
    this.factoryMethods.requireFeature('request-hash');
    return this.featureDelegates.getHash(this, options);
  }

  // ---------------------------------------------------------------------------
  // Progress and abort
  // ---------------------------------------------------------------------------
  /**
   * Adds progress handlers for the request.
   * 
   * See [Progress Handlers](https://cleverplatypus.github.io/apihive-core/guide/progress-handlers.html)
   * 
   * @remarks This is an optional feature (download-progress and upload-progress) that must be enabled on the factory.
   * @param handlers The progress handlers to apply.
   * @returns The updated request object.
   */
  withProgressHandlers(...handlers: ProgressHandlerConfig[]): HTTPRequest {
    if (handlers.some((handler) => handler.download)) this.factoryMethods.requireFeature('download-progress');
    if (handlers.some((handler) => handler.upload)) this.factoryMethods.requireFeature('upload-progress');
    this.config.progressHandlers.push(...handlers);
    return this;
  }

  /**
   * Adds a {@link BeforeFetchHook} for the request.
   * 
   * @param hook The before fetch hook to apply.
   * @returns The updated request object.
   */
  withBeforeFetchHook(hook: BeforeFetchHook): HTTPRequest {
    this.beforeFetchHooks.push(hook);
    return this;
  }
}

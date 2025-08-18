import { type LoggerFacade, type LogLevel, ConsoleLogger } from '@apihive/logger-facade';
import { HTTPRequest } from './HTTPRequest.js';
import { Adapter, AdapterOptions } from './adapter-types.js';
import {
  APIConfig,
  BeforeFetchHook,
  Endpoint,
  ErrorInterceptor,
  Feature,
  FeatureFactoryDelegates,
  FeatureName,
  FeatureRequestDelegates,
  HeaderValue,
  HTTPMethod,
  ProgressHandlerConfig,
  QueryParameterValue,
  RequestConfig,
  RequestConfigBuilder,
  RequestInterceptor,
  ResponseBodyTransformer,
  URLParamValue
} from './types.js';

/**
 * HTTPRequestFactory is the entry point of @APIHive/core.
 * Instantiate this class to create HTTP requests
 * either directly with the create[VERB]Request() methods
 * or by defining an API and calling the createAPIRequest() method.
 *
 * The factory can have defaults that can be applied to every request
 * or conditionally using the when() builder method.
 *
 * Request/Response interceptors and response body transformers can be added to the factory
 * to customise the request and response processing.
 *
 * Adapters can be created or chosen from third parties and added to the factory
 * to provide additional functionality for common use cases such as
 * request caching, logging, transformation, auto-api generation etc.
 */
export class HTTPRequestFactory {
  // ---------------------------------------------------------------------------
  // Private fields
  // ---------------------------------------------------------------------------
  private requestDefaults: RequestConfigBuilder[] = [];
  private apiConfigs: { [key: string]: APIConfig } = {};
  private _logger: LoggerFacade = new ConsoleLogger();
  private _logLevel: LogLevel = 'error';
  private afterRequestCreatedHooks: ((request: HTTPRequest) => void)[] = [];
  private enabledFeatures: Map<string, Feature> = new Map();
  /**
   * @internal Keeps a mapping of defaults for interceptors to allow removing them
   */
  private interceptorsToRequestDefaults: Map<RequestInterceptor, RequestConfigBuilder> = new Map();
  private requestDelegates: FeatureRequestDelegates = {} as FeatureRequestDelegates;
  private factoryDelegates: FeatureFactoryDelegates = {} as FeatureFactoryDelegates;
  private wrapErrors: boolean = false;
  private baseURL: string | null = null;

  // ---------------------------------------------------------------------------
  // Public getters
  // ---------------------------------------------------------------------------
  get logger() {
    return this._logger;
  }

  get logLevel() {
    return this._logLevel;
  }

  // ---------------------------------------------------------------------------
  // Feature system
  // ---------------------------------------------------------------------------

  /**
   * Enables a feature in the factory.
   *
   * To minimise the size of the module's bundle, some less used pieces
   * of functionality are not included by default:
   * - progress handlers
   * - request hash generation
   * - adapters API
   *
   * To enable any of these features, import the feature from the
   * @apihive/core/features/[feature-name] and call this method
   * with the feature object.
   *
   * @param feature a reference to a supported feature
   * @returns the factory instance
   */
  use(feature: Feature) {
    this.enabledFeatures.set(feature.name, feature);
    feature.apply?.(this, {
      addRequestDefaults: (...args: RequestConfigBuilder[]) => {
        this.requestDefaults.push(...args);
      },
      removeRequestDefaults: (...args: RequestConfigBuilder[]) => {
        this.requestDefaults = this.requestDefaults.filter((defaultFn) => !args.includes(defaultFn));
      },
      afterRequestCreated: (hook: (request: HTTPRequest) => void) => {
        this.afterRequestCreatedHooks.push(hook);
      },
      beforeFetch: (hook: BeforeFetchHook) => {
        this.requestDefaults.push((request: HTTPRequest) => request.withBeforeFetchHook(hook));
      }
    });
    if (feature.getDelegates) {
      const delegates = feature.getDelegates(this);
      if (delegates.request) {
        Object.assign(this.requestDelegates, delegates.request);
      }
      if (delegates.factory) {
        Object.assign(this.factoryDelegates, delegates.factory);
      }
    }
    return this;
  }

  private requireFeature(featureName: FeatureName) {
    if (!this.enabledFeatures.has(featureName)) {
      throw new Error(`Feature "${featureName}" not enabled. Call factory.use(featureObj).`);
    }
  }

  // ---------------------------------------------------------------------------
  // Defaults configuration
  // ---------------------------------------------------------------------------

  /**
   * Enables factory-wide wrapping of results into a `{ response? , error? }` object.
   * 
   * This leverages a fail-fast programming style without try/catch blocks.
   * 
   * @example
   * ```typescript
   * const factory = new HTTPRequestFactory()
   *   .withWrappedResponseError();
   * 
   * const {response, error} = await factory
   *   .createGETRequest('https://httpbin.org/json')
   *   .execute();
   * 
   * if (error) { //fail fast
   *   console.error('TODO: handle error', error);
   *   return;
   * }
   * 
   * console.log('deal with response', response);
   * 
   * ```
   * 
   * @returns the factory instance
   */
  withWrappedResponseError() {
    this.wrapErrors = true;
    return this;
  }  
  
  /**
   * Sets the logger adapter for the factory.
   
   * @param logger a logger complying with the LoggerFacade interface
   * @returns the factory instance
   */
  withLogger(logger: LoggerFacade) {
    this._logger = logger;
    this.requestDefaults.push((request: HTTPRequest) => request.withLogger(logger));
    return this;
  }

  /**
   * Sets the log level for the factory.
   *
   * @param level the log level to set
   * @returns the factory instance
   */
  withLogLevel(level: LogLevel) {
    this._logLevel = level;
    this.requestDefaults.push((request: HTTPRequest) => request.withLogLevel(level));
    return this;
  }

  /**
   * Sets the default accept header to the factory defaults.
   *
   * @param mimeTypes the MIME types to accept
   * @returns the factory instance
   */
  withAccept(...mimeTypes: Array<string>) {
    this.requestDefaults.push((request: HTTPRequest) => request.withAccept(...mimeTypes));
    return this;
  }

  /**
   * Adds multiple query parameters to the factory defaults.
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
  withQueryParams(params : Record<string, QueryParameterValue>) {
    this.requestDefaults.push((request: HTTPRequest) => request.withQueryParams(params));
    return this;
  }

  /**
   * Adds a query parameter to the factory defaults.
   *
   * The value can be a literal value or a function that receives
   * the request config as an argument and returns a value.
   *
   * @param name The name of the query parameter.
   * @param value The value of the query parameter.
   * @returns The updated request instance.
   */
  withQueryParam(key: string, value: QueryParameterValue) {
    this.requestDefaults.push((request: HTTPRequest) => request.withQueryParam(key, value));
    return this;
  }

  /**
   * Adds multiple URL parameters to the factory defaults.
   * 
   * URL parameters are used to replace {{placeholders}} in the URL template.
   * Their value can be a literal value or a function that receives
   * the request config as an argument and returns a value.
   *
   * @param params The URL parameters to add.
   * @returns The updated request instance.
   */
  withURLParams(params: Record<string, URLParamValue>) {
    this.requestDefaults.push((request: HTTPRequest) => request.withURLParams(params));
    return this;
  }

  /**
   * Adds a URL parameter to the factory defaults.
   * 
   * URL parameters are used to replace {{placeholders}} in the URL template.
   * Their value can be a literal value or a function that receives
   * the request config as an argument and returns a value.
   *
   * @param name The name of the URL parameter.
   * @param value The value of the URL parameter.
   * @returns The updated request instance.
   */
  withURLParam(key: string, value: URLParamValue) {
    this.requestDefaults.push((request: HTTPRequest) => request.withURLParam(key, value));
    return this;
  }
  
  /**
   * Sets the default [value] for the header [key] to the factory defaults.
   *
   * @param key the header key
   * @param value the header value
   * @returns the factory instance
   */
  withHeader(key: string, value: string | ((config: RequestConfig) => string)) {
    this.requestDefaults.push((request: HTTPRequest) => request.withHeader(key, value));
    return this;
  }

  /**
   * Sets the value for the passed key/value pairs of headers to the factory defaults.
   *
   * @param headers a key/value pair of headers to set
   * @returns the factory instance
   */
  withHeaders(headers: Record<string, HeaderValue>) {
    if (typeof headers === 'object') {
      for (const name of Object.keys(headers)) {
        this.requestDefaults.push((request: HTTPRequest) => request.withHeader(name, headers[name]));
      }
    }
    return this;
  }

  /**
   * Sets the default credentials policy to the factory defaults.
   *
   * @param config the credentials policy to set
   * @returns the factory instance
   */
  withCredentialsPolicy(config: RequestCredentials) {
    this.requestDefaults.push((request: HTTPRequest) => request.withCredentialsPolicy(config));
    return this;
  }

  /**
   * Sets the default base URL for requests created with a relative URL.
   *
   * @param baseURL the base URL to set
   * @returns the factory instance
   */
  withBaseURL(baseURL: string) {
    this.baseURL = baseURL;
    return this;
  }
  

  // ---------------------------------------------------------------------------
  // Interceptors and transformers
  // ---------------------------------------------------------------------------

  /**
   * Adds the provided request interceptors to the factory defaults.
   * See [Request Interceptors](http://cleverplatypus.github.io/apihive-core/guide/request-interceptors.html) in the documentation
   *
   * @param interceptors the interceptors to add
   * @returns the factory instance
   */
  withRequestInterceptors(...interceptors: RequestInterceptor[]) {
    for (const interceptor of interceptors) {
      const defaultFn = function (request: HTTPRequest) {
        request.withRequestInterceptors(interceptor);
      };
      this.requestDefaults.push(defaultFn);
      this.interceptorsToRequestDefaults.set(interceptor, defaultFn);
    }
    return this;
  }

  /**
   * Adds the provided error interceptors to the factory defaults.
   * See [Error Interceptors](http://cleverplatypus.github.io/apihive-core/guide/error-interceptors.html) in the documentation
   *
   * @param interceptors the interceptors to add
   * @returns the factory instance
   */
  withErrorInterceptors(...interceptors: ErrorInterceptor[]) {
    this.requestDefaults.push((request) => {
      request.withErrorInterceptors(...interceptors);
    });
    return this;
  }

  /**
   * Adds the provided response body transformers to the factory defaults.
   * See [Response Body Transformers](http://cleverplatypus.github.io/apihive-core/guide/response-body-transformers.html) in the documentation
   *
   * @param transformers the transformers to add
   * @returns the factory instance
   */
  withResponseBodyTransformers(...transformers: ResponseBodyTransformer[]) {
    this.requestDefaults.push(
      ...transformers.map((transformer) => (request: HTTPRequest) => request.withResponseBodyTransformers(transformer))
    );
    return this;
  }

  // ---------------------------------------------------------------------------
  // MIME type helpers
  // ---------------------------------------------------------------------------
  /**
   * Instructs the factory to treat response mime types that match
   * the provided regexp as JSON when the library's default
   * JSON types matching is not enough.
   *
   * @param mimeTypes the MIME types to add
   * @returns the factory instance
   */
  withJSONMimeTypes(...mimeTypes: string[]) {
    this.requestDefaults.push((request) => {
      request.withJSONMimeTypes(...mimeTypes);
    });
    return this;
  }

  /**
   * Instructs the factory to treat response mime types that match
   * the provided regexp as text when the library's default
   * text types matching is not enough.
   *
   * @param mimeTypes the MIME types to add
   * @returns the factory instance
   */
  withTextMimeTypes(...mimeTypes: string[]) {
    this.requestDefaults.push((request) => {
      request.withTextMimeTypes(...mimeTypes);
    });
    return this;
  }

  // ---------------------------------------------------------------------------
  // Progress and abort
  // ---------------------------------------------------------------------------

  /**
   * Adds the provided progress handlers to the factory defaults.
   * See [Progress Handlers](http://cleverplatypus.github.io/apihive-core/guide/progress-handlers.html) in the documentation
   *
   * @param handlers the handlers to add
   * @returns the factory instance
   */
  withProgressHandlers(...handlers: ProgressHandlerConfig[]): HTTPRequestFactory {
    if (handlers.some((handler) => handler.download) && !this.requestDelegates.handleDownloadProgress)
      this.requireFeature('download-progress');

    if (handlers.some((handler) => handler.upload) && !this.requestDelegates.handleUploadProgress)
      this.requireFeature('upload-progress');

    this.requestDefaults.push((request: HTTPRequest) => request.withProgressHandlers(...handlers));
    return this;
  }

  /**
   * Adds the provided abort listener to the factory defaults.
   * See [Abort Listeners](http://cleverplatypus.github.io/apihive-core/guide/abort-listeners.html) in the documentation
   *
   * @param listener the listener to add
   * @returns the factory instance
   */
  withAbortListener(listener: (event: Event) => void) {
    this.requestDefaults.push((request: HTTPRequest) => {
      request.withAbortListener(listener);
    });
    return this;
  }

  // ---------------------------------------------------------------------------
  // Conditional Building
  // ---------------------------------------------------------------------------
  /**
   * Call this to reset any conditions in the method chain set by {@link when}
   *
   * See [Conditional Building](http://cleverplatypus.github.io/apihive-core/guide/conditional-building.html) in the docs.
   */
  always() {
    return this;
  }

  /**
   * Adds a condition for the application of method-chain settings. It can be reset by calling {@link always}
   *
   * See [Conditional Building](http://cleverplatypus.github.io/apihive-core/guide/conditional-building.html) in the docs.
   */
  when(condition: (config: RequestConfig) => boolean) {
    const proxy = new Proxy(this, {
      get: (target, prop) => {
        if (prop === 'always') {
          return () => target;
        }

        if (prop === 'when') {
          return (condition: (config: RequestConfig) => boolean) => target.when(condition);
        }

        if (typeof (target as any)[prop] === 'function' && prop.toString().startsWith('with')) {
          return (...args: any[]) => {
            const fn = (request: HTTPRequest, config: RequestConfig) => {
              if (condition(config)) {
                (request as any)[prop](...args);
              }
            };
            this.requestDefaults.push(fn);
            return this;
          };
        }

        return (target as any)[prop as any];
      }
    });

    return proxy as any;
  }

  /**
   * Removes a request interceptor from the factory defaults.
   *
   * See [Request Interceptors](http://cleverplatypus.github.io/apihive-core/guide/request-interceptors.html) in the docs.
   *
   * @param interceptor the interceptor to remove
   */
  deleteRequestInterceptor(interceptor: RequestInterceptor) {
    const requestDefaults = this.interceptorsToRequestDefaults.get(interceptor);
    this.requestDefaults.splice(this.requestDefaults.indexOf(requestDefaults as any), 1);
  }

  // ---------------------------------------------------------------------------
  // Request creation
  // ---------------------------------------------------------------------------
  /**
   * Creates a HTTPRequest object with the factory defaults applied.
   *
   * Generally this method is not called directly, but instead
   * the factory methods {@link createGETRequest}, {@link createPOSTRequest},
   * {@link createPUTRequest}, {@link createDELETERequest}, {@link createPATCHRequest}, {@link createHEADRequest}, {@link createTRACERequest} or {@link createAPIRequest} are used.
   *
   * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
   *
   * @param url the URL to create the request for
   * @param method the HTTP method to use
   * @returns the created HTTPRequest object
   */
  createRequest(url: string, method: HTTPMethod = 'GET') {
    url = this.computeURL(url);
    const featureDelegates = this.requestDelegates;
    const request = new HTTPRequest({
      url,
      method,
      defaultConfigBuilders: this.requestDefaults,
      featureDelegates,
      factoryMethods: {
        requireFeature: this.requireFeature.bind(this)
      },
      wrapErrors: this.wrapErrors
    });

    this.afterRequestCreatedHooks.forEach((hook) => hook(request));
    return request;
  }

  // Verb helpers
  /**
   * Creates a GET request with the factory defaults applied.
   *
   * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
   *
   * @param url the URL to create the request for
   * @returns the created HTTPRequest object
   */
  createGETRequest(url: string) {
    return this.createRequest(url, 'GET');
  }
  /**
   * Creates a POST request with the factory defaults applied.
   *
   * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
   *
   * @param url the URL to create the request for
   * @returns the created HTTPRequest object
   */
  createPOSTRequest(url: string) {
    return this.createRequest(url, 'POST');
  }
  /**
   * Creates a PUT request with the factory defaults applied.
   *
   * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
   *
   * @param url the URL to create the request for
   * @returns the created HTTPRequest object
   */
  createPUTRequest(url: string) {
    return this.createRequest(url, 'PUT');
  }
  /**
   * Creates a DELETE request with the factory defaults applied.
   *
   * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
   *
   * @param url the URL to create the request for
   * @returns the created HTTPRequest object
   */
  createDELETERequest(url: string) {
    return this.createRequest(url, 'DELETE');
  }
  /**
   * Creates a PATCH request with the factory defaults applied.
   *
   * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
   *
   * @param url the URL to create the request for
   * @returns the created HTTPRequest object
   */
  createPATCHRequest(url: string) {
    return this.createRequest(url, 'PATCH');
  }
  /**
   * Creates a HEAD request with the factory defaults applied.
   *
   * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
   *
   * @param url the URL to create the request for
   * @returns the created HTTPRequest object
   */
  createHEADRequest(url: string) {
    return this.createRequest(url, 'HEAD');
  }
  /**
   * Creates a TRACE request with the factory defaults applied.
   *
   * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
   *
   * @param url the URL to create the request for
   * @returns the created HTTPRequest object
   */
  createTRACERequest(url: string) {
    return this.createRequest(url, 'TRACE');
  }

  // ---------------------------------------------------------------------------
  // API config and API request helpers
  // ---------------------------------------------------------------------------
  /**
   * Adds API configurations ({@link APIConfig}) to the factory.
   *
   * API endpoints can then be invoked using {@link createAPIRequest}.
   *
   * If an API has a name that is "default", it will be used as the default API.
   * Which means that {@link createAPIRequest} can be called with just the endpoint name.
   *
   * See [API Config](http://cleverplatypus.github.io/apihive-core/guide/api-config.html) in the docs.
   *
   * @param apis the API configurations to add
   * @returns the factory instance
   */
  withAPIConfig(...apis: Array<APIConfig>) {
    apis.forEach((api) => {
      this.apiConfigs[api.name] = api;
    });
    return this;
  }

  /**
   * Creates a {@link HTTPRequest} with configuration based on the given {@link APIConfig}'s name and endpoint name.
   * If invoked with one argument (endpoint name), it will use the default API.
   *
   * It also populates the request's meta with info about the API and endpoint inside `request.meta.api`
   * merging in any meta defined in the api config's `api.meta` and `endpoint.meta`.
   * This is useful for conditional request configuration based on the API
   * definition and for debugging purposes.
   *
   * See [API Invocation](http://cleverplatypus.github.io/apihive-core/guide/api-invocation.html) in the docs.
   *
   * @param args Either [apiName, endpointName] or [endpointName] for default API.
   * @returns The created request.
   */
  createAPIRequest(...args: [string, string] | [string]): HTTPRequest {
    const [apiName, endpointName] = args.length === 1 ? ['default', args[0]] : args;
    this._logger.withMinimumLevel(this._logLevel).trace('Creating API request', apiName, endpointName);
    const api = this.apiConfigs[apiName];
    const endpoint: Endpoint = api?.endpoints[endpointName];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointName} not found in API ${apiName}`);
    }

    const url = this.getEndpointURL(endpoint, api);
    const meta = this.constructMeta(api, endpointName, endpoint);
    const request = this.createRequest(url, endpoint.method)
      .withMeta(meta)
      .withHeaders(api.headers || {});

    this.applyAPIDefaultsToRequest(api, request);

    return request;
  }

  // ---------------------------------------------------------------------------
  // Adapters (feature: adapters)
  // ---------------------------------------------------------------------------
  /**
   * Attaches an adapter to the factory.
   *
   *
   * See [Adapters](http://cleverplatypus.github.io/apihive-core/guide/adapters.html) in the docs.
   *
   * @remarks It requires the "adapters" feature to be enabled.
   * @param adapter The adapter to attach.
   * @param options Optional. The options for the adapter.
   * @returns The factory instance.
   */
  async withAdapter(adapter: Adapter, options?: AdapterOptions): Promise<HTTPRequestFactory> {
    this.requireFeature('adapters');
    return this.factoryDelegates.withAdapter(adapter, options);
  }

  /**
   * Detaches an adapter from the factory.
   *
   *
   * See [Adapters](http://cleverplatypus.github.io/apihive-core/guide/adapters.html) in the docs.
   *
   * @remarks It requires the "adapters" feature to be enabled.
   * @param adapterName The name of the adapter to detach.
   * @returns The factory instance.
   */
  async detachAdapter(adapterName: string): Promise<HTTPRequestFactory> {
    this.requireFeature('adapters');
    return this.factoryDelegates.detachAdapter(adapterName);
  }

  /**
   * Returns the names of the adapters attached to the factory.
   *
   *
   * See [Adapters](http://cleverplatypus.github.io/apihive-core/guide/adapters.html) in the docs.
   *
   * @remarks It requires the "adapters" feature to be enabled.
   * @returns The names of the attached adapters.
   */
  getAttachedAdapters(): string[] {
    this.requireFeature('adapters');
    return this.factoryDelegates.getAttachedAdapters();
  }

  /**
   * Returns true if the factory has an adapter attached with the given name.
   *
   *
   * See [Adapters](http://cleverplatypus.github.io/apihive-core/guide/adapters.html) in the docs.
   *
   * @remarks It requires the "adapters" feature to be enabled.
   * @param adapterName The name of the adapter to check.
   * @returns True if the adapter is attached, false otherwise.
   */
  hasAdapter(adapterName: string): boolean {
    this.requireFeature('adapters');
    return this.factoryDelegates.hasAdapter(adapterName);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------
  /**
   * @internal
   */
  private applyAPIDefaultsToRequest(api: APIConfig, request: HTTPRequest): void {
    const apiArrayProps: ReadonlyArray<keyof APIConfig> = [
      'responseBodyTransformers',
      'requestInterceptors',
      'responseInterceptors',
      'errorInterceptors',
      'progressHandlers'
    ] as const;

    for (const key of apiArrayProps) {
      const value = (api as any)[key];
      if (!value) continue;
      const arr = Array.isArray(value) ? value : [value];
      const method = ('with' + key.charAt(0).toUpperCase() + key.slice(1)) as keyof HTTPRequest;
      (request as any)[method](...arr);
    }
  }

  private computeURL(url: string): string {
    const isAbsolute = (u: string) => /^(https?:)?\/\//.test(u);

    // If the provided url is absolute (http/https or protocol-relative), always use it
    if (isAbsolute(url)) return url;

    // If no baseURL, use the url as provided (HTTPRequest will compose params later)
    if (!this.baseURL) return url;

    const base = this.baseURL;

    // If base is absolute/protocol-relative, delegate to URL resolution
    if (isAbsolute(base)) {
      return new URL(url, base).toString();
    }

    // Both are relative (including root-relative base like '/api') -> concatenate cleanly
    const stripTrailing = base.replace(/\/+$/, '');
    const stripLeading = url.replace(/^\/+/, '');
    return `${stripTrailing}/${stripLeading}`;
  }

  /**
   * @internal
   */
  private constructMeta(api: APIConfig, endpointName: string, endpoint: Endpoint): any {
    const meta = {
      api: {
        name: api.name,
        baseURL: api.baseURL,
        endpoint,
        endpointName
      }
    } as const as any;
    Object.defineProperty(meta, 'api', {
      writable: false,
      configurable: false,
      enumerable: true
    });

    try {
      Object.assign(meta, api.meta || {}, endpoint.meta || {});
    } catch (e) {
      const additionalInfo: string[] = [];
      if ('api' in (api.meta || {}) || 'api' in (endpoint.meta || {})) {
        additionalInfo.push("You're trying to assign the reserved `api` property name to meta");
      }
      this._logger.error('Unable to merge meta', ...additionalInfo, e);
    }
    return meta;
  }

  /**
   * @internal
   */
  private getEndpointURL(endpoint: Endpoint, api: APIConfig) {
    if (/^(https?:)?\/\//.test(endpoint.target)) {
      return endpoint.target;
    }
    let base: string | null = null;
    if (api.baseURL) {
      base = typeof api.baseURL === 'function' ? api.baseURL(endpoint) : api.baseURL;
    }

    return base ? `${base}${endpoint.target}` : endpoint.target;
  }
}

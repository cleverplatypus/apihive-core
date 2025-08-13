import { type LoggerFacade, type LogLevel, ConsoleLogger } from "@apihive/logger-facade";
import { HTTPRequest } from "./HTTPRequest.js";

import {
  Adapter,
  AdapterOptions
} from "./adapter-types.js";
import {
  APIConfig,
  BeforeFetchHook,
  Endpoint,
  ErrorInterceptor,
  Feature,
  FeatureFactoryDelegates,
  FeatureRequestDelegates,
  HeaderValue,
  HTTPMethod,
  ProgressHandlerConfig,
  RequestConfig,
  RequestConfigBuilder,
  RequestInterceptor,
  ResponseBodyTransformer
} from "./types.js";

function getEndpointURL(endpoint: Endpoint, api: APIConfig) {
  if (/^(https?:)?\/\//.test(endpoint.target)) {
    return endpoint.target;
  }
  let base: string | null = null;
  if (api.baseURL) {
    base =
      typeof api.baseURL === "function" ? api.baseURL(endpoint) : api.baseURL;
  }

  return base ? `${base}${endpoint.target}` : endpoint.target;
}

/**
 * A factory for creating {@link HTTPRequest} instances.
 * It can be configured with defaults, logging options as well as
 * conditional settings using {@link when} in a method-chain fashion.
 * 
 * Adapters can be added to the factory to provide additional functionality.
 * Use cases are request caching, logging, transformation, auto-api generation etc.
 */
export class HTTPRequestFactory {
  private requestDefaults: RequestConfigBuilder[] = [];
  private apiConfigs: { [key: string]: APIConfig } = {};
  private _logger: LoggerFacade = new ConsoleLogger();
  private _logLevel: LogLevel = "error";
  private afterRequestCreatedHooks: ((request: HTTPRequest) => void)[] = [];
  

  get logger() {
    return this._logger;
  }

  get logLevel() {
    return this._logLevel;
  }
  /**
   * @internal 
   * Keeps a mapping of defaults for interceptors to allow removing them
   */
  private interceptorsToRequestDefaults: Map<
    RequestInterceptor,
    RequestConfigBuilder
  > = new Map();
  private requestDelegates: FeatureRequestDelegates = {} as FeatureRequestDelegates;
  private factoryDelegates: FeatureFactoryDelegates = {} as FeatureFactoryDelegates;

  use(feature: Feature) {
    feature.apply?.(this, {
      addRequestDefaults: (...args: RequestConfigBuilder[]) => {
        this.requestDefaults.push(...args);
      },
      removeRequestDefaults: (...args: RequestConfigBuilder[]) => {
        this.requestDefaults = this.requestDefaults.filter(
          (defaultFn) => !args.includes(defaultFn)
        );
      },
      afterRequestCreated: (hook: (request: HTTPRequest) => void) => {
        this.afterRequestCreatedHooks.push(hook);
      },
      beforeFetch: (hook: BeforeFetchHook) => {
        this.requestDefaults.push((request: HTTPRequest) =>
          request.withBeforeFetchHook(hook)
        );
      },
    });
    if(feature.getDelegates) {
      const delegates = feature.getDelegates(this);
      if(delegates.request) {
        Object.assign(this.requestDelegates, delegates.request);
      }
      if(delegates.factory) {
        Object.assign(this.factoryDelegates, delegates.factory);
      }
    }
    return this;
  }
  
  /**
   * Resets any conditions in the method chain set by {@link when}
   * @returns {HTTPRequestFactory} the factory instance
   */
  always() {
    return this;
  }

  /**
   * Adds a condition for the application of method-chain settings.
   * It can be reset by calling {@link always}
   *
   * @param {function} condition - A function that takes a HTTPRequest object and returns whether or not to apply the condition.
   * @return {HTTPRequestFactory} - A proxy to the factory instance that allows the conditional configuration
   *
   * @example
   * factory
   *  .when((request) => request.meta.requiresAuth)
   *  .withHeader('Authorization', 'some-token')
   *  .always()
   *  .withHeader('X-PoweredBy', 'Me')
   */
  when(condition: (config: RequestConfig) => boolean) {
    const proxy = new Proxy(this, {
      get: (target, prop) => {
        if (prop === "always") {
          return () => target;
        }

        if (prop === "when") {
          return (condition: (config: RequestConfig) => boolean) =>
            target.when(condition);
        }

        if (typeof target[prop] === "function" && /^with/.test(prop.toString())) {
          return (...args) => {
            const fn = (request: HTTPRequest, config: RequestConfig) => {
              if (condition(config)) {
                request[prop](...args);
              }
            };
            target.requestDefaults.push(fn);
            return this;
          };
        }
        
        return target[prop];
      },
    });

    return proxy;
  }

  deleteRequestInterceptor(interceptor: RequestInterceptor) {
    const requestDefaults = this.interceptorsToRequestDefaults.get(interceptor);
    this.requestDefaults.splice(
      this.requestDefaults.indexOf(requestDefaults),
      1
    );
  }

  /**
   * Sets the logger adapter for the instance for every request created.
   * By default the logger will be set by the factory to the internal `ConsoleLogger` adapter.
   *
   * @param {LoggerFacade} logger - The logger to set.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withLogger(logger: LoggerFacade) {
    this._logger = logger;
    this.requestDefaults.push((request: HTTPRequest) =>
      request.withLogger(logger)
    );
    return this;
  }

  /**
   * Adds {@link APIConfig} configurations that can be consumed by calling {@link createAPIRequest}.
   *
   * @param {...APIConfig } apis - A list of {@link APIConfig} configurations.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withAPIConfig(...apis: Array<APIConfig>) {
    apis.forEach((api) => {
      this.apiConfigs[api.name] = api;
    });
    return this;
  }

  /**
   * Adds the specified MIME types to the accept header to the factory defaults.
   *
   * @param {...string} mimeTypes - An array of MIME types to be added to the accept header.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withAccept(...mimeTypes: Array<string>) {
    this.requestDefaults.push((request: HTTPRequest) =>
      request.withAccept(mimeTypes)
    );
    return this;
  }
  /**
   * Adds the specified header to the factory defaults.
   *
   * @param {string} key - The key of the header.
   * @param {string | ((request: HTTPRequest) => string)} value - The value of the header.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withHeader(key: string, value: string | ((config: RequestConfig) => string)) {
    this.requestDefaults.push((request: HTTPRequest) =>
      request.withHeader(key, value)
    );
    return this;
  }

  /**
   * Sets the credentials policy for the factory defaults.
   *
   * @param {RequestCredentials} config - The credentials policy to be set.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withCredentialsPolicy(config: RequestCredentials) {
    this.requestDefaults.push((request: HTTPRequest) =>
      request.withCredentialsPolicy(config)
    );
    return this;
  }

  /**
   * Sets the log level to the factory defaults.
   *
   * @param {LogLevel} level - The log level to be set.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withLogLevel(level: LogLevel) {
    this._logLevel = level;
    this.requestDefaults.push((request: HTTPRequest) =>
      request.withLogLevel(level)
    );
    return this;
  }
  /**
   * Adds a request interceptor to the request configuration.
   * Interceptors are executed in the order they are added.
   * - If a request interceptor returns a rejected promise, the request will fail.
   * - If a request interceptor returns a resolved promise, the promise's result will be used as the response.
   * - If the interceptor returns `undefined`, the request will continue to the next interceptor, if present or to the regular request handling
   * - the interceptor's second parameter is contains commands {@link InterceptorCommands} to replace the requests URL or to completely remove the interceptor from configuration
   *
   * @param {RequestInterceptor} interceptor - The interceptor to add.
   * @return {HTTPRequest} - The updated request instance.
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
   * Adds a response body transformer to the factory defaults.
   *
   * @param {ResponseBodyTransformer} transformer - The function that will be used to transform the response body.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withResponseBodyTransformers(...transformers: ResponseBodyTransformer[]) {
    this.requestDefaults.push(
      ...transformers.map(
        (transformer) => (request: HTTPRequest) =>
          request.withResponseBodyTransformers(transformer)
      )
    );
    return this;
  }

  /**
   * Adds the provided headers to the factory defaults.
   *
   * @param {Record<string, HeaderValue>} headers - The headers to be added to the request.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withHeaders(headers: Record<string, HeaderValue>) {
    if (typeof headers === "object") {
      for (const name of Object.keys(headers)) {
        this.requestDefaults.push((request: HTTPRequest) =>
          request.withHeader(name, headers[name])
        );
      }
    }
    return this;
  }

  withErrorInterceptors(...interceptors: ErrorInterceptor[]) {
    this.requestDefaults.push((request) => {
      request.withErrorInterceptors(...interceptors);
    });
    return this;
  }

  /**
   * Adds the provided JSON MIME types regexp patterns to the factory defaults.
   * Useful when dealing with APIs returning JSON but with proprietary mime type. 
   *
   * @param {...string} mimeTypes - An array of MIME types to be added to the request.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withJSONMimeTypes(...mimeTypes: string[]) {
    this.requestDefaults.push((request) => {
      request.withJSONMimeTypes(...mimeTypes);
    });
    return this;
  }

  /**
   * Adds the provided text MIME types regexp patterns to the factory defaults.
   * The library recognizes text/*, application/.*\+xml, image/.*\+xml, application/javascript
   * by default as text.
   *
   * @param {...string} mimeTypes - An array of MIME types to be added to the request.
   * @returns {HTTPRequestFactory} the factory instance
   */
  withTextMimeTypes(...mimeTypes: string[]) {
    this.requestDefaults.push((request) => {
      request.withTextMimeTypes(...mimeTypes);
    });
    return this;
  }

  /**
   * Attaches an adapter to this factory instance.
   * Adapters extend the factory's functionality through interceptors and hooks.
   *
   * @param adapter - The adapter to attach
   * @param options - Optional configuration for the adapter
   * @returns The factory instance for method chaining
   */
  async withAdapter(
    adapter: Adapter,
    options?: AdapterOptions
  ): Promise<HTTPRequestFactory> {
    if(!this.factoryDelegates.withAdapter)
      throw new Error('Adapters feature not enabled. Import adaptersFeature and call factory.use(adaptersFeature).');
    
    return this.factoryDelegates.withAdapter(adapter, options);
  }

  /**
   * Detaches an adapter from this factory instance.
   *
   * @param adapterName - The name of the adapter to detach
   * @returns The factory instance for method chaining
   */
  async detachAdapter(adapterName: string): Promise<HTTPRequestFactory> {
    if(!this.factoryDelegates.detachAdapter)
      throw new Error('Adapters feature not enabled. Import adaptersFeature and call factory.use(adaptersFeature).');
    
    return this.factoryDelegates.detachAdapter(adapterName);
  }

  /**
   * Gets a list of attached adapter names.
   *
   * @returns Array of adapter names
   */
  getAttachedAdapters(): string[] {
    if(!this.factoryDelegates.getAttachedAdapters)
       throw new Error('Adapters feature not enabled. Import adaptersFeature and call factory.use(adaptersFeature).');
    
    return this.factoryDelegates.getAttachedAdapters();
  }

  /**
   * Checks if an adapter is attached.
   *
   * @param adapterName - The name of the adapter to check
   * @returns True if the adapter is attached
   */
  hasAdapter(adapterName: string): boolean {
    if(!this.factoryDelegates.hasAdapter)
      throw new Error('Adapters feature not enabled. Import adaptersFeature and call factory.use(adaptersFeature).');
    
    return this.factoryDelegates.hasAdapter(adapterName);
  }



  /**
   * Factory method for creating POST requests
   * @param {String} url
   */
  createPOSTRequest(url: string) {
    return this.createRequest(url, "POST");
  }
  /**
   * Factory method for creating GET requests
   * @param {String} url
   */
  createGETRequest(url: string) {
    return this.createRequest(url, "GET");
  }

  /**
   * Factory method for creating PUT requests
   * @param {String} url
   */
  createPUTRequest(url: string) {
    return this.createRequest(url, "PUT");
  }
  /**
   * Factory method for creating DELETE requests
   * @param {String} url
   */
  createDELETERequest(url: string) {
    return this.createRequest(url, "DELETE");
  }

  createPATCHRequest(url: string) {
    return this.createRequest(url, "PATCH");
  }

  createHEADRequest(url: string) {
    return this.createRequest(url, "HEAD");
  }

  createTRACERequest(url: string) {
    return this.createRequest(url, "TRACE");
  }

  createRequest(url: string, method: HTTPMethod = "GET") {
    const featureDelegates = this.requestDelegates;
    const request = new HTTPRequest({
      url,
      method,
      defaultConfigBuilders: this.requestDefaults,
      featureDelegates,
    });

    this.afterRequestCreatedHooks.forEach((hook) => hook(request));
    return request;
  }

  /**
   * Creates a {@link HTTPRequest} with configuration based on the given {@link APIConfig}'s name and endpoint name.
   * It also populates the request's meta with info about the API and endpoint inside `request.meta.api`
   * merging in any meta defined in the api config's `api.meta` and `endpoint.meta`.
   * @param {string} apiName - The name of the API.
   * @param {string} endpointName - The name of the endpoint.
   * @return {HTTPRequest} The created request.
   *
   * @example
   * factory.createAPIRequest('my-api', 'my-endpoint')
   *    .withQueryParam('key', 'value')
   *    .withHeader('X-PoweredBy', 'Me')
   *    .execute();
   */
  createAPIRequest(...args: [string, string] | [string]): HTTPRequest {
    const [apiName, endpointName] =
      args.length === 1 ? ["default", args[0]] : args;
    this._logger
      .withMinimumLevel(this._logLevel)
      .trace("Creating API request", apiName, endpointName);
    const api = this.apiConfigs[apiName];
    const endpoint: Endpoint = api?.endpoints[endpointName];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointName} not found in API ${apiName}`);
    }

    const url = getEndpointURL(endpoint, api);
    const meta = {
      api: {
        name: api.name,
        baseURL: api.baseURL,
        endpoint,
        endpointName,
      },
    };
    Object.defineProperty(meta, "api", {
      writable: false,
      configurable: false,
      enumerable: true,
    });

    try {
      Object.assign(meta, api.meta || {}, endpoint.meta || {});
    } catch (e) {
      const additionalInfo = [];
      if('api' in (api.meta || {}) || 'api' in (endpoint.meta || {})) {
        additionalInfo.push("You're trying to assign the reserved `api` property name to meta");
      }
      this._logger.error(
        "Unable to merge meta",
        ...additionalInfo,
        e
      );
    }
    const request = this.createRequest(url, endpoint.method)
      .withMeta(meta)
      .withHeaders(api.headers || {});
    
    if (api.responseBodyTransformers) {
      const transformers = Array.isArray(api.responseBodyTransformers)
        ? api.responseBodyTransformers
        : [api.responseBodyTransformers];
      request.withResponseBodyTransformers(...transformers);
    }
    if (api.requestInterceptors) {
      const interceptors = Array.isArray(api.requestInterceptors)
        ? api.requestInterceptors
        : [api.requestInterceptors];
      request.withRequestInterceptors(...interceptors);
    }
    if (api.responseInterceptors) {
      const interceptors = Array.isArray(api.responseInterceptors)
        ? api.responseInterceptors
        : [api.responseInterceptors];
      request.withResponseInterceptors(...interceptors);
    }
    if (api.errorInterceptors) {
      const errorInterceptors = Array.isArray(api.errorInterceptors)
        ? api.errorInterceptors
        : [api.errorInterceptors];
      request.withErrorInterceptors(...errorInterceptors);
    }
    return request;
  }

  withProgressHandlers(...handlers: ProgressHandlerConfig[]): HTTPRequestFactory {
    this.requestDefaults.push((request: HTTPRequest) =>
      request.withProgressHandlers(...handlers)
    );
    return this;
  }
}

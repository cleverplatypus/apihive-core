import ConsoleLogger from "./ConsoleLogger.ts";
import { HTTPRequest } from "./HTTPRequest.ts";
import { LoggerFacade, LogLevel } from "./LoggerFacade.ts";
import {
  APIConfig,
  HeaderValue,
  Endpoint,
  HTTPMethod,
  ResponseBodyTransformer,
  RequestInterceptor,
  ResponseInterceptor,
  RequestConfigBuilder,
  ErrorInterceptor,
  RequestConfig,
} from "./types.ts";
import {
  Adapter,
  AdapterOptions,
  AdapterEntry,
  AdapterPriority,
} from "./adapter-types.ts";

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
  private logger: LoggerFacade = new ConsoleLogger();
  private logLevel: LogLevel = "error";
  /**
   * @internal 
   * Keeps a mapping of defaults for interceptors to allow removing them
   */
  private interceptorsToRequestDefaults: Map<
    RequestInterceptor,
    RequestConfigBuilder
  > = new Map();
  private adapters: Map<string, AdapterEntry> = new Map();
  private adapterRequestInterceptors: Array<{
    interceptor: RequestInterceptor;
    priority: number;
  }> = [];
  private adapterResponseInterceptors: Array<{
    interceptor: ResponseInterceptor;
    priority: number;
  }> = [];
  private adapterErrorInterceptors: Array<{
    interceptor: ErrorInterceptor;
    priority: number;
  }> = [];
  private adapterInterceptorApplier: RequestConfigBuilder | null = null;
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
    this.logger = logger;
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
    this.logLevel = level;
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
    if (this.adapters.has(adapter.name)) {
      throw new Error(`Adapter '${adapter.name}' is already attached`);
    }

    // Merge priorities with defaults
    const defaultPriority: AdapterPriority = {
      requestInterceptor: 500,
      responseInterceptor: 500,
      errorInterceptor: 500,
    };
    const finalPriority = {
      ...defaultPriority,
      ...adapter.priority,
      ...options?.priority,
    };

    // Create adapter entry
    const entry: AdapterEntry = {
      adapter,
      priority: finalPriority,
      attached: false,
    };

    // Attach the adapter
    await adapter.onAttach?.(this);

    // Register interceptors with priority
    this.registerAdapterInterceptors(adapter, finalPriority);

    // Add factory defaults if provided
    const factoryDefaults = adapter.getFactoryDefaults?.() || [];
    this.requestDefaults.push(...factoryDefaults);

    // Mark as attached and store
    entry.attached = true;
    this.adapters.set(adapter.name, entry);

    this.logger
      .withMinimumLevel(this.logLevel)
      .debug(`Adapter '${adapter.name}' attached successfully`);

    return this;
  }

  /**
   * Detaches an adapter from this factory instance.
   *
   * @param adapterName - The name of the adapter to detach
   * @returns The factory instance for method chaining
   */
  async detachAdapter(adapterName: string): Promise<HTTPRequestFactory> {
    const entry = this.adapters.get(adapterName);
    if (!entry) {
      throw new Error(`Adapter '${adapterName}' is not attached`);
    }

    // Remove interceptors registered by this adapter
    this.unregisterAdapterInterceptors(entry.adapter);

    // Call adapter's detach hook
    await entry.adapter.onDetach?.(this);

    // Remove from registry
    this.adapters.delete(adapterName);

    this.logger
      .withMinimumLevel(this.logLevel)
      .debug(`Adapter '${adapterName}' detached successfully`);

    return this;
  }

  /**
   * Gets a list of attached adapter names.
   *
   * @returns Array of adapter names
   */
  getAttachedAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Checks if an adapter is attached.
   *
   * @param adapterName - The name of the adapter to check
   * @returns True if the adapter is attached
   */
  hasAdapter(adapterName: string): boolean {
    return this.adapters.has(adapterName);
  }

  /**
   * Registers interceptors from an adapter with proper priority ordering.
   * @internal
   */
  private registerAdapterInterceptors(
    adapter: Adapter,
    priority: AdapterPriority
  ): void {
    // Register request interceptors
    const requestInterceptors = adapter.getRequestInterceptors?.() || [];
    for (const interceptor of requestInterceptors) {
      this.adapterRequestInterceptors.push({
        interceptor,
        priority: priority.requestInterceptor!,
      });
    }
    this.adapterRequestInterceptors.sort((a, b) => a.priority - b.priority);

    // Register response interceptors
    const responseInterceptors = adapter.getResponseInterceptors?.() || [];
    for (const interceptor of responseInterceptors) {
      this.adapterResponseInterceptors.push({
        interceptor,
        priority: priority.responseInterceptor!,
      });
    }
    this.adapterResponseInterceptors.sort((a, b) => a.priority - b.priority);

    // Register error interceptors
    const errorInterceptors = adapter.getErrorInterceptors?.() || [];
    for (const interceptor of errorInterceptors) {
      this.adapterErrorInterceptors.push({
        interceptor,
        priority: priority.errorInterceptor!,
      });
    }
    this.adapterErrorInterceptors.sort((a, b) => a.priority - b.priority);

    // Update the central adapter interceptor applier
    this.updateAdapterInterceptorApplier();
  }

  /**
   * Unregisters interceptors from a detached adapter.
   * @internal
   */
  private unregisterAdapterInterceptors(adapter: Adapter): void {
    const requestInterceptors = adapter.getRequestInterceptors?.() || [];
    const responseInterceptors = adapter.getResponseInterceptors?.() || [];
    const errorInterceptors = adapter.getErrorInterceptors?.() || [];

    // Remove from adapter interceptor arrays
    this.adapterRequestInterceptors = this.adapterRequestInterceptors.filter(
      (entry) => !requestInterceptors.includes(entry.interceptor)
    );
    this.adapterResponseInterceptors = this.adapterResponseInterceptors.filter(
      (entry) => !responseInterceptors.includes(entry.interceptor)
    );
    this.adapterErrorInterceptors = this.adapterErrorInterceptors.filter(
      (entry) => !errorInterceptors.includes(entry.interceptor)
    );

    // Update the central applier
    this.updateAdapterInterceptorApplier();
  }

  /**
   * Updates the central adapter interceptor applier function.
   * This ensures all adapters' interceptors are applied to new requests in proper priority order.
   * @internal
   */
  private updateAdapterInterceptorApplier(): void {
    // Remove existing applier if it exists
    if (this.adapterInterceptorApplier) {
      const index = this.requestDefaults.indexOf(
        this.adapterInterceptorApplier
      );
      if (index !== -1) {
        this.requestDefaults.splice(index, 1);
      }
    }

    // Create new applier that applies all current adapter interceptors
    this.adapterInterceptorApplier = (request: HTTPRequest) => {
      // Apply request interceptors in priority order
      const sortedRequestInterceptors = this.adapterRequestInterceptors
        .sort((a, b) => a.priority - b.priority)
        .map((entry) => entry.interceptor);

      // Apply response interceptors in priority order
      const sortedResponseInterceptors = this.adapterResponseInterceptors
        .sort((a, b) => a.priority - b.priority)
        .map((entry) => entry.interceptor);

      // Apply error interceptors in priority order
      const sortedErrorInterceptors = this.adapterErrorInterceptors
        .sort((a, b) => a.priority - b.priority)
        .map((entry) => entry.interceptor);

      if (sortedRequestInterceptors.length > 0) {
        request.withRequestInterceptors(...sortedRequestInterceptors);
      }
      if (sortedResponseInterceptors.length > 0) {
        request.withResponseInterceptors(...sortedResponseInterceptors);
      }
      if (sortedErrorInterceptors.length > 0) {
        request.withErrorInterceptors(...sortedErrorInterceptors);
      }
    };

    // Add the new applier to requestDefaults
    if (
      this.adapterRequestInterceptors.length > 0 ||
      this.adapterResponseInterceptors.length > 0 ||
      this.adapterErrorInterceptors.length > 0
    ) {
      this.requestDefaults.push(this.adapterInterceptorApplier);
    }
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
    return new HTTPRequest({
      url,
      method,
      defaultConfigBuilders: this.requestDefaults
    });
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
    this.logger
      .withMinimumLevel(this.logLevel)
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
      this.logger.error(
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
    if (api.errorInterceptors) {
      const errorInterceptors = Array.isArray(api.errorInterceptors)
        ? api.errorInterceptors
        : [api.errorInterceptors];
      request.withErrorInterceptors(...errorInterceptors);
    }
    return request;
  }
}

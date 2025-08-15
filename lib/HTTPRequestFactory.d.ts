import { type LoggerFacade, type LogLevel } from '@apihive/logger-facade';
import { HTTPRequest } from './HTTPRequest.js';
import { Adapter, AdapterOptions } from './adapter-types.js';
import { APIConfig, ErrorInterceptor, Feature, HeaderValue, HTTPMethod, ProgressHandlerConfig, RequestConfig, RequestInterceptor, ResponseBodyTransformer } from './types.js';
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
export declare class HTTPRequestFactory {
    private requestDefaults;
    private apiConfigs;
    private _logger;
    private _logLevel;
    private afterRequestCreatedHooks;
    private enabledFeatures;
    /**
     * @internal Keeps a mapping of defaults for interceptors to allow removing them
     */
    private interceptorsToRequestDefaults;
    private requestDelegates;
    private factoryDelegates;
    get logger(): LoggerFacade;
    get logLevel(): LogLevel;
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
    use(feature: Feature): this;
    private requireFeature;
    /**
     * Sets the logger adapter for the factory.
     
     * @param logger a logger complying with the LoggerFacade interface
     * @returns the factory instance
     */
    withLogger(logger: LoggerFacade): this;
    /**
     * Sets the log level for the factory.
     *
     * @param level the log level to set
     * @returns the factory instance
     */
    withLogLevel(level: LogLevel): this;
    /**
     * Sets the default accept header to the factory defaults.
     *
     * @param mimeTypes the MIME types to accept
     * @returns the factory instance
     */
    withAccept(...mimeTypes: Array<string>): this;
    /**
     * Sets the default [value] for the header [key] to the factory defaults.
     *
     * @param key the header key
     * @param value the header value
     * @returns the factory instance
     */
    withHeader(key: string, value: string | ((config: RequestConfig) => string)): this;
    /**
     * Sets the value for the passed key/value pairs of headers to the factory defaults.
     *
     * @param headers a key/value pair of headers to set
     * @returns the factory instance
     */
    withHeaders(headers: Record<string, HeaderValue>): this;
    /**
     * Sets the default credentials policy to the factory defaults.
     *
     * @param config the credentials policy to set
     * @returns the factory instance
     */
    withCredentialsPolicy(config: RequestCredentials): this;
    /**
     * Adds the provided request interceptors to the factory defaults.
     * See [Request Interceptors](http://cleverplatypus.github.io/apihive-core/guide/request-interceptors.html) in the documentation
     *
     * @param interceptors the interceptors to add
     * @returns the factory instance
     */
    withRequestInterceptors(...interceptors: RequestInterceptor[]): this;
    /**
     * Adds the provided error interceptors to the factory defaults.
     * See [Error Interceptors](http://cleverplatypus.github.io/apihive-core/guide/error-interceptors.html) in the documentation
     *
     * @param interceptors the interceptors to add
     * @returns the factory instance
     */
    withErrorInterceptors(...interceptors: ErrorInterceptor[]): this;
    /**
     * Adds the provided response body transformers to the factory defaults.
     * See [Response Body Transformers](http://cleverplatypus.github.io/apihive-core/guide/response-body-transformers.html) in the documentation
     *
     * @param transformers the transformers to add
     * @returns the factory instance
     */
    withResponseBodyTransformers(...transformers: ResponseBodyTransformer[]): this;
    /**
     * Instructs the factory to treat response mime types that match
     * the provided regexp as JSON when the library's default
     * JSON types matching is not enough.
     *
     * @param mimeTypes the MIME types to add
     * @returns the factory instance
     */
    withJSONMimeTypes(...mimeTypes: string[]): this;
    /**
     * Instructs the factory to treat response mime types that match
     * the provided regexp as text when the library's default
     * text types matching is not enough.
     *
     * @param mimeTypes the MIME types to add
     * @returns the factory instance
     */
    withTextMimeTypes(...mimeTypes: string[]): this;
    /**
     * Adds the provided progress handlers to the factory defaults.
     * See [Progress Handlers](http://cleverplatypus.github.io/apihive-core/guide/progress-handlers.html) in the documentation
     *
     * @param handlers the handlers to add
     * @returns the factory instance
     */
    withProgressHandlers(...handlers: ProgressHandlerConfig[]): HTTPRequestFactory;
    /**
     * Adds the provided abort listener to the factory defaults.
     * See [Abort Listeners](http://cleverplatypus.github.io/apihive-core/guide/abort-listeners.html) in the documentation
     *
     * @param listener the listener to add
     * @returns the factory instance
     */
    withAbortListener(listener: (event: Event) => void): this;
    /**
     * Call this to reset any conditions in the method chain set by {@link when}
     *
     * See [Conditional Building](http://cleverplatypus.github.io/apihive-core/guide/conditional-building.html) in the docs.
     */
    always(): this;
    /**
     * Adds a condition for the application of method-chain settings. It can be reset by calling {@link always}
     *
     * See [Conditional Building](http://cleverplatypus.github.io/apihive-core/guide/conditional-building.html) in the docs.
     */
    when(condition: (config: RequestConfig) => boolean): any;
    /**
     * Removes a request interceptor from the factory defaults.
     *
     * See [Request Interceptors](http://cleverplatypus.github.io/apihive-core/guide/request-interceptors.html) in the docs.
     *
     * @param interceptor the interceptor to remove
     */
    deleteRequestInterceptor(interceptor: RequestInterceptor): void;
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
    createRequest(url: string, method?: HTTPMethod): HTTPRequest;
    /**
     * Creates a GET request with the factory defaults applied.
     *
     * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
     *
     * @param url the URL to create the request for
     * @returns the created HTTPRequest object
     */
    createGETRequest(url: string): HTTPRequest;
    /**
     * Creates a POST request with the factory defaults applied.
     *
     * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
     *
     * @param url the URL to create the request for
     * @returns the created HTTPRequest object
     */
    createPOSTRequest(url: string): HTTPRequest;
    /**
     * Creates a PUT request with the factory defaults applied.
     *
     * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
     *
     * @param url the URL to create the request for
     * @returns the created HTTPRequest object
     */
    createPUTRequest(url: string): HTTPRequest;
    /**
     * Creates a DELETE request with the factory defaults applied.
     *
     * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
     *
     * @param url the URL to create the request for
     * @returns the created HTTPRequest object
     */
    createDELETERequest(url: string): HTTPRequest;
    /**
     * Creates a PATCH request with the factory defaults applied.
     *
     * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
     *
     * @param url the URL to create the request for
     * @returns the created HTTPRequest object
     */
    createPATCHRequest(url: string): HTTPRequest;
    /**
     * Creates a HEAD request with the factory defaults applied.
     *
     * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
     *
     * @param url the URL to create the request for
     * @returns the created HTTPRequest object
     */
    createHEADRequest(url: string): HTTPRequest;
    /**
     * Creates a TRACE request with the factory defaults applied.
     *
     * See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.
     *
     * @param url the URL to create the request for
     * @returns the created HTTPRequest object
     */
    createTRACERequest(url: string): HTTPRequest;
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
    withAPIConfig(...apis: Array<APIConfig>): this;
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
    createAPIRequest(...args: [string, string] | [string]): HTTPRequest;
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
    withAdapter(adapter: Adapter, options?: AdapterOptions): Promise<HTTPRequestFactory>;
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
    detachAdapter(adapterName: string): Promise<HTTPRequestFactory>;
    /**
     * Returns the names of the adapters attached to the factory.
     *
     *
     * See [Adapters](http://cleverplatypus.github.io/apihive-core/guide/adapters.html) in the docs.
     *
     * @remarks It requires the "adapters" feature to be enabled.
     * @returns The names of the attached adapters.
     */
    getAttachedAdapters(): string[];
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
    hasAdapter(adapterName: string): boolean;
    /**
     * @internal
     */
    private applyAPIDefaultsToRequest;
    /**
     * @internal
     */
    private constructMeta;
    /**
     * @internal
     */
    private getEndpointURL;
}

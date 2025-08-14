import { type LoggerFacade, type LogLevel } from "@apihive/logger-facade";
import { HTTPRequest } from "./HTTPRequest.js";
import { Adapter, AdapterOptions } from "./adapter-types.js";
import { APIConfig, ErrorInterceptor, Feature, HeaderValue, HTTPMethod, ProgressHandlerConfig, RequestConfig, RequestInterceptor, ResponseBodyTransformer } from "./types.js";
/**
 * A factory for creating {@link HTTPRequest} instances.
 * It can be configured with defaults, logging options as well as
 * conditional settings using {@link when} in a method-chain fashion.
 *
 * Adapters can be added to the factory to provide additional functionality.
 * Use cases are request caching, logging, transformation, auto-api generation etc.
 */
export declare class HTTPRequestFactory {
    private requestDefaults;
    private apiConfigs;
    private _logger;
    private _logLevel;
    private afterRequestCreatedHooks;
    private enabledFeatures;
    get logger(): LoggerFacade;
    get logLevel(): LogLevel;
    /**
     * @internal
     * Keeps a mapping of defaults for interceptors to allow removing them
     */
    private interceptorsToRequestDefaults;
    private requestDelegates;
    private factoryDelegates;
    private requireFeature;
    use(feature: Feature): this;
    /**
     * Resets any conditions in the method chain set by {@link when}
     * @returns {HTTPRequestFactory} the factory instance
     */
    always(): this;
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
    when(condition: (config: RequestConfig) => boolean): this;
    deleteRequestInterceptor(interceptor: RequestInterceptor): void;
    /**
     * Sets the logger adapter for the instance for every request created.
     * By default the logger will be set by the factory to the internal `ConsoleLogger` adapter.
     *
     * @param {LoggerFacade} logger - The logger to set.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withLogger(logger: LoggerFacade): this;
    /**
     * Adds {@link APIConfig} configurations that can be consumed by calling {@link createAPIRequest}.
     *
     * @param {...APIConfig } apis - A list of {@link APIConfig} configurations.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withAPIConfig(...apis: Array<APIConfig>): this;
    /**
     * Adds the specified MIME types to the accept header to the factory defaults.
     *
     * @param {...string} mimeTypes - An array of MIME types to be added to the accept header.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withAccept(...mimeTypes: Array<string>): this;
    /**
     * Adds the specified header to the factory defaults.
     *
     * @param {string} key - The key of the header.
     * @param {string | ((request: HTTPRequest) => string)} value - The value of the header.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withHeader(key: string, value: string | ((config: RequestConfig) => string)): this;
    /**
     * Sets the credentials policy for the factory defaults.
     *
     * @param {RequestCredentials} config - The credentials policy to be set.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withCredentialsPolicy(config: RequestCredentials): this;
    /**
     * Sets the log level to the factory defaults.
     *
     * @param {LogLevel} level - The log level to be set.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withLogLevel(level: LogLevel): this;
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
    withRequestInterceptors(...interceptors: RequestInterceptor[]): this;
    /**
     * Adds a response body transformer to the factory defaults.
     *
     * @param {ResponseBodyTransformer} transformer - The function that will be used to transform the response body.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withResponseBodyTransformers(...transformers: ResponseBodyTransformer[]): this;
    /**
     * Adds the provided headers to the factory defaults.
     *
     * @param {Record<string, HeaderValue>} headers - The headers to be added to the request.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withHeaders(headers: Record<string, HeaderValue>): this;
    withErrorInterceptors(...interceptors: ErrorInterceptor[]): this;
    /**
     * Adds the provided JSON MIME types regexp patterns to the factory defaults.
     * Useful when dealing with APIs returning JSON but with proprietary mime type.
     *
     * @param {...string} mimeTypes - An array of MIME types to be added to the request.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withJSONMimeTypes(...mimeTypes: string[]): this;
    /**
     * Adds the provided text MIME types regexp patterns to the factory defaults.
     * The library recognizes text/*, application/.*\+xml, image/.*\+xml, application/javascript
     * by default as text.
     *
     * @param {...string} mimeTypes - An array of MIME types to be added to the request.
     * @returns {HTTPRequestFactory} the factory instance
     */
    withTextMimeTypes(...mimeTypes: string[]): this;
    /**
     * Attaches an adapter to this factory instance.
     * Adapters extend the factory's functionality through interceptors and hooks.
     *
     * @param adapter - The adapter to attach
     * @param options - Optional configuration for the adapter
     * @returns The factory instance for method chaining
     */
    withAdapter(adapter: Adapter, options?: AdapterOptions): Promise<HTTPRequestFactory>;
    /**
     * Detaches an adapter from this factory instance.
     *
     * @param adapterName - The name of the adapter to detach
     * @returns The factory instance for method chaining
     */
    detachAdapter(adapterName: string): Promise<HTTPRequestFactory>;
    /**
     * Gets a list of attached adapter names.
     *
     * @returns Array of adapter names
     */
    getAttachedAdapters(): string[];
    /**
     * Checks if an adapter is attached.
     *
     * @param adapterName - The name of the adapter to check
     * @returns True if the adapter is attached
     */
    hasAdapter(adapterName: string): boolean;
    /**
     * Factory method for creating POST requests
     * @param {String} url
     */
    createPOSTRequest(url: string): HTTPRequest;
    /**
     * Factory method for creating GET requests
     * @param {String} url
     */
    createGETRequest(url: string): HTTPRequest;
    /**
     * Factory method for creating PUT requests
     * @param {String} url
     */
    createPUTRequest(url: string): HTTPRequest;
    /**
     * Factory method for creating DELETE requests
     * @param {String} url
     */
    createDELETERequest(url: string): HTTPRequest;
    createPATCHRequest(url: string): HTTPRequest;
    createHEADRequest(url: string): HTTPRequest;
    createTRACERequest(url: string): HTTPRequest;
    createRequest(url: string, method?: HTTPMethod): HTTPRequest;
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
    createAPIRequest(...args: [string, string] | [string]): HTTPRequest;
    withProgressHandlers(...handlers: ProgressHandlerConfig[]): HTTPRequestFactory;
}

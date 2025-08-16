import { type LoggerFacade, type LogLevel } from '@apihive/logger-facade';
import type { BeforeFetchHook, ErrorInterceptor, FeatureName, FeatureRequestDelegates, HeaderValue, HTTPMethod, ProgressHandlerConfig, QueryParameterValue, RequestConfig, RequestConfigBuilder, RequestInterceptor, ResponseBodyTransformer, ResponseInterceptor, ResponseInterceptorWithOptions, WrappedResponse } from './types.js';
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
};
/**
 * @remarks This class shouldn't be instanciated directly.<br>Use {@link HTTPRequestFactory} createXXXRequest() instead
 */
export declare class HTTPRequest {
    private configBuilders;
    private wasUsed;
    private logger;
    private config;
    private timeoutID?;
    private fetchBody;
    private _abortController;
    private readOnlyConfig;
    private finalizedURL?;
    private beforeFetchHooks;
    private featureDelegates;
    private factoryMethods;
    private abortListeners;
    private wrapErrors;
    get abortController(): AbortController;
    /**
     * Returns the fetch response content in its appropriate format.
     * If progress handlers are enabled, the response will be processed
     * using the download progress handler.
     *
     * @internal
     * @param response the fetch response
     */
    private readResponse;
    /**
     * Applies configured response body transformers to a value, in order.
     * If there are no transformers, returns the value untouched.
     *
     * @internal
     * @param value the value to transform
     * @returns a promise that resolves to the transformed value
     */
    private applyResponseTransformers;
    constructor({ url, method, defaultConfigBuilders, featureDelegates, factoryMethods, wrapErrors }: RequestConstructorArgs);
    /**
     * Creates a new request config object.
     *
     * @internal
     * @param url the URL of the request
     * @param method the HTTP method of the request
     * @returns a new request config object
     */
    private createConfigObject;
    private isFinalized;
    private throwIfFinalized;
    private getLogger;
    private setupHeaders;
    private setupTimeout;
    private registerAbortListeners;
    private setupBody;
    private composeURL;
    /**
     * Executes the fetch request and returns a Promise that resolves with the parsed result.
     *
     * @returns A Promise that resolves with the result of the request.
     */
    execute(): Promise<any | WrappedResponse>;
    /**
     * Retrieves a read-only copy of configuration with lazy evaluation.
     * Function-based values (body, headers) are only evaluated when accessed.
     *
     * @returns A read-only configuration object with lazy evaluation.
     */
    getReadOnlyConfig(): RequestConfig;
    /**
     * Creates request controls for interceptors to manipulate the request during execution.
     * @internal
     */
    private createRequestInterceptorControls;
    /**
     * Creates response controls for response interceptors.
     * @internal
     */
    private createResponseControls;
    /**
     * Configures the request with metadata that can be inspected later.
     *
     * @param param1 The key or object containing the key-value pairs to update the meta property.
     * @param param2 The value to associate with the key when param1 is a string.
     * @returns The current object instance for method chaining.
     */
    withMeta(param1: string | Record<string, any>, param2?: any): this;
    /**
     * Sets an LoggerFacade compatible logger for the request.
     * Normally the logger will be set by the factory.
     *
     * @param logger The logger to be set.
     * @returns The updated HTTP request instance.
     */
    withLogger(logger: LoggerFacade): this;
    /**
     * Sets the credentials policy for the HTTP request.
     *
     * @param config The configuration for the credentials.
     * @returns The updated HTTP request instance.
     */
    withCredentialsPolicy(config: RequestCredentials): HTTPRequest;
    /**
     * Clears the config builders array and returns the instance.
     * Useful in cases where you want to create a new request that doesn't inherit
     * from API/factory settings that might have headers or other unwanted configuration
     *
     * @returns the updated request
     */
    blank(): this;
    /**
     * Adds an abort handler to the request.
     *
     * @param handler The abort handler to add.
     * @returns The updated request instance.
     */
    withAbortListener(handler: (event: Event) => void): this;
    /**
     * Sets the accepted MIME types for the request.
     *
     * Short hand for `withHeader('Accept', 'application/json')`
     *
     * @param mimeTypes An array of MIME types to accept.
     * @returns The updated request instance.
     */
    withAccept(...mimeTypes: string[]): this;
    /**
     * Adds a URL parameter to the request configuration.
     *
     * @param name The name of the URL parameter.
     * @param value The value of the URL parameter.
     * @returns The updated request instance.
     */
    withURLParam(name: string, value: string): this;
    /**
     * Assigns multiple query params to the request configuration.
     *
     * @param params The URL parameters to assign.
     * @returns The updated request instance.
     */
    withURLParams(params: Record<string, QueryParameterValue>): this;
    /**
     * Sets the request body to a form encoded string.
     *
     * @param data The form encoded string to set as the request body.
     * @returns The updated request instance.
     */
    withFormEncodedBody(data: string): this;
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
    withErrorInterceptors(...interceptors: ErrorInterceptor[]): this;
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
    withRequestInterceptors(...interceptors: RequestInterceptor[]): this;
    /**
     * Set the request body as a JSON object or string.
     *
     * @param json The JSON object or string to set as the request body.
     * @returns The updated request instance.
     */
    withJSONBody(json: any): this;
    /**
     * Set the request body to a FormData object and allows customizing the form data before sending the request.
     *
     * @param composerCallBack The callback function that customizes the FormData object
     * @returns The updated request instance.
     */
    withFormDataBody(composerCallBack?: (formData: FormData) => void): HTTPRequest;
    /**
     * Short-hand for setting the accepted MIME types to ['*\/*'] which means the API accepts any MIME type.
     *
     * @returns The current object instance.
     */
    withAcceptAny(): this;
    /**
     * When called, the request will not try to parse the response
     *
     * @returns The updated request instance.
     */
    ignoreResponseBody(): this;
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
    withQueryParams(params: Record<string, QueryParameterValue>): this;
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
    withQueryParam(name: string, value: QueryParameterValue): this;
    /**
     * Sets the CORS mode to 'no-cors' and returns the current object.
     *
     * @returns The current object.
     */
    withNoCors(): this;
    /**
     * Sets the MIME types that are considered JSON on top of the default
     * patterns.
     *
     * @param mimeTypes The MIME types to add.
     * @returns The updated request instance.
     */
    withJSONMimeTypes(...mimeTypes: string[]): this;
    /**
     * Sets the MIME types that are considered text on top of the default
     * patterns.
     *
     * @param mimeTypes The MIME types to add.
     * @returns The updated request instance.
     */
    withTextMimeTypes(...mimeTypes: string[]): this;
    /**
     *
     * @param level the log level to apply for this request
     * Overrides the default log level.
     * @returns The updated request instance.
     */
    withLogLevel(level: LogLevel): this;
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
    withHeaders(headers: Record<string, HeaderValue>): this;
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
    withHeader(name: string, value: HeaderValue): this;
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
    withResponseBodyTransformers(...transformers: ResponseBodyTransformer[]): this;
    /**
     *
     * @param timeout milliseconds to wait before failing the request as timed out
     * @returns The updated request instance.
     */
    withTimeout(timeout: number): this;
    /**
     *
     * @param interceptors The response interceptors to apply.
     *
     * See [Response Interceptors](https://cleverplatypus.github.io/apihive-core/guide/response-interceptors.html)
     *
     * @returns The updated request instance.
     */
    withResponseInterceptors(...interceptors: Array<ResponseInterceptor | ResponseInterceptorWithOptions>): HTTPRequest;
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
    getHash(): string;
    /**
     * Adds progress handlers for the request.
     *
     * See [Progress Handlers](https://cleverplatypus.github.io/apihive-core/guide/progress-handlers.html)
     *
     * @remarks This is an optional feature (download-progress and upload-progress) that must be enabled on the factory.
     * @param handlers The progress handlers to apply.
     * @returns The updated request object.
     */
    withProgressHandlers(...handlers: ProgressHandlerConfig[]): HTTPRequest;
    /**
     * Adds a {@link BeforeFetchHook} for the request.
     *
     * @param hook The before fetch hook to apply.
     * @returns The updated request object.
     */
    withBeforeFetchHook(hook: BeforeFetchHook): HTTPRequest;
}
export {};

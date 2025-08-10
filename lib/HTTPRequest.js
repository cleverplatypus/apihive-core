import ConsoleLogger from "./ConsoleLogger.js";
import { TEXT_TYPES } from "./constants.js";
import HTTPError from "./HTTPError.js";
/**
 * HTTP Request. This class shouldn't be instanciated directly.
 * Use {@link HTTPRequestFactory} createXXXRequest() instead
 */
export class HTTPRequest {
    /**
     * Applies configured response body transformers to a value, in order.
     * If there are no transformers, returns the value untouched.
     */
    async applyResponseTransformers(value) {
        var _a;
        if (!((_a = this.config.responseBodyTransformers) === null || _a === void 0 ? void 0 : _a.length))
            return value;
        let transformed = value;
        for (const transformer of this.config.responseBodyTransformers) {
            transformed = await transformer(transformed, this.getReadOnlyConfig());
        }
        return transformed;
    }
    constructor({ url, method, defaultConfigBuilders, }) {
        this.wasUsed = false;
        this.logger = new ConsoleLogger();
        this.fetchBody = null;
        this.abortController = new AbortController();
        /**
         * Returns the fetch response content in its appropriate format
         * @param {Response} response
         */
        this.readResponse = async (response) => {
            var _a;
            const contentType = (_a = response.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.split(/;\s?/)[0];
            if (!contentType) {
                this.getLogger().info(`No content-type header found for response`);
                return null;
            }
            if (contentType.startsWith('application/json')) {
                return await response.json();
            }
            if (TEXT_TYPES.find((type) => new RegExp(type).test(contentType))) {
                return await response.text();
            }
            return await response.blob();
        };
        this.configBuilders = defaultConfigBuilders;
        this.wasUsed = false;
        this.config = {
            url,
            headers: {},
            body: null,
            timeout: 0,
            ignoreResponseBody: false,
            uriEncodedBody: false,
            method,
            credentials: "same-origin",
            logLevel: "error",
            corsMode: "cors",
            meta: {},
            queryParams: {},
            expectedResponseFormat: "auto",
            acceptedMIMETypes: ["*/*"],
            urlParams: {},
            errorInterceptors: [],
            responseInterceptors: [],
            requestInterceptors: [],
            responseBodyTransformers: [],
        };
    }
    /**
     * Gets the URL of the request.
     *
     * @returns {string} the URL of the request
     */
    get url() {
        return this.config.url;
    }
    getLogger() {
        return this.logger.withMinimumLevel(this.config.logLevel);
    }
    setupHeaders() {
        var _a;
        const headers = this.config.headers;
        for (let n in headers) {
            if (typeof headers[n] === "function") {
                headers[n] = headers[n](this);
            }
            (_a = headers[n]) !== null && _a !== void 0 ? _a : delete headers[n];
        }
        this.fetchBody.headers = headers;
    }
    setupTimeout() {
        if (this.config.timeout) {
            this.timeoutID = setTimeout(() => {
                this.getLogger().debug("HttpRequestFactory : Fetch timeout", `Request timeout after ${this.config.timeout / 1000} seconds`);
                this.abortController.abort();
            }, this.config.timeout);
        }
        this.getLogger().debug("HttpRequestFactory : Fetch invoked", this.fetchBody);
    }
    setupQueryParams() {
        if (Object.keys(this.config.queryParams).length) {
            const params = new URLSearchParams();
            for (let k in this.config.queryParams) {
                params.set(k, this.config.queryParams[k]);
            }
            this.config.url = `${this.config.url}?${params.toString()}`;
        }
    }
    setupBody() {
        if (!this.config.body)
            return;
        this.fetchBody.body = this.config.body();
    }
    setupURL() {
        for (const key in this.config.urlParams) {
            const value = this.config.urlParams[key];
            this.config.url = this.config.url.replace(`{{${key}}}`, typeof value === "function" ? value(this) : value);
        }
    }
    /**
     * Executes the fetch request and returns a Promise that resolves with the parsed result.
     *
     * @return {Promise<any>} A Promise that resolves with the result of the request.
     */
    async execute() {
        var _a;
        if (this.wasUsed) {
            throw new Error("HttpRequests cannot be reused. Please call a request factory method for every new call");
        }
        const logger = this.getLogger();
        this.configBuilders.forEach((config) => {
            config(this, this.getReadOnlyConfig());
        });
        this.fetchBody = {
            method: this.config.method,
            mode: this.config.corsMode,
            credentials: this.config.credentials,
        };
        this.fetchBody.signal = this.abortController.signal;
        this.setupHeaders();
        this.setupTimeout();
        this.setupQueryParams();
        this.setupBody();
        this.setupURL();
        this.wasUsed = true;
        // Create controls for interceptors
        const requestControls = this.createRequestControls();
        for (const interceptor of this.config.requestInterceptors || []) {
            let interceptorResponse = await interceptor(this.getReadOnlyConfig(), requestControls);
            if (interceptorResponse === undefined) {
                continue;
            }
            interceptorResponse = await this.applyResponseTransformers(interceptorResponse);
            return interceptorResponse;
        }
        let response;
        try {
            logger.debug("HttpRequestFactory : Fetch url to be called", this.config.url);
            response = await fetch(this.config.url, this.fetchBody);
            logger.trace("HttpRequestFactory : Fetch response", response);
            if (this.config.responseInterceptors.length) {
                const responseControls = this.createResponseControls();
                for (const entry of this.config.responseInterceptors) {
                    const { interceptor, skipTransformersOnReturn } = typeof entry === 'function'
                        ? { interceptor: entry, skipTransformersOnReturn: false }
                        : { interceptor: entry.interceptor, skipTransformersOnReturn: (_a = entry.skipTransformersOnReturn) !== null && _a !== void 0 ? _a : false };
                    let interceptorResponse = await interceptor(response, this.getReadOnlyConfig(), responseControls);
                    if (interceptorResponse !== undefined) {
                        if (!skipTransformersOnReturn) {
                            interceptorResponse = await this.applyResponseTransformers(interceptorResponse);
                        }
                        return interceptorResponse;
                    }
                }
            }
            if (response.ok) {
                if (this.config.ignoreResponseBody || response.status === 204) {
                    return;
                }
                let body = await this.readResponse(response);
                body = await this.applyResponseTransformers(body);
                return body;
            }
            else {
                const error = new HTTPError(response.status, response.statusText, await this.readResponse(response));
                for (const interceptor of this.config.errorInterceptors || []) {
                    if (await interceptor(error)) {
                        break;
                    }
                }
                return Promise.reject(error);
            }
        }
        catch (error) {
            if (error.name === "AbortError") {
                const abortError = new HTTPError(-1, "Request aborted");
                // Call error interceptors for abort errors
                for (const interceptor of this.config.errorInterceptors || []) {
                    if (await interceptor(abortError)) {
                        break;
                    }
                }
                return Promise.reject(abortError);
            }
            logger.error("HttpRequestFactory : Fetch error", {
                type: "fetch-error",
                endpoint: this.config.url,
                details: error,
            });
            // Convert network error to HTTPError and call error interceptors
            const httpError = new HTTPError(-1, error.message || "Network error", error);
            for (const interceptor of this.config.errorInterceptors || []) {
                if (await interceptor(httpError)) {
                    break;
                }
            }
            return Promise.reject(httpError);
        }
        finally {
            clearTimeout(this.timeoutID);
        }
    }
    /**
     * Retrieves a read-only copy of configuration with lazy evaluation.
     * Function-based values (body, headers) are only evaluated when accessed.
     *
     * @return {RequestConfig} A read-only configuration object with lazy evaluation.
     */
    getReadOnlyConfig() {
        const config = { ...this.config };
        // Create a proxy that lazily evaluates function-based properties
        return new Proxy(config, {
            get: (target, prop) => {
                const value = target[prop];
                // Handle body property - evaluate function if needed
                if (prop === 'body' && typeof value === 'function') {
                    try {
                        return value();
                    }
                    catch (error) {
                        return null;
                    }
                }
                // Handle headers property - create lazy header proxy
                if (prop === 'headers' && typeof value === 'object' && value !== null) {
                    return new Proxy(value, {
                        get: (headerTarget, headerProp) => {
                            const headerValue = headerTarget[headerProp];
                            // Evaluate function-based header when accessed
                            if (typeof headerValue === 'function') {
                                try {
                                    return headerValue(target);
                                }
                                catch (error) {
                                    return undefined;
                                }
                            }
                            return headerValue;
                        },
                        // Make headers enumerable and read-only
                        ownKeys: (headerTarget) => Object.keys(headerTarget),
                        getOwnPropertyDescriptor: (headerTarget, headerProp) => {
                            if (headerProp in headerTarget) {
                                const headerValue = headerTarget[headerProp];
                                const evaluatedValue = typeof headerValue === 'function'
                                    ? (() => { try {
                                        return headerValue(target);
                                    }
                                    catch (_a) {
                                        return undefined;
                                    } })()
                                    : headerValue;
                                return {
                                    enumerable: true,
                                    configurable: false,
                                    writable: false,
                                    value: evaluatedValue
                                };
                            }
                            return undefined;
                        },
                        // Prevent modifications
                        set: () => false,
                        deleteProperty: () => false
                    });
                }
                // Return other properties as-is
                return value;
            },
            // Make config enumerable and read-only
            ownKeys: (target) => Object.keys(target),
            getOwnPropertyDescriptor: (target, prop) => {
                if (prop in target) {
                    const value = target[prop];
                    let evaluatedValue = value;
                    // Evaluate if needed (same logic as the get handler)
                    if (prop === 'body' && typeof value === 'function') {
                        try {
                            evaluatedValue = value();
                        }
                        catch (_a) {
                            evaluatedValue = null;
                        }
                    }
                    return {
                        enumerable: true,
                        configurable: false,
                        writable: false,
                        value: evaluatedValue
                    };
                }
                return undefined;
            },
            // Prevent modifications
            set: () => false,
            deleteProperty: () => false
        });
    }
    /**
     * Creates request controls for interceptors to manipulate the request during execution.
     * @internal
     */
    createRequestControls() {
        return {
            abort: () => {
                //Makes sure that any existing timeout is cleared not to invoke 
                //the abort controller later
                if (this.timeoutID) {
                    clearTimeout(this.timeoutID);
                }
                this.abortController.abort();
            },
            replaceURL: (newURL, newURLParams) => {
                this.config.url = newURL;
                if (newURLParams) {
                    this.config.urlParams = newURLParams;
                }
                this.setupURL();
            },
            updateHeaders: (headers) => {
                Object.assign(this.config.headers, headers);
                this.setupHeaders();
            }
        };
    }
    /**
     * Creates response controls for response interceptors.
     * @internal
     */
    createResponseControls() {
        return {
            getLogger: () => this.getLogger()
        };
    }
    /**
     * Configures the request with metadata that can be inspected later.
     *
     * @param {string | Record<string, any>} param1 - The key or object containing the key-value pairs to update the meta property.
     * @param {any} [param2] - The value to associate with the key when param1 is a string.
     * @return {this} - Returns the current object instance for method chaining.
     */
    withMeta(param1, param2) {
        if (typeof param1 === "string") {
            this.config.meta[param1] = param2;
        }
        else if (typeof param1 === "object") {
            Object.assign(this.config.meta, param1);
        }
        return this;
    }
    /**
     * Sets an ILogger compatible logger for the request. Normally the logger will be set by the factory.
     *
     * @param {LoggerFacade} logger - The logger to be set.
     * @return {HTTPRequest} - The updated HTTP request instance.
     */
    withLogger(logger) {
        this.logger = logger;
        return this;
    }
    /**
     * Sets the credentials policy for the HTTP request.
     *
     * @param {RequestCredentials} config - The configuration for the credentials.
     * @return {HTTPRequest} - The updated HTTP request instance.
     */
    withCredentialsPolicy(config) {
        this.config.credentials = config;
        return this;
    }
    /**
     * Sets the `uriEncodedBody` property of the config object to `true`.
     * This function is used to indicate that the body of the request should be URL encoded.
     *
     * @return {HTTPRequest} - The updated instance of the class.
     */
    withUriEncodedBody() {
        this.config.uriEncodedBody = true;
        return this;
    }
    /**
     * Clears the config builders array and returns the instance.
     * Useful in cases where you want to create a new request that doesn't inherit
     * from API/factory settings that might have headers or other unwanted configuration
     *
     * @return {HTTPRequest} the updated request
     */
    blank() {
        this.configBuilders.splice(0, this.configBuilders.length);
        return this;
    }
    /**
     * Sets the accepted MIME types for the request.
     *
     * @param {...string} mimeTypes - An array of MIME types to accept.
     * @return {HTTPRequest} - The updated request instance.
     */
    withAccept(...mimeTypes) {
        this.config.acceptedMIMETypes = mimeTypes;
        return this;
    }
    /**
     * Adds a URL parameter to the request configuration.
     *
     * @param {string} name - The name of the URL parameter.
     * @param {string} value - The value of the URL parameter.
     * @return {HTTPRequest} - The updated request instance.
     */
    withURLParam(name, value) {
        this.config.urlParams[name] = value;
        return this;
    }
    /**
     * Assigns multiple query params to the request configuration.
     *
     * @param {Record<string, QueryParameterValue>} params - The URL parameters to assign.
     * @return {HTTPRequest} - The updated request instance.
     */
    withURLParams(params) {
        Object.assign(this.config.urlParams, params);
        return this;
    }
    withFormEncodedBody(data) {
        this.withHeader("content-type", "application/x-www-form-urlencoded");
        this.config.body = () => {
            return data;
        };
        return this;
    }
    withErrorInterceptors(...interceptors) {
        this.config.errorInterceptors.push(...interceptors);
    }
    /**
     * Adds a request interceptor to the request configuration.
     * Interceptors are executed in the order they are added.
     * - If a request interceptor returns a rejected promise, the request will fail.
     * - If a request interceptor returns a resolved promise, the promise's result will be used as the response.
     * - If the interceptor returns `undefined`, the request will continue to the next interceptor, if present, or to the regular request handling
     * - the interceptor's second parameter is is a function that can be used to remove the interceptor from further request handling
     *
     * @param {RequestInterceptor} interceptor - The interceptor to add.
     * @return {HTTPRequest} - The updated request instance.
     */
    withRequestInterceptors(...interceptors) {
        this.config.requestInterceptors.push(...interceptors);
    }
    /**
     * Set the request body as a JSON object or string.
     *
     * @param {any} json - The JSON object or string to set as the request body.
     * @return {HTTPRequest} - The updated request instance.
     */
    withJSONBody(json) {
        this.withHeader("content-type", "application/json");
        this.config.body = () => {
            switch (typeof json) {
                case "string":
                    try {
                        JSON.parse(json);
                        return json;
                    }
                    catch (_a) {
                        //do nothing. logging below
                    }
                    break;
                case "object":
                    return JSON.stringify(json);
            }
            this.getLogger().error("POSTHttpRequest.withJSONBody", "Passed body is not a valid JSON string", json);
        };
        return this;
    }
    /**
     * Set the request body to a FormData object and allows customizing the form data before sending the request.
     *
     * @param {Function} composerCallBack - the callback function that customizes the FormData object
     * @return {HTTPRequest}
     */
    withFormDataBody(composerCallBack = () => {
        throw new Error("No composer callback provided");
    }) {
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
     * @return {Object} - The current object instance.
     */
    withAcceptAny() {
        this.config.acceptedMIMETypes = ["*/*"];
        return this;
    }
    /**
     * When called, the request will not try to parse the response
     *
     * @return {HTTPRequest} - The updated request instance.
     */
    ignoreResponseBody() {
        this.config.ignoreResponseBody = true;
        return this;
    }
    /**
     * Adds multiple query parameters to the existing query parameters
     * of the API configuration.
     *
     * @param {Record<string, QueryParameterValue>} params - The query parameters
     * to be added.
     * @return {HTTPRequest} - The updated request instance.
     */
    withQueryParams(params) {
        Object.assign(this.config.queryParams, params);
        return this;
    }
    /**
     * Sets the CORS mode to 'no-cors' and returns the current object.
     *
     * @return {Object} - The current object.
     */
    withNoCors() {
        this.config.corsMode = "no-cors";
        return this;
    }
    /**
     * Adds a query parameter to the request.
     *
     * @param {string} name - The name of the query parameter.
     * @param {QueryParameterValue} value - The value of the query parameter.
     * @return {HTTPRequest} - The updated request instance.
     */
    withQueryParam(name, value) {
        this.config.queryParams[name] = value;
        return this;
    }
    /**
     *
     * @param {String} level the log level to apply for this request. One of LOG_LEVEL_ERROR, LOG_LEVEL_WARN, LOG_LEVEL_INFO, LOG_LEVEL_DEBUG defined in constants.js
     * Overrides the default log level.
     * @return {HTTPRequest} - The updated request instance.
     */
    withLogLevel(level) {
        this.config.logLevel = level;
        return this;
    }
    /**
     * Sets the request's Accept header to 'application/json'
     */
    acceptJSON() {
        this.config.acceptedMIMETypes = ["application/json"];
        return this;
    }
    /**
     * @param {Object} headers name-value pairs to set as headers
     * If value is undefined, the corresponding header will be removed if present
     * @return {HTTPRequest} - The updated request instance.
     */
    withHeaders(headers) {
        if (typeof headers === "object") {
            Object.assign(this.config.headers, headers);
        }
        return this;
    }
    /**
     * Sets the response body transformer for the request. The provided function will be called
     * after the request body is parsed.
     * This is especially useful when used in conjuncion with APIs definition
     * to hide some data massaging logic specific to the api.
     *
     * @param {ResponseBodyTransformer} transformer - The function to transform the body.
     * @param {HTTPRequest} request - The HTTP request object.
     * @return {object} - The updated instance of the class.
     *
     * @example
     * factory.withAPIConfig({
     *    name : 'some-api',
     *    responseBodyTransformer : (body, request) => {
     *         //the response.details is a JSON string that we want
     *         //to parse before the app receives the response
     *         body.details = JSON.parse(body.details)
     *         return body;
     *    }),
     *    endpoints : {
     *       'get-stuff' : {
     *          endpoint : '/get-stuff'
     *       }
     *    }
     * };
     *
     * const response = factory
     *    .createAPIRequest('some-api', 'get-stuff')
     *    .execute();
     * console.log(response.details.some.deep.data);
     */
    withResponseBodyTransformers(...transformers) {
        this.config.responseBodyTransformers.push(...transformers);
        return this;
    }
    /**
     *
     * @param {String} name header name
     * @param {*} value the value for the header, omit this parameter to remove the header
     * @return {HTTPRequest} - The updated request instance.
     */
    withHeader(name, value) {
        this.config.headers[name] = value;
        return this;
    }
    /**
     *
     * @param {Number} timeout milliseconds to wait before failing the request as timed out
     * @return {HTTPRequest} - The updated request instance.
     */
    withTimeout(timeout) {
        this.config.timeout = timeout;
        return this;
    }
    /**
     *
     * @param {Function} handler a callback function to process the raw response coming from the Fetch API.
     * This can be defined if, to override the default behaviour for HTTP status handling.
     * The callback signature is `function(response:Object, requestObj:HttpRequest)`
     * @return {HTTPRequest} - The updated request instance.
     */
    withResponseInterceptors(...interceptors) {
        this.config.responseInterceptors.push(...interceptors);
        return this;
    }
    /**
     * Generates a hash of the request configuration.
     * The hash is deterministic and includes method, URL, relevant headers,
     * query parameters, and body content to ensure consistent identification.
     * This key can be used for request caching purposes.
     *
     * @return {string} A unique hash-based identifier for this request
     */
    getHash() {
        if (this.hash) {
            return this.hash;
        }
        // Create a normalized representation of the request
        const keyComponents = {
            method: this.config.method,
            url: this.config.url,
            queryParams: this.config.queryParams,
            urlParams: this.config.urlParams,
            body: null,
            // Only include headers that affect response (exclude auth, user-agent, etc.)
            relevantHeaders: {}
        };
        // Include request body if present
        if (this.config.body) {
            try {
                const bodyContent = this.config.body();
                // Handle FormData specially for consistent hashing
                if (bodyContent instanceof FormData) {
                    const entries = Array.from(bodyContent.entries()).sort();
                    keyComponents.body = JSON.stringify(entries);
                }
                else if (typeof bodyContent === 'string') {
                    // Check if it's a JSON string and normalize it for consistent property order
                    try {
                        const parsedJSON = JSON.parse(bodyContent);
                        // If it's valid JSON, use deterministic stringify for consistent ordering
                        keyComponents.body = this.deterministicStringify(parsedJSON);
                    }
                    catch (_a) {
                        // Not valid JSON, use as-is
                        keyComponents.body = bodyContent;
                    }
                }
                else {
                    keyComponents.body = bodyContent;
                }
            }
            catch (error) {
                // If body function fails, use the function string as fallback
                keyComponents.body = this.config.body.toString();
            }
        }
        // Include only cache-relevant headers (content-type, accept, etc.)
        const relevantHeaderKeys = ['content-type', 'accept', 'accept-language', 'accept-encoding'];
        for (const headerKey of relevantHeaderKeys) {
            const headerValue = this.config.headers[headerKey] || this.config.headers[headerKey.toLowerCase()];
            if (headerValue !== undefined) {
                keyComponents.relevantHeaders[headerKey.toLowerCase()] =
                    typeof headerValue === 'function' ? headerValue(this.getReadOnlyConfig()) : headerValue;
            }
        }
        // Create a stable string representation with deep sorting
        const keyString = this.deterministicStringify(keyComponents);
        // Generate a hash of the key string for efficiency and cache it
        this.hash = this.simpleHash(keyString);
        return this.hash;
    }
    /**
     * Creates a deterministic string representation of an object with sorted keys.
     * This ensures that objects with the same properties in different orders
     * will produce identical string representations.
     *
     * @param {any} obj - The object to stringify
     * @return {string} A deterministic JSON string
     */
    deterministicStringify(obj) {
        if (obj === null || obj === undefined) {
            return JSON.stringify(obj);
        }
        if (typeof obj !== 'object') {
            return JSON.stringify(obj);
        }
        if (Array.isArray(obj)) {
            return '[' + obj.map(item => this.deterministicStringify(item)).join(',') + ']';
        }
        // Sort object keys and recursively stringify values
        const sortedKeys = Object.keys(obj).sort();
        const pairs = sortedKeys.map(key => {
            const value = this.deterministicStringify(obj[key]);
            return `"${key}":${value}`;
        });
        return '{' + pairs.join(',') + '}';
    }
    /**
     * Simple hash function for generating cache keys.
     * Uses a variant of the djb2 algorithm for good distribution and speed.
     *
     * @param {string} str - The string to hash
     * @return {string} A hexadecimal hash string
     */
    simpleHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Convert to positive hex string
        return (hash >>> 0).toString(16);
    }
}
//# sourceMappingURL=HTTPRequest.js.map
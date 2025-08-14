import { ConsoleLogger, } from "@apihive/logger-facade";
import HTTPError from "./HTTPError.js";
import { maybeFunction } from "./utils.js";
import { DEFAULT_JSON_MIME_TYPES, DEFAULT_TEXT_MIME_TYPES } from "./constants.js";
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
    constructor({ url, method, defaultConfigBuilders, featureDelegates, factoryMethods }) {
        this.wasUsed = false;
        this.logger = new ConsoleLogger();
        this.fetchBody = null;
        this.abortController = new AbortController();
        this.readOnlyConfig = null;
        this.beforeFetchHooks = [];
        /**
         * Returns the fetch response content in its appropriate format
         * @param {Response} response
         */
        this.readResponse = async (response) => {
            var _a, _b;
            const contentType = (_a = response.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.split(/;\s?/)[0];
            if (!contentType) {
                this.getLogger().info(`No content-type header found for response`);
                return null;
            }
            if (this.config.jsonMimeTypes.find((type) => new RegExp(type).test(contentType)))
                return response.json();
            if (this.config.textMimeTypes.find((type) => new RegExp(type).test(contentType))) {
                return await response.text();
            }
            if ((_b = this.config.progressHandlers) === null || _b === void 0 ? void 0 : _b.find((handler) => !!handler.download)) {
                this.factoryMethods.requireFeature("download-progress");
                return this.featureDelegates.handleDownloadProgress({
                    response,
                    abortController: this.abortController,
                    config: this.getReadOnlyConfig()
                });
            }
            return await response.blob();
        };
        this.configBuilders = defaultConfigBuilders;
        this.wasUsed = false;
        this.config = this.createConfigObject(url, method);
        this.featureDelegates = featureDelegates;
        this.factoryMethods = factoryMethods;
    }
    createConfigObject(url, method) {
        const config = {
            templateURLHistory: [url],
            headers: {},
            body: null,
            timeout: 0,
            ignoreResponseBody: false,
            uriEncodedBody: false,
            method,
            // Defaults: match application/json and application/*+json
            jsonMimeTypes: [
                ...DEFAULT_JSON_MIME_TYPES,
            ],
            // Defaults: common textual types
            textMimeTypes: [
                ...DEFAULT_TEXT_MIME_TYPES,
            ],
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
            responseBodyTransformers: []
        };
        Object.defineProperty(config, 'templateURL', {
            get: () => config.templateURLHistory[config.templateURLHistory.length - 1],
            configurable: false,
            enumerable: true
        });
        return config;
    }
    isURLFinalized() {
        return typeof this.finalizedURL === "string";
    }
    getLogger() {
        return this.logger.withMinimumLevel(this.config.logLevel);
    }
    setupHeaders() {
        var _a;
        const headers = this.config.headers;
        for (let n in headers) {
            headers[n] = maybeFunction(headers[n], this);
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
    setupBody() {
        if (!this.config.body)
            return;
        this.fetchBody.body = this.config.body();
    }
    // Build the final URL without mutating template or params
    composeURL() {
        // Start from the tip of the template history
        const tip = this.config.templateURLHistory[this.config.templateURLHistory.length - 1];
        let urlString = tip;
        // Apply path params
        for (const key in this.config.urlParams) {
            const raw = this.config.urlParams[key];
            const value = typeof raw === "function" ? raw(this.getReadOnlyConfig()) : raw;
            urlString = urlString.replace(`{{${key}}}`, String(value));
        }
        // Apply query params
        const url = new URL(urlString, urlString.startsWith('http') ? undefined : 'http://dummy');
        // If template was relative, toString() would include dummy origin; strip it later.
        for (const k of Object.keys(this.config.queryParams)) {
            const qp = this.config.queryParams[k];
            const evaluated = maybeFunction(qp, this.getReadOnlyConfig());
            if (evaluated == null)
                continue;
            if (Array.isArray(evaluated)) {
                for (const v of evaluated)
                    url.searchParams.append(k, String(v));
            }
            else {
                url.searchParams.append(k, String(evaluated));
            }
        }
        const composed = url.toString();
        if (!urlString.startsWith('http')) {
            // Remove dummy origin
            const i = composed.indexOf('://');
            const slash = composed.indexOf('/', i + 3);
            return composed.slice(slash);
        }
        return composed;
    }
    /**
     * Executes the fetch request and returns a Promise that resolves with the parsed result.
     *
     * @return {Promise<any>} A Promise that resolves with the result of the request.
     */
    async execute() {
        var _a, _b, _c, _d;
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
        this.setupBody();
        this.wasUsed = true;
        // Create controls for interceptors
        const requestInterceptorControls = this.createRequestInterceptorControls();
        for (const interceptor of this.config.requestInterceptors || []) {
            let interceptorResponse = await interceptor(this.getReadOnlyConfig(), requestInterceptorControls);
            if (interceptorResponse === undefined) {
                continue;
            }
            interceptorResponse = await this.applyResponseTransformers(interceptorResponse);
            return interceptorResponse;
        }
        let response;
        try {
            this.finalizedURL = this.composeURL();
            logger.debug("HttpRequestFactory : Fetch url to be called", this.finalizedURL);
            if ((_a = this.config.progressHandlers) === null || _a === void 0 ? void 0 : _a.find(handler => !!handler.upload)) {
                this.factoryMethods.requireFeature("upload-progress");
            }
            for (const hook of this.beforeFetchHooks) {
                // Keep mutable config for hooks to support adapters/tests that set fetchImpl dynamically
                await hook(this.fetchBody, this.config);
            }
            const fetchImpl = ((_c = (_b = this.featureDelegates).getFetchImpl) === null || _c === void 0 ? void 0 : _c.call(_b, this.getReadOnlyConfig())) ||
                globalThis.fetch;
            response = await fetchImpl(this.finalizedURL, this.fetchBody);
            logger.trace("HttpRequestFactory : Fetch response", response);
            if (this.config.responseInterceptors.length) {
                const responseControls = this.createResponseControls();
                for (const entry of this.config.responseInterceptors) {
                    const { interceptor, skipTransformersOnReturn } = typeof entry === "function"
                        ? {
                            interceptor: entry,
                            skipTransformersOnReturn: false,
                        }
                        : {
                            interceptor: entry
                                .interceptor,
                            skipTransformersOnReturn: (_d = entry
                                .skipTransformersOnReturn) !== null && _d !== void 0 ? _d : false,
                        };
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
                endpoint: this.composeURL(),
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
        if (this.readOnlyConfig)
            return this.readOnlyConfig;
        // IMPORTANT: Proxy the live config object (no cloning) so updates remain visible.
        const target = this.config;
        const readonly = new Proxy(target, {
            get: (t, prop) => {
                // Expose finalURL if finalized; warn if accessed prematurely
                if (prop === "finalURL") {
                    if (!this.isURLFinalized()) {
                        this.getLogger().warn("HttpRequestFactory : Access to finalURL before URL finalisation", { type: "final-url-access-before-finalise" });
                        return undefined;
                    }
                    return this.finalizedURL;
                }
                // Expose the current template URL tip
                if (prop === "templateURL") {
                    const tip = t.templateURLHistory[t.templateURLHistory.length - 1];
                    return tip;
                }
                if (prop === "body") {
                    try {
                        return maybeFunction(t.body, readonly);
                    }
                    catch (error) {
                        this.getLogger().warn("HttpRequestFactory : Error evaluating body", {
                            type: "body-error",
                            endpoint: target.templateURL,
                            details: error,
                        });
                        return null;
                    }
                }
                if (prop === "headers") {
                    const headersTarget = t.headers || {};
                    return new Proxy(headersTarget, {
                        get: (hTarget, hProp) => {
                            const headerValue = hTarget[hProp];
                            try {
                                return maybeFunction(headerValue, readonly);
                            }
                            catch (error) {
                                this.getLogger().warn("HttpRequestFactory : Error evaluating header", {
                                    type: "header-error",
                                    key: String(hProp),
                                    endpoint: target.templateURL,
                                    details: error,
                                });
                                return undefined;
                            }
                        },
                        ownKeys: (hTarget) => Object.keys(hTarget),
                        getOwnPropertyDescriptor: (hTarget, hProp) => {
                            if (Object.prototype.hasOwnProperty.call(hTarget, hProp)) {
                                let evaluatedValue;
                                try {
                                    evaluatedValue = maybeFunction(hTarget[hProp], readonly);
                                }
                                catch (error) {
                                    this.getLogger().warn("HttpRequestFactory : Error evaluating header", {
                                        type: "header-error",
                                        key: String(hProp),
                                        endpoint: target.templateURL,
                                        details: error,
                                    });
                                    evaluatedValue = undefined;
                                }
                                return {
                                    enumerable: true,
                                    configurable: false,
                                    writable: false,
                                    value: evaluatedValue,
                                };
                            }
                            return undefined;
                        },
                        set: () => false,
                        deleteProperty: () => false,
                    });
                }
                return t[prop];
            },
            set: () => false,
            deleteProperty: () => false,
        });
        this.readOnlyConfig = readonly;
        return this.readOnlyConfig;
    }
    /**
     * Creates request controls for interceptors to manipulate the request during execution.
     * @internal
     */
    createRequestInterceptorControls() {
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
                if (this.isURLFinalized()) {
                    throw new Error("URL has already been finalised; replaceURL() is not allowed");
                }
                // Push new template (absolute or relative), placeholders allowed
                this.config.templateURLHistory.push(newURL);
                if (newURLParams) {
                    this.config.urlParams = newURLParams;
                }
                // Do not persist composed URL; it will be computed on demand.
            },
            updateHeaders: (headers) => {
                Object.assign(this.config.headers, headers);
                this.setupHeaders();
            },
            finaliseURL: () => {
                if (!this.isURLFinalized()) {
                    this.finalizedURL = this.composeURL();
                }
                return this.finalizedURL;
            },
        };
    }
    /**
     * Creates response controls for response interceptors.
     * @internal
     */
    createResponseControls() {
        return {
            getLogger: () => this.getLogger(),
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
    withJSONMimeTypes(...mimeTypes) {
        // Extend current patterns (avoid replacing defaults)
        this.config.jsonMimeTypes = [
            ...this.config.jsonMimeTypes,
            ...mimeTypes,
        ];
        return this;
    }
    withTextMimeTypes(...mimeTypes) {
        // Extend current patterns (avoid replacing defaults)
        this.config.textMimeTypes = [
            ...this.config.textMimeTypes,
            ...mimeTypes,
        ];
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
            const normalised = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
            Object.assign(this.config.headers, normalised);
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
        this.config.headers[name.toLowerCase()] = value;
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
        this.factoryMethods.requireFeature("request-hash");
        return this.featureDelegates.getHash(this);
    }
    withProgressHandlers(...handlers) {
        if (handlers.some(handler => handler.download))
            this.factoryMethods.requireFeature("download-progress");
        if (handlers.some(handler => handler.upload))
            this.factoryMethods.requireFeature("upload-progress");
        this.config.progressHandlers = handlers;
        return this;
    }
    withBeforeFetchHook(hook) {
        this.beforeFetchHooks.push(hook);
        return this;
    }
}
//# sourceMappingURL=HTTPRequest.js.map
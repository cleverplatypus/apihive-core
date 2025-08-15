import { ConsoleLogger } from '@apihive/logger-facade';
import { HTTPRequest } from './HTTPRequest.js';
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
    constructor() {
        // ---------------------------------------------------------------------------
        // Private fields
        // ---------------------------------------------------------------------------
        this.requestDefaults = [];
        this.apiConfigs = {};
        this._logger = new ConsoleLogger();
        this._logLevel = 'error';
        this.afterRequestCreatedHooks = [];
        this.enabledFeatures = new Map();
        /**
         * @internal Keeps a mapping of defaults for interceptors to allow removing them
         */
        this.interceptorsToRequestDefaults = new Map();
        this.requestDelegates = {};
        this.factoryDelegates = {};
    }
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
    use(feature) {
        var _a;
        this.enabledFeatures.set(feature.name, feature);
        (_a = feature.apply) === null || _a === void 0 ? void 0 : _a.call(feature, this, {
            addRequestDefaults: (...args) => {
                this.requestDefaults.push(...args);
            },
            removeRequestDefaults: (...args) => {
                this.requestDefaults = this.requestDefaults.filter((defaultFn) => !args.includes(defaultFn));
            },
            afterRequestCreated: (hook) => {
                this.afterRequestCreatedHooks.push(hook);
            },
            beforeFetch: (hook) => {
                this.requestDefaults.push((request) => request.withBeforeFetchHook(hook));
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
    requireFeature(featureName) {
        if (!this.enabledFeatures.has(featureName)) {
            throw new Error(`Feature "${featureName}" not enabled. Call factory.use(featureObj).`);
        }
    }
    // ---------------------------------------------------------------------------
    // Defaults configuration
    // ---------------------------------------------------------------------------
    /**
     * Sets the logger adapter for the factory.
     
     * @param logger a logger complying with the LoggerFacade interface
     * @returns the factory instance
     */
    withLogger(logger) {
        this._logger = logger;
        this.requestDefaults.push((request) => request.withLogger(logger));
        return this;
    }
    /**
     * Sets the log level for the factory.
     *
     * @param level the log level to set
     * @returns the factory instance
     */
    withLogLevel(level) {
        this._logLevel = level;
        this.requestDefaults.push((request) => request.withLogLevel(level));
        return this;
    }
    /**
     * Sets the default accept header to the factory defaults.
     *
     * @param mimeTypes the MIME types to accept
     * @returns the factory instance
     */
    withAccept(...mimeTypes) {
        this.requestDefaults.push((request) => request.withAccept(...mimeTypes));
        return this;
    }
    /**
     * Sets the default [value] for the header [key] to the factory defaults.
     *
     * @param key the header key
     * @param value the header value
     * @returns the factory instance
     */
    withHeader(key, value) {
        this.requestDefaults.push((request) => request.withHeader(key, value));
        return this;
    }
    /**
     * Sets the value for the passed key/value pairs of headers to the factory defaults.
     *
     * @param headers a key/value pair of headers to set
     * @returns the factory instance
     */
    withHeaders(headers) {
        if (typeof headers === 'object') {
            for (const name of Object.keys(headers)) {
                this.requestDefaults.push((request) => request.withHeader(name, headers[name]));
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
    withCredentialsPolicy(config) {
        this.requestDefaults.push((request) => request.withCredentialsPolicy(config));
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
    withRequestInterceptors(...interceptors) {
        for (const interceptor of interceptors) {
            const defaultFn = function (request) {
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
    withErrorInterceptors(...interceptors) {
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
    withResponseBodyTransformers(...transformers) {
        this.requestDefaults.push(...transformers.map((transformer) => (request) => request.withResponseBodyTransformers(transformer)));
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
    withJSONMimeTypes(...mimeTypes) {
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
    withTextMimeTypes(...mimeTypes) {
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
    withProgressHandlers(...handlers) {
        if (handlers.some((handler) => handler.download) && !this.requestDelegates.handleDownloadProgress)
            this.requireFeature('download-progress');
        if (handlers.some((handler) => handler.upload) && !this.requestDelegates.handleUploadProgress)
            this.requireFeature('upload-progress');
        this.requestDefaults.push((request) => request.withProgressHandlers(...handlers));
        return this;
    }
    /**
     * Adds the provided abort listener to the factory defaults.
     * See [Abort Listeners](http://cleverplatypus.github.io/apihive-core/guide/abort-listeners.html) in the documentation
     *
     * @param listener the listener to add
     * @returns the factory instance
     */
    withAbortListener(listener) {
        this.requestDefaults.push((request) => {
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
    when(condition) {
        const proxy = new Proxy(this, {
            get: (target, prop) => {
                if (prop === 'always') {
                    return () => target;
                }
                if (prop === 'when') {
                    return (condition) => target.when(condition);
                }
                if (typeof target[prop] === 'function' && prop.toString().startsWith('with')) {
                    return (...args) => {
                        const fn = (request, config) => {
                            if (condition(config)) {
                                request[prop](...args);
                            }
                        };
                        this.requestDefaults.push(fn);
                        return this;
                    };
                }
                return target[prop];
            }
        });
        return proxy;
    }
    /**
     * Removes a request interceptor from the factory defaults.
     *
     * See [Request Interceptors](http://cleverplatypus.github.io/apihive-core/guide/request-interceptors.html) in the docs.
     *
     * @param interceptor the interceptor to remove
     */
    deleteRequestInterceptor(interceptor) {
        const requestDefaults = this.interceptorsToRequestDefaults.get(interceptor);
        this.requestDefaults.splice(this.requestDefaults.indexOf(requestDefaults), 1);
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
    createRequest(url, method = 'GET') {
        const featureDelegates = this.requestDelegates;
        const request = new HTTPRequest({
            url,
            method,
            defaultConfigBuilders: this.requestDefaults,
            featureDelegates,
            factoryMethods: {
                requireFeature: this.requireFeature.bind(this)
            }
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
    createGETRequest(url) {
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
    createPOSTRequest(url) {
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
    createPUTRequest(url) {
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
    createDELETERequest(url) {
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
    createPATCHRequest(url) {
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
    createHEADRequest(url) {
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
    createTRACERequest(url) {
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
    withAPIConfig(...apis) {
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
    createAPIRequest(...args) {
        const [apiName, endpointName] = args.length === 1 ? ['default', args[0]] : args;
        this._logger.withMinimumLevel(this._logLevel).trace('Creating API request', apiName, endpointName);
        const api = this.apiConfigs[apiName];
        const endpoint = api === null || api === void 0 ? void 0 : api.endpoints[endpointName];
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
    async withAdapter(adapter, options) {
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
    async detachAdapter(adapterName) {
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
    getAttachedAdapters() {
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
    hasAdapter(adapterName) {
        this.requireFeature('adapters');
        return this.factoryDelegates.hasAdapter(adapterName);
    }
    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------
    /**
     * @internal
     */
    applyAPIDefaultsToRequest(api, request) {
        const apiArrayProps = [
            'responseBodyTransformers',
            'requestInterceptors',
            'responseInterceptors',
            'errorInterceptors',
            'progressHandlers'
        ];
        for (const key of apiArrayProps) {
            const value = api[key];
            if (!value)
                continue;
            const arr = Array.isArray(value) ? value : [value];
            const method = ('with' + key.charAt(0).toUpperCase() + key.slice(1));
            request[method](...arr);
        }
    }
    /**
     * @internal
     */
    constructMeta(api, endpointName, endpoint) {
        const meta = {
            api: {
                name: api.name,
                baseURL: api.baseURL,
                endpoint,
                endpointName
            }
        };
        Object.defineProperty(meta, 'api', {
            writable: false,
            configurable: false,
            enumerable: true
        });
        try {
            Object.assign(meta, api.meta || {}, endpoint.meta || {});
        }
        catch (e) {
            const additionalInfo = [];
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
    getEndpointURL(endpoint, api) {
        if (/^(https?:)?\/\//.test(endpoint.target)) {
            return endpoint.target;
        }
        let base = null;
        if (api.baseURL) {
            base = typeof api.baseURL === 'function' ? api.baseURL(endpoint) : api.baseURL;
        }
        return base ? `${base}${endpoint.target}` : endpoint.target;
    }
}
//# sourceMappingURL=HTTPRequestFactory.js.map
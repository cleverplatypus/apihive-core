import { HTTPRequest } from "./HTTPRequest.js";
import HTTPError from "./HTTPError.js";
import { LoggerFacade, LogLevel } from "@apihive/logger-facade";
import { Adapter, AdapterOptions } from "./adapter-types.js";
import { HTTPRequestFactory } from "./HTTPRequestFactory.js";

export type ProgressPhase = 'upload' | 'download';
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;
export type BeforeFetchHook = (init: RequestInit, config: RequestConfig) => void | Promise<void>;

export type ProgressInfo = {
  phase: ProgressPhase;
  percentProgress: number;       // 0..100
  loadedBytes: number;           // bytes transferred so far
  totalBytes?: number;           // if available
  requestConfig: RequestConfig;  // use getReadOnlyConfig() when invoking
  fallThrough: () => void;       // call this to pass the info to the next handler
};

export type ProgressHandler = (info: ProgressInfo) => void;

export type ProgressHandlerConfig = {
  upload?: ProgressHandler;
  download?: ProgressHandler;
  throttleMs?: number;
};
export type FeatureName = 
  | 'adapters'
  | 'download-progress'
  | 'request-hash'
  | 'upload-progress'
  | 'sse-request'

export interface Feature {
  name : FeatureName;
  apply?(target: HTTPRequestFactory, commands: FeatureCommands): void;
  getDelegates?(factory: HTTPRequestFactory): {
    request? : FeatureRequestDelegates,
    factory? : Partial<FeatureFactoryDelegates>
  }
}

export type FeatureRequestDelegates = {
  getHash?: (request: HTTPRequest, options? : RequestHashOptions) => string;
  handleUploadProgress?: (info: ProgressInfo) => void;
  handleDownloadProgress?: (info : {
    response: Response, 
    abortController: AbortController,
    config: RequestConfig
  }) => Promise<Blob>;
  getFetchImpl?: (config:RequestConfig) => FetchLike;
}

export type FeatureFactoryDelegates = {
  withAdapter?: (adapter: Adapter, options?: AdapterOptions) => HTTPRequestFactory;
  detachAdapter?: (adapterName: string) => HTTPRequestFactory;
  getAttachedAdapters?: () => string[];
  hasAdapter?: (name: string) => boolean;
  /**
   * Factory-level delegate to construct an SSERequest instance.
   * Implementations should instantiate the request with factory defaults applied.
   */
  createSSERequest?: (url: string, args: {
    defaultConfigBuilders: Array<(request: any) => void>;
    wrapErrors: boolean;
  }) => any;
}

export interface SSERequestType {
  // Builders
  withSSEListeners(...listeners: SSEListener[]): this;
  withURLParam(name: string, value: URLParamValue): this;
  withURLParams(params: Record<string, URLParamValue>): this;
  withQueryParam(name: string, value: QueryParameterValue): this;
  withQueryParams(params: Record<string, QueryParameterValue>): this;
  withTimeout(ms: number): this;
  withLogLevel(level: LogLevel): this;
  withMeta(keyOrObj: string | Record<string, any>, val?: any): this;
  withResponseBodyTransformers(...t: ResponseBodyTransformer[]): this;
  /**
   * Register request interceptors. The concrete interceptor signature is internal to the SSE implementation,
   * so this method accepts any functions for typing convenience.
   */
  withRequestInterceptors(...i: any[]): this;
  /** Add error interceptors; used in tests to assert abort behavior via interceptors. */
  withErrorInterceptors(...i: Array<(error: HTTPError) => boolean | Promise<boolean>>): this;

  /** Access to the underlying AbortController used for the connection. */
  readonly abortController: AbortController;

  /** Provide a custom logger implementation. */
  withLogger(logger: LoggerFacade): this;

  /**
   * Establish the SSE connection. The promise resolves only after the connection is opened.
   * When the factory is configured with wrapped errors and the initial connect fails, it resolves to `{ error }` instead.
   */
  execute(): Promise<SSESubscription | WrappedSSEResponse>;
}

export type FeatureCommands = {
  addRequestDefaults: (...args: RequestConfigBuilder[]) => void;
  removeRequestDefaults: (...args: RequestConfigBuilder[]) => void;
  afterRequestCreated: (hook: (request: HTTPRequest) => void) => void | FeatureRequestDelegates;
  beforeFetch: (hook: BeforeFetchHook) => void;
};

export type MaybeGetterFunction<T, Args extends any[] = any[]> =
| T
| ((...args: Args extends infer U ? U : never) => T);

/**
 * Control APIs available to interceptors for manipulating the request during execution.
 */
export interface RequestInterceptorControls {
  /**
   * Abort the current request
   */
  abort(): void;

  /**
   * Replace the request URL
   */
  replaceURL(newURL: string, newURLParams?: URLParams): void;

  /**
   * Update request headers (merges with existing headers)
   */
  updateHeaders(headers: Record<string, any>): void;

  /**
   * Finalise the request URL. After this call, the URL becomes immutable
   * and further calls to replaceURL() will throw.
   * Returns the composed final URL.
   */
  finaliseURL(): string;

  /**
   * Replace the request URL params
   */
  replaceURLParams(newURLParams: URLParams): void;

  /**
   * Get the provisional URL before finalisation
   */
  getProvisionalURL(): string;

  /**
   * Sets a last-minute body replacer
   * 
   * @remarks When a request has a JSON body, the received body is always a string.<br>This means the body would generally need parsing.
   * @param replacer The function to be called with the current body as argument and returning the new body
   */
  replaceBody(replacer: (body: any) => any): void;

  /**
   * Returns a hash string that can be used to uniquely identify the request.
   * 
   * @remarks This is an optional feature (request-hash) that must be enabled on the factory.
   */
  getHash(options?: RequestHashOptions): string;

  /**
   * Returns the logger used by the factory
   */
  getLogger() : LoggerFacade

  /**
   * Skip body transformers for the response
   */
  skipBodyTransformers(): void;
}

export type WrappedResponse = {
  response?: any;
  error?: HTTPError;
}

export type WrappedSSEResponse = {
  subscription?: SSESubscription;
  error?: HTTPError;
}

export type URLParamValue = LiteralValue | MaybeGetterFunction<LiteralValue, [config: RequestConfig]>;

export type URLParams = Record<
  string,
  URLParamValue
>;

/**
 * Control APIs available to response interceptors.
 */
export interface ResponseInterceptorControls {
  /**
   * Returns the logger used by the factory
   */
  getLogger(): LoggerFacade;
  
  /**
   * Skip body transformers for the response
   */
  skipBodyTransformers(): void;

  /**
   * Returns a hash string that can be used to uniquely identify the request.
   * 
   * @remarks This is an optional feature (request-hash) that must be enabled on the factory.
   */
  getHash(options?: RequestHashOptions): string;
}


export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "TRACE";

export type SSEMethod = 'SSE';

export type LiteralValue = string | number | boolean;

export type RequestHashOptions = {
    includeBody?: boolean;
};

export type RequestInterceptor = ( params : {
  config: RequestConfig;
  controls: RequestInterceptorControls;
  factory : HTTPRequestFactory;
}) => Promise<any | undefined>;

export type RequestConfigBuilder = (
  request: HTTPRequest,
  config: RequestConfig
) => void;
/**
 * @internal
 */
export type ExpectedResponseFormat =
  | "auto"
  | "json"
  | "text"
  | "blob"
  | "arrayBuffer";

export type QueryParameterValue = MaybeGetterFunction<LiteralValue | Array<LiteralValue>, [config: RequestConfig]>;

export type DynamicHeaderValue = MaybeGetterFunction<string | undefined, [config: RequestConfig]>;

export type ResponseBodyTransformer = (body: any, config: RequestConfig) => any;

export type HeaderValue = string | DynamicHeaderValue;

export type ResponseHandler = (
  response: Response,
  requestObj: HTTPRequest
) => Promise<any>;

export type ResponseInterceptor = (params : {
  response: Response;
  config: RequestConfig;
  controls: ResponseInterceptorControls;
  factory : HTTPRequestFactory;
}) => Promise<any | undefined>;

export type SSEListener = (data : any) => void;

/**
 * Handle returned by SSE requests upon execute().
 */
export type SSESubscription = {
  /** Closes the underlying SSE connection. */
  close: () => void;
  /** Optional accessor to the underlying EventSource for advanced scenarios. */
  getEventSource?: () => EventSource | null;
};

export type ErrorInterceptor = (error: HTTPError) => boolean | Promise<boolean>;
/**
 * Internal representation of a {@link HTTPRequest}'s configuration
 */
export type RequestConfig = {
  // Internal history of template URLs (tip is the last element)
  templateURLHistory: string[];
  // Virtual/computed fields exposed via read-only proxy (not persisted on config)
  readonly finalURL?: string;       // stable after finalisation
  readonly templateURL?: string;    // alias to tip of templateURLHistory
  headers: Record<string, HeaderValue>;
  body: any;
  jsonMimeTypes: string[];
  textMimeTypes: string[];
  timeout: number;
  method: HTTPMethod;
  logLevel: LogLevel;
  meta: Record<string, any>;
  queryParams: Record<string, QueryParameterValue>;
  responseBodyTransformers: ResponseBodyTransformer[];
  ignoreResponseBody: boolean;
  credentials: RequestCredentials;
  expectedResponseFormat: ExpectedResponseFormat;
  acceptedMIMETypes: string[];
  corsMode: RequestMode;
  urlParams: URLParams;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: Array<ResponseInterceptor>;
  errorInterceptors: ErrorInterceptor[];
  progressHandlers?: ProgressHandlerConfig[];
};

/**
 * The definition of an API endpoint to be listed in the {@link APIConfig.endpoints} map
 */
export type Endpoint = {
  /**
   * The path of the endpoint relative to the API {@link APIConfig.baseURL}
   */
  target: string;
  /**
   * The HTTP method of the endpoint. Defaults to `GET`
   */
  method?: HTTPMethod | SSEMethod;
  /**
   * Any metadata that should be attached to the endpoint's requests for later reference
   */
  meta?: Record<string, any>;
};

/**
 * @internal
 */
export type NamedEndpoint = {
  name: string;
} & Endpoint;

/**
 * Parameter object structure for endpoint functions.
 *
 * This type provides IntelliSense suggestions for standard endpoint parameters
 * while remaining flexible enough to allow specific parameter shapes.
 *
 * @example Standard usage:
 * (params: { pathParams: { id: string }; bodyParams?: { name: string } }) => Promise<User>
 */
export type EndpointParams = {
  pathParams?: Record<string, any>;
  bodyParams?: Record<string, any>;
  queryParams?: Record<string, any>;
  [key: string]: any; // Allows additional properties for flexibility
};

/**
 * Template type for endpoint parameters that provides IntelliSense.
 * Use intersection with this type to get autocomplete for standard parameter properties.
 *
 * @example
 * type CreateUserParams = EndpointParamsTemplate & {
 *   pathParams: { orgId: string };
 *   bodyParams: { name: string; email: string };
 *   queryParams?: { notify: boolean };
 * }
 */
export type EndpointParamsTemplate = {
  pathParams?: any;
  bodyParams?: any;
  queryParams?: any;
};

/**
 * Base type for API configurations where endpoints are defined as functions
 * with single-object parameters. This enables type-safe code generation.
 *
 * @example
 * type GitHubAPI = BaseAPIInterface & {
 *   endpoints: {
 *     getUser: (params: { pathParams: { username: string } }) => Promise<User>;
 *     createRepo: (params: {
 *       pathParams: { owner: string };
 *       bodyParams: { name: string; description?: string };
 *     }) => Promise<Repository>;
 *   };
 *   meta?: { requiresAuth: boolean };
 * }
 */
export type BaseAPIInterface = {
  endpoints?: Record<string, (params: any) => Promise<any>>;
  meta?: Record<string, any>;
};

/**
 * Default API configuration type (no constraints)
 */
export type DefaultAPIConfig = BaseAPIInterface & {
  meta?: Record<string, any>;
  endpoints?: Record<string, (params: EndpointParams) => Promise<any>>;
};

/**
 * Configuration for an API to be added with {@link HTTPRequestFactory.withAPIConfig}
 *
 * @template TApiConfig - Configuration interface that constrains meta and endpoints.
 *                       Must extend BaseAPIInterface for function-based endpoint definitions.
 *
 * @example
 * // Function-based API definition for type-safe code generation
 * interface GitHubAPI {
 *   endpoints: {
 *     getUser: (params: { pathParams: { username: string } }) => Promise<User>;
 *     createRepo: (params: {
 *       pathParams: { owner: string };
 *       bodyParams: { name: string; description?: string };
 *     }) => Promise<Repository>;
 *   };
 *   meta?: { requiresAuth: boolean };
 * }
 * const config: APIConfig<GitHubAPI> = {
 *   name: 'github',
 *   endpoints: {
 *     getUser: { target: '/users/{username}' },
 *     createRepo: { target: '/repos', method: 'POST' }
 *   }
 * };
 *
 * @example
 * // Adapter-driven API (no endpoints allowed)
 * interface OpenAPIConfig {
 *   meta: { openAPI: { spec: string } };
 *   endpoints?: never;
 * }
 * const config: APIConfig<OpenAPIConfig> = { ... }; // endpoints property forbidden
 *
 * @example
 * // Unconstrained API (default)
 * const config: APIConfig = {
 *   name: 'myapi',
 *   endpoints: {
 *     anyEndpoint: { target: '/any/path' } // Any endpoint name allowed
 *   }
 * };
 */
export type APIConfig<TApiConfig extends BaseAPIInterface = DefaultAPIConfig> =
  {
    /**
     * The base to be used as base URL for this API. If omitted, the value provided in each endpoint's `target` will be used.
     */
    baseURL?: string;
    /**
     * The name of the API to be referenced in {@link HTTPRequestFactory.createAPIRequest}
     * If the name is 'default' it will be used as the default API when calling {@link HTTPRequestFactory.createAPIRequest}
     * with one argument (the name of the endpoint).
     */
    name: string | "default";
    /**
     * Any metadata that should be attached to the API for later reference.
     * The structure is constrained by the TApiConfig generic parameter.
     */
    meta?: TApiConfig extends { meta: infer TMeta } ? TMeta : any;
    /**
     * Any headers that should be applied to each request.
     * Notice that if a header value is  {@link DynamicHeaderValue},
     * the function will be called with the current request as argument,
     * so conditional logic can be applied to generate the value.
     */
    headers?: Record<string, HeaderValue>;
    /**
     * An optional {@link ResponseBodyTransformer} function to be applied to all of
     * the API's responses.
     */
    responseBodyTransformers?:
      | ResponseBodyTransformer
      | ResponseBodyTransformer[];
    /**
     * Optional response interceptors applied to all requests of this API.
     * Interceptors can be functions or registrations that control transformer behavior.
     */
    responseInterceptors?:
      | ResponseInterceptor
      | Array<ResponseInterceptor>;
    requestInterceptors?: RequestInterceptor | Array<RequestInterceptor>;
    errorInterceptors?: ErrorInterceptor | Array<ErrorInterceptor>;

    /**
     * A map of {@link Endpoint} for the API.
     * Can be constrained or forbidden by the TApiConfig generic parameter.
     *
     * @example
     * // For adapter-driven APIs, endpoints can be forbidden:
     * // endpoints?: never (prevents manual endpoint configuration)
     *
     * @example
     * // For function-based APIs, only specific endpoint names are allowed:
     * // endpoints: { getUser: Endpoint; getUserRepos: Endpoint } (constrains keys)
     */
    endpoints: TApiConfig extends { endpoints?: never }
      ? never
      : TApiConfig extends {
          endpoints: Record<infer K, (...args: any[]) => any>;
        }
      ? { [P in Extract<K, string>]: Endpoint }
      : { [endpointName: string]: Endpoint };
    SSEListeners?: SSEListener | SSEListener[];
    progressHandlers?: ProgressHandlerConfig | ProgressHandlerConfig[];
  };

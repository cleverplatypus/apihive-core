import { HTTPRequest } from "./HTTPRequest.js";
import HTTPError from "./HTTPError.js";
import { LoggerFacade, LogLevel } from "@apihive/logger-facade";



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
}

export type URLParams = Record<
  string,
  LiteralValue | MaybeGetterFunction<LiteralValue, [config: RequestConfig]>
>;

/**
 * Control APIs available to response interceptors.
 */
export interface ResponseInterceptorControls {
  getLogger(): LoggerFacade;
}


export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "TRACE";

export type LiteralValue = string | number | boolean;

export type RequestInterceptor = (
  config: RequestConfig,
  controls: RequestInterceptorControls
) => Promise<any | undefined>;

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

export type ResponseInterceptor = (
  response: Response,
  config: RequestConfig,
  controls: ResponseInterceptorControls
) => Promise<any>;

// Registration object for response interceptors that can control
// whether returned values should skip response body transformers.
export type ResponseInterceptorWithOptions = {
  interceptor: ResponseInterceptor;
  /**
   * If true, any non-undefined value returned by this interceptor
   * will be returned as-is, without passing through responseBodyTransformers.
   * Defaults to false (transformers are applied).
   */
  skipTransformersOnReturn?: boolean;
};

export type ErrorInterceptor = (error: HTTPError) => boolean | Promise<boolean>;
/**
 * Internal representation of a {@link HTTPRequest}'s configuration
 */
export type RequestConfig = {
  url: string;
  headers: Record<string, HeaderValue>;
  body: any;
  timeout: number;
  method: HTTPMethod;
  logLevel: LogLevel;
  meta: Record<string, any>;
  queryParams: Record<string, QueryParameterValue>;
  responseBodyTransformers: ResponseBodyTransformer[];
  ignoreResponseBody: boolean;
  credentials: RequestCredentials;
  uriEncodedBody: boolean;
  expectedResponseFormat: ExpectedResponseFormat;
  acceptedMIMETypes: string[];
  corsMode: RequestMode;
  urlParams: URLParams;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: Array<ResponseInterceptor | ResponseInterceptorWithOptions>;
  errorInterceptors: ErrorInterceptor[];
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
  method?: HTTPMethod;
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
    baseURL?: string | ((endpoint: Endpoint) => string);
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
      | ResponseInterceptorWithOptions
      | Array<ResponseInterceptor | ResponseInterceptorWithOptions>;
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
  };

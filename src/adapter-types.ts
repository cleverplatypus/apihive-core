import { HTTPRequestFactory } from "./HTTPRequestFactory.js";
import { ErrorInterceptor, Feature, FeatureName, RequestConfigBuilder, RequestInterceptor, ResponseBodyTransformer, ResponseInterceptor } from "./types.js";

/**
 * Priority configuration for adapter interceptors.
 * Lower numbers execute earlier in the chain.
 */
export interface AdapterPriority {
  /** Priority for request interceptors (default: 500) */
  requestInterceptor?: number;
  /** Priority for response interceptors (default: 500) */
  responseInterceptor?: number;

  /** Priority for response body transformers (default: 500) */
  responseBodyTransformer?: number;

  /** Priority for error interceptors (default: 500) */
  errorInterceptor?: number;
}

/**
 * Core interface for all adapters in the apihive ecosystem.
 * Adapters extend the factory's functionality through interceptors and hooks.
 */
export interface Adapter {
  
  /** Unique identifier for this adapter */
  readonly name: string;
  
  /** Default priority for this adapter's interceptors */
  readonly priority?: AdapterPriority;

  /** Features required by this adapter. The factory will throw an error if they're not enabled. */
  readonly require?: FeatureName[];
  
  /** Called when adapter is attached to a factory */
  onAttach?(factory: HTTPRequestFactory): void;
  
  /** Called when adapter is detached from a factory */
  onDetach?(factory: HTTPRequestFactory): void;
  
  /** Returns request interceptors this adapter provides */
  getRequestInterceptors?(): RequestInterceptor[];
  
  /** Returns response interceptors this adapter provides */
  getResponseInterceptors?(): Array<ResponseInterceptor>;

  /** Returns response body transformers this adapter provides */
  getResponseBodyTransformers?(): ResponseBodyTransformer[];
  
  /** Returns error interceptors this adapter provides */
  getErrorInterceptors?(): ErrorInterceptor[];
  
  /** Returns factory defaults this adapter provides */
  getFactoryDefaults?(): RequestConfigBuilder[];
}

/**
 * Configuration options when attaching an adapter
 */
export interface AdapterOptions {
  /** Override adapter's default priorities */
  priority?: Partial<AdapterPriority>;
}

/**
 * Internal adapter registry entry
 * @internal
 */
export interface AdapterEntry {
  adapter: Adapter;
  priority: AdapterPriority;
  attached: boolean;
}

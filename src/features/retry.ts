import HTTPError from '../HTTPError.js';
import { HTTPRequestFactory } from '../HTTPRequestFactory.js';
import {
  BackoffStrategyEvaluator,
  Feature,
  FetchLike,
  RequestConfig,
  RetryCondition,
  RetryConfig,
  RetryDelay,
  RetryMetaConfig
} from '../types.js';
import { maybeFunction } from '../utils.js';
import { probeEmit } from 'vitest-probe';


/**
 * Creates an exponential backoff strategy.
 *
 * @param param The parameters for the backoff strategy.
 * @returns A function that returns the delay in milliseconds for a given attempt.
 */
export function exponentialBackoff(
  param : {initialDelay : number, multiplier : number, maxDelay : number, jitter : boolean} = 
    {initialDelay : 100, multiplier : 2, maxDelay : 30000, jitter : true}): BackoffStrategyEvaluator {
  return (attempt: number) => {
    const delay = Math.min(param.initialDelay * Math.pow(param.multiplier, attempt), param.maxDelay);
    return param.jitter ? delay + Math.random() * delay * 0.1 : delay;
  };
}

/**
 * Creates a linear backoff strategy.
 *
 * @param delay The delay in milliseconds.
 * @returns A function that returns the delay in milliseconds for a given attempt.
 */
export function linearBackoff(
  delay = 1000): BackoffStrategyEvaluator {
  return (attempt: number) =>
    delay * attempt;
}


/**
 * Retry feature
 * 
 * It provides retry functionality to HTTPRequest.
 * 
 * Retry policy can be provided via:
 * - the factory/request's {@link HTTPRequestFactory.withRetry} method
 * - the APIConfig's {@link APIConfig} property
 * - requests metadata when {@link RetryFeature.withMetaConfig} is used
 *
 * @class
 * @implements {Feature}
 */
export default class RetryFeature implements Feature {
  private factory: HTTPRequestFactory;
  readonly name = 'retry' as const;
  readonly priority = 80;

  private defaultRetryDelay: RetryDelay = 1000;
  private defaultAttempts = 0;

  private defaultRetryCondition: RetryCondition = () => true;
  private metaConfig?: RetryMetaConfig;

  /**
   * Set the default delay strategy for retry attempts
   *
   * @param delay The delay in milliseconds or a function that returns the delay
   * @returns The updated feature instance
   */
  withDefaultRetryDelay(delay: RetryDelay) {
    this.defaultRetryDelay = delay;
    return this;
  }

  /**
   * Set the default retry condition for retry attempts
   *
   * @param condition The condition to use
   * @returns The updated feature instance
   */
  withDefaultRetryCondition(condition: RetryCondition) {
    this.defaultRetryCondition = condition;
    return this;
  }

  /**
   * Set the default number of retry attempts
   *
   * @param attempts The number of attempts to use
   * @returns The updated feature instance
   */
  withDefaultAttempts(attempts: number) {
    this.defaultAttempts = attempts;
    return this;
  }

  withDefaults(config: RetryConfig) {
    if (config.attempts !== undefined) {
      this.defaultAttempts = config.attempts;
    }
    if (config.retryDelay !== undefined) {
      this.defaultRetryDelay = config.retryDelay;
    }
    if (config.retryCondition !== undefined) {
      this.defaultRetryCondition = config.retryCondition;
    }
    return this;
  }

  /**
   * Enable deriving retry behavior from a request's `meta` object.
   *
   * This method activates a meta-driven switch to decide whether retries should be
   * applied to a request when an explicit `config.retry` is not provided.
   *
   * Behavior and precedence:
   * - If `config.retry` is set on the request, it takes absolute precedence and
   *   meta evaluation is ignored.
   * - Otherwise, when meta config is enabled via this method, an `evaluator(meta)` is
   *   used to determine whether retries are enabled for that request.
   * - When the evaluator returns `true`, the effective retry configuration is built by
   *   merging:
   *   1) feature defaults (`withDefaultAttempts`, `withDefaultRetryDelay`, `withDefaultRetryCondition`), then
   *   2) `metaConfig.defaults` if provided.
   * - When the evaluator returns `false`, the feature-level defaults still apply, but no
   *   meta overrides are added (equivalent to retries being "off" unless defaults specify otherwise).
   *
   * Defaults when not provided:
   * - `normally`: `'off'`. If no evaluator is supplied, this baseline is used to interpret `meta.retry`.
   * - `evaluator`: If omitted, a safe default is used which:
   *   - Expects `meta.retry` to be `boolean | undefined`.
   *   - Throws if `meta.retry` is present and not a boolean.
   *   - Returns `meta.retry ?? (normally === 'on')`.
   * - `defaults`: Optional partial `RetryConfig` that will be merged on top of feature defaults when
   *   the evaluator enables retries.
   *
   * Notes:
   * - `meta` is expected to be JSON-serializable.
   * - If both meta config is enabled and `config.retry` is present, a warning is logged and the meta
   *   path is ignored in favor of `config.retry`.
   *
   * @example Example: opt-in per request via meta flag
   * ```ts
   * // Enable meta evaluation with defaults
   * retryFeature.withMetaConfig({
   *   normally: 'off',
   *   defaults: {
   *     attempts: 3,
   *     retryDelay: exponentialBackoff({ 
   *       initialDelay: 200, 
   *       multiplier: 2, 
   *       maxDelay: 5000, 
   *       jitter: true 
   *     }),
   *   }
   * });
   *
   * // Later, per request
   * factory.createGETRequest('/items')
   *   .withMeta({ retry: true })
   *   .execute();
   * ```
   *
   * @example Example: custom evaluator
   * ```ts
   * retryFeature.withMetaConfig({
   *   normally: 'on',
   *   evaluator: (meta) => meta.userTier === 'pro' && meta.allowRetry !== false,
   *   defaults: { attempts: 2 }
   * });
   * ```
   *
   * @param metaConfig Optional configuration controlling how meta evaluation works:
   * - `normally`: 'on' | 'off' baseline used by the default evaluator.
   * - `evaluator(meta)`: returns `true` to enable retries; may throw for invalid meta.
   * - `defaults`: partial `RetryConfig` applied when evaluator enables retries.
   * @returns The updated feature instance.
   */
  withMetaConfig(metaConfig?: RetryMetaConfig) {
    const normally = metaConfig?.normally || 'off';
    const evaluator = metaConfig?.evaluator || ((meta: Record<string, any>) => {
      if(meta.retry !== undefined && typeof meta.retry !== 'boolean') {
        throw new Error('Retry feature: `meta.retry` is expected to be a boolean or undefined')
      }
      return meta.retry ?? (normally === 'on')
    });

    // Always set a resolved metaConfig object with all fields present
    this.metaConfig = {
      normally,
      evaluator,
      defaults: metaConfig?.defaults,
    };
    return this;
  }

  getDelegates(factory: HTTPRequestFactory) {
    this.factory = factory;
    return {
      request: {
        getFetchImpl: (config: RequestConfig, baseFetch: FetchLike) =>
          this.createRetryFetchWrapper(config, baseFetch, factory)
      }
    };
  }

  private calculateDelay(
    attempt: number,
    error: HTTPError | undefined,
    retryConfig: RetryConfig,
    requestConfig: RequestConfig
  ): number {
    if (!retryConfig.retryDelay) {
      return maybeFunction<number>(this.defaultRetryDelay, attempt, error!, requestConfig);
    }

    if (typeof retryConfig.retryDelay === 'number') {
      return retryConfig.retryDelay;
    }
    // it's a function
    return retryConfig.retryDelay(attempt, error!, requestConfig);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /*
   * Returns the retry config to use for the given request config.
   * It will first check if the request config has a retry config,
   * then check if the meta config is enabled and if the evaluator returns true,
   * finally it will return the default retry config.
   */
  private getRetryConfig(config: RequestConfig): RetryConfig {

    const baseDefaults = {
      attempts: this.defaultAttempts,
      retryDelay: this.defaultRetryDelay,
      retryCondition: this.defaultRetryCondition
    };
    if(config.retry) {
      this.factory.logger.debug('Retry feature: using config.retry')
      if(this.metaConfig)
        this.factory.logger.warn('Retry feature: metaConfig is enabled, but `config.retry` is also set.`\n`metaConfig` will be ignored')
      const out = Object.assign(baseDefaults, maybeFunction<RetryConfig>(config.retry, config));
      __TEST__ && probeEmit?.('computedRetryConfig', out);
      return out;
    }

    if(this.metaConfig) {
      this.factory.logger.debug('Retry feature: using metaConfig')
      if(this.metaConfig.evaluator(config.meta || {})) {
        const out = Object.assign(baseDefaults, this.metaConfig.defaults);
        __TEST__ && probeEmit?.('computedRetryConfig', out);
        return out;
      }
    }
    this.factory.logger.debug('Retry feature: using retry default config')
    __TEST__ && probeEmit?.('computedRetryConfig', baseDefaults);
    return baseDefaults;
  }

  private createRetryFetchWrapper(
    config: RequestConfig,
    baseFetch: FetchLike,
    _factory: HTTPRequestFactory
  ): FetchLike {

    const retryConfig = this.getRetryConfig(config);

    const attempts = retryConfig.attempts ?? this.defaultAttempts;
    if (attempts === 0) {
      return baseFetch;
    }

    return async (url: string, init: RequestInit): Promise<Response> => {
      let lastError: HTTPError | Error;

      for (let attempt = 0; attempt <= attempts; attempt++) {
        const shouldRetry = retryConfig.retryCondition || this.defaultRetryCondition;
        try {
          const response = await baseFetch(url, init);

          // Check if we should retry based on response
          if (
            attempt < attempts &&
            shouldRetry({
              attempt,
              retryConfig,
              requestConfig: config
            })
          ) {
            const delay = this.calculateDelay(attempt, undefined, retryConfig, config);
            retryConfig.onRetry?.(attempt + 1, new HTTPError(response.status, `HTTP ${response.status}`), delay);
            await this.sleep(delay);
            continue;
          }

          // Success or no more retries
          if (attempt > 0) {
            retryConfig.onRetrySuccess?.(attempt, response);
          }
          return response;
        } catch (error) {
          const httpError = error instanceof HTTPError ? error : new HTTPError(0, error.message || 'Network Error');
          lastError = httpError;

          // Check if we should retry this error
          if (
            attempt < attempts &&
            shouldRetry({
              error: httpError,
              attempt,
              retryConfig,
              requestConfig: config
            })
          ) {
            const delay = this.calculateDelay(attempt, httpError, retryConfig, config);
            retryConfig.onRetry?.(attempt + 1, httpError, delay);
            await this.sleep(delay);
            continue;
          }

          // No more retries or shouldn't retry this error
          break;
        }
      }

      // All retries exhausted
      retryConfig.onMaxAttemptsExceeded?.(lastError as HTTPError, attempts);
      throw lastError!;
    };
  }
}

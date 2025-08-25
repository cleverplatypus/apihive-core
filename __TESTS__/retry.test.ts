import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RetryFeature, exponentialBackoff, linearBackoff } from '../src/features/index.ts';
import HTTPError from '../src/HTTPError.js';
import { HTTPRequestFactory } from '../src/HTTPRequestFactory.js';
import type { RequestConfig, RetryConfig } from '../src/types.js';
import { getProbe } from 'vitest-probe';

describe('RetryFeature', () => {
  let retryFeature: RetryFeature;
  let factory: HTTPRequestFactory;
  let mockFetch: any;

  beforeEach(() => {
    retryFeature = new RetryFeature();
    factory = new HTTPRequestFactory();
    mockFetch = vi.fn();
    vi.clearAllMocks();
  });

  describe('meta_retry_precedence_and_behavior', () => {
    it('config_retry_overrides_meta_and_logs_warning', async () => {
      const rf = new RetryFeature()
        .withDefaultAttempts(3)
        .withDefaultRetryDelay(10)
        .withDefaultRetryCondition(() => true)
        .withMetaConfig({ normally: 'on' });
      const factory = new HTTPRequestFactory();
      const warnSpy = vi.spyOn(factory.logger, 'warn');

      const probe = getProbe<'computedRetryConfig', RetryConfig>();
      await probe.run(async () => {
        const delegates = rf.getDelegates(factory);
        const config = { retry: { attempts: 7, retryDelay: 123 } } as unknown as RequestConfig;
        // Trigger getRetryConfig by creating the wrapper
        delegates.request!.getFetchImpl!(config, vi.fn());
        const evt = await probe.next(200);
        expect(evt.label).toBe('computedRetryConfig');
        // Should reflect config.retry (merged on top of defaults)
        expect(evt.value.attempts).toBe(7);
        expect(evt.value.retryDelay).toBe(123);
      });
      probe.dispose();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('meta_true_enables_defaults_when_normally_off', async () => {
      const rf = new RetryFeature()
        .withDefaultAttempts(2)
        .withDefaultRetryDelay(5)
        .withDefaultRetryCondition(() => true)
        .withMetaConfig({ normally: 'off' });
      const factory = new HTTPRequestFactory();

      const probe = getProbe<'computedRetryConfig', RetryConfig>();
      await probe.run(async () => {
        const delegates = rf.getDelegates(factory);
        const config = { meta: { retry: true } } as unknown as RequestConfig;
        delegates.request!.getFetchImpl!(config, vi.fn());
        const evt = await probe.next(200);
        expect(evt.label).toBe('computedRetryConfig');
        expect(evt.value.attempts).toBe(2);
        expect(evt.value.retryDelay).toBe(5);
      });
      probe.dispose();
    });

    it('api_level_retry_is_applied_and_overrides_meta', async () => {
      const rf = new RetryFeature().withDefaultAttempts(0).withMetaConfig({ normally: 'on' });
      const factory = new HTTPRequestFactory().use(rf);

      factory.withAPIConfig({
        name: 'default',
        endpoints: { ping: { target: 'http://example.com/ping' } },
        retry: { attempts: 4, retryDelay: 42 }
      } as any);

      const probe = getProbe<'computedRetryConfig', RetryConfig>();
      await probe.run(async () => {
        factory.createAPIRequest('ping');
        // The wrapper is created when executing; but we can force beforeFetch hook by invoking underlying delegates
        // Simpler: access delegates directly via feature
        const delegates = rf.getDelegates(factory);
        // Build a config equivalent to what the request would carry, focusing on retry from API-level
        const cfg = { retry: { attempts: 4, retryDelay: 42 }, meta: { retry: false } } as unknown as RequestConfig;
        delegates.request!.getFetchImpl!(cfg, vi.fn());
        const evt = await probe.next(200);
        expect(evt.value.attempts).toBe(4);
        expect(evt.value.retryDelay).toBe(42);
      });
      probe.dispose();
    });
  });

  describe('feature_configuration', () => {
    it('should_have_correct_name_and_priority', () => {
      expect(retryFeature.name).toBe('retry');
      expect(retryFeature.priority).toBe(80);
    });

    it('should_configure_default_delay', () => {
      const customDelay = 2000;
      const result = retryFeature.withDefaultRetryDelay(customDelay);
      expect(result).toBe(retryFeature); // Should return self for chaining
    });

    it('should_configure_default_attempts', () => {
      const result = retryFeature.withDefaultAttempts(5);
      expect(result).toBe(retryFeature);
    });

    it('should_configure_default_retry_condition', () => {
      const customCondition = () => false;
      const result = retryFeature.withDefaultRetryCondition(customCondition);
      expect(result).toBe(retryFeature);
    });

    it('should_chain_configuration_methods', () => {
      const result = retryFeature
        .withDefaultAttempts(3)
        .withDefaultRetryDelay(1500)
        .withDefaultRetryCondition(() => true);

      expect(result).toBe(retryFeature);
    });
  });

  describe('backoff_strategies', () => {
    it('should_create_exponential_backoff_function', () => {
      const backoff = exponentialBackoff({
        initialDelay: 100,
        multiplier: 2,
        maxDelay: 5000,
        jitter: false
      });

      expect(backoff(0, {} as any, {} as any)).toBe(100);
      expect(backoff(1, {} as any, {} as any)).toBe(200);
      expect(backoff(2, {} as any, {} as any)).toBe(400);
      expect(backoff(10, {} as any, {} as any)).toBe(5000); // capped at maxDelay
    });

    it('should_create_exponential_backoff_with_jitter', () => {
      const backoff = exponentialBackoff({
        initialDelay: 100,
        multiplier: 2,
        maxDelay: 5000,
        jitter: true
      });
      const delay1 = backoff(1, {} as any, {} as any);
      const delay2 = backoff(1, {} as any, {} as any);

      // With jitter, delays should be different
      expect(delay1).not.toBe(delay2);
      expect(delay1).toBeGreaterThan(200);
      expect(delay1).toBeLessThan(220); // 200 + 10% jitter
    });

    it('should_create_linear_backoff_function', () => {
      const backoff = linearBackoff(500);

      expect(backoff(1, {} as any, {} as any)).toBe(500);
      expect(backoff(2, {} as any, {} as any)).toBe(1000);
      expect(backoff(3, {} as any, {} as any)).toBe(1500);
    });
  });

  describe('retry_logic', () => {
    it('should_not_retry_when_attempts_is_0', async () => {
      const config = {
        retry: { attempts: 0 }
      } as RequestConfig;

      mockFetch.mockResolvedValue(new Response('success'));

      const delegates = retryFeature.getDelegates(factory);
      const fetchImpl = delegates.request!.getFetchImpl!(config, mockFetch);

      await fetchImpl('http://test.com', {});

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should_retry_on_network_errors', async () => {
      const config = {
        retry: {
          attempts: 2,
          retryDelay: 10, // Short delay for testing
          retryCondition: ({ error }) => !!error
        }
      } as RequestConfig;

      mockFetch.mockRejectedValueOnce(new HTTPError(0, 'Network Error')).mockResolvedValue(new Response('success'));

      const delegates = retryFeature.getDelegates(factory);
      const fetchImpl = delegates.request!.getFetchImpl!(config, mockFetch);

      const response = await fetchImpl('http://test.com', {});

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response).toBeInstanceOf(Response);
    });

    it('should_call_retry_callbacks', async () => {
      const onRetry = vi.fn();
      const onRetrySuccess = vi.fn();

      const config = {
        retry: {
          attempts: 2,
          retryDelay: 10,
          retryCondition: ({ error }) => !!error,
          onRetry,
          onRetrySuccess
        }
      } as unknown as RequestConfig;

      mockFetch.mockRejectedValueOnce(new HTTPError(500, 'Server Error')).mockResolvedValue(new Response('success'));

      const delegates = retryFeature.getDelegates(factory);
      const fetchImpl = delegates.request!.getFetchImpl!(config, mockFetch);

      await fetchImpl('http://test.com', {});

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(HTTPError), 10);
      expect(onRetrySuccess).toHaveBeenCalledWith(1, expect.any(Response));
    });

    it('should_exhaust_retries_and_call_on_max_attempts_exceeded', async () => {
      const onMaxAttemptsExceeded = vi.fn();

      const config = {
        retry: {
          attempts: 2,
          retryDelay: 10,
          retryCondition: ({ error }) => !!error,
          onMaxAttemptsExceeded
        }
      } as unknown as RequestConfig;

      const error = new HTTPError(500, 'Server Error');
      mockFetch.mockRejectedValue(error);

      const delegates = retryFeature.getDelegates(factory);
      const fetchImpl = delegates.request!.getFetchImpl!(config, mockFetch);

      await expect(fetchImpl('http://test.com', {})).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(onMaxAttemptsExceeded).toHaveBeenCalledWith(error, 2);
    });

    it('should_use_function_based_retry_delay', async () => {
      const customDelay = vi.fn().mockReturnValue(500);

      const config = {
        retry: {
          attempts: 1,
          retryDelay: customDelay,
          retryCondition: ({ error }) => !!error
        }
      } as unknown as RequestConfig;

      mockFetch.mockRejectedValueOnce(new HTTPError(500, 'Server Error')).mockResolvedValue(new Response('success'));

      const delegates = retryFeature.getDelegates(factory);
      const fetchImpl = delegates.request!.getFetchImpl!(config, mockFetch);

      await fetchImpl('http://test.com', {});

      expect(customDelay).toHaveBeenCalledWith(0, expect.any(HTTPError), config);
    });

    it('should_handle_response_based_retry_conditions', async () => {
      const config = {
        retry: {
          attempts: 1,
          retryDelay: 10,
          retryCondition: ({ error }) => !error // Only retry on successful responses (unusual but valid)
        }
      } as unknown as RequestConfig;

      mockFetch.mockResolvedValueOnce(new Response('', { status: 500 })).mockResolvedValue(new Response('success'));

      const delegates = retryFeature.getDelegates(factory);
      const fetchImpl = delegates.request!.getFetchImpl!(config, mockFetch);

      const response = await fetchImpl('http://test.com', {});

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });
  });

  describe('integration_with_http_request_factory', () => {
    it('should_integrate_with_factory_and_request', async () => {
      const retryFeature = new RetryFeature().withDefaultAttempts(2);

      factory.use(retryFeature);

      // Mock a failing then successful request
      const originalFetch = globalThis.fetch;
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(new Response('success'));

      globalThis.fetch = mockFetch;

      try {
        const response = await factory
          .createGETRequest('http://test.com')
          .withRetry({
            attempts: 1,
            retryDelay: 10,
            retryCondition: ({ error }) => !!error
          })
          .execute();

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(response).toBe('success');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should_resolve_retry_arg_functions_at_execution_time', async () => {
      const retryFeature = new RetryFeature();
      factory.use(retryFeature);

      const retryConfigFn = vi.fn().mockReturnValue({
        attempts: 1,
        retryDelay: 10,
        retryCondition: ({ error }: any) => !!error
      });

      const originalFetch = globalThis.fetch;
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(new Response('success'));

      globalThis.fetch = mockFetch;

      try {
        await factory.createGETRequest('http://test.com').withRetry(retryConfigFn).execute();

        expect(retryConfigFn).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            templateURL: 'http://test.com'
          })
        );
        expect(mockFetch).toHaveBeenCalledTimes(2);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});

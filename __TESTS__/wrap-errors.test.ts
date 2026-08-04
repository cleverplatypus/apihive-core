import { describe, it, expect, expectTypeOf } from 'vitest';
import HTTPError from '../src/HTTPError.ts';
import { HTTPRequestFactory } from '../src/index.ts';
import type { WrappedResponse } from '../src/types.ts';

describe('wrap_errors_behavior', () => {
  it('infers API response wrapping from the factory mode', () => {
    type APIResponse = { Result: unknown };
    const api = {
      name: 'default',
      endpoints: { summary: { target: '/summary' } }
    };

    const response = new HTTPRequestFactory()
      .withAPIConfig(api)
      .createAPIRequest('summary')
      .execute<APIResponse>();
    const wrappedResponse = new HTTPRequestFactory()
      .withAPIConfig(api)
      .withWrappedResponseError()
      .createAPIRequest('summary')
      .execute<APIResponse>();

    expectTypeOf(response).toEqualTypeOf<Promise<APIResponse>>();
    expectTypeOf(wrappedResponse).toEqualTypeOf<Promise<WrappedResponse<APIResponse>>>();
  });

  it('wrap_successful_request_returns_response_property', async () => {
    const factory = new HTTPRequestFactory()
        .withWrappedResponseError();

    const {response, error} = await factory
      .createGETRequest('https://httpbin.org/json')
      .execute();

    expect(response).toBeDefined();
    expect(error).not.toBeDefined();
    expect(typeof response).toBe('object');
  });

  it('wrap_http_error_returns_error_property', async () => {
    const factory = new HTTPRequestFactory()
        .withWrappedResponseError();

    const {response, error} = await factory
      .createGETRequest('https://httpbin.org/status/404')
      .execute();

    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(HTTPError);
    expect(error).toHaveProperty('code', 404);
  });

  it('wrap_abort_error_returns_error_code_minus_one_and_calls_error_interceptor', async () => {
    const factory = new HTTPRequestFactory()
        .withWrappedResponseError();

    const calls: boolean[] = [];

    const {response, error} = await factory
      .withErrorInterceptors((e: HTTPError) => {
        calls.push(e.code === -1);
        // do not handle; continue normal flow
        return false;
      })
      .createGETRequest('https://httpbin.org/delay/3')
      .withTimeout(50)
      .execute();

    expect(Array.isArray(calls)).toBeTruthy();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every(Boolean)).toBeTruthy();

    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(HTTPError);
    expect(error).toHaveProperty('code', -1);
  });

  it('wrap_request_interceptor_early_return', async () => {
    const factory = new HTTPRequestFactory()
        .withWrappedResponseError();

    const {response, error} = await factory
      .withRequestInterceptors(async () => {
        return { local: true, via: 'request-interceptor' } as any;
      })
      .createGETRequest('https://httpbin.org/anything')
      .execute();

    expect(response).toBeDefined();
    expect(error).not.toBeDefined();
    expect(response).toHaveProperty('local', true);
    expect(response).toHaveProperty('via', 'request-interceptor');
  });

  it('wrap_response_interceptor_early_return', async () => {
    const factory = new HTTPRequestFactory()
        .withWrappedResponseError();

    const {response, error} = await factory
      .createGETRequest('https://httpbin.org/anything')
      .withResponseInterceptors(async ({response}) => {
        const data = await response.json();
        return { wrapped: true, echo: data?.json ?? data } as any;
      })
      .execute();

    expect(response).toBeDefined();
    expect(error).not.toBeDefined();
    expect(response).toHaveProperty('wrapped', true);
  });
});

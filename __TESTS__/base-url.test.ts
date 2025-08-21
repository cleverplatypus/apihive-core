import { describe, expect, it } from 'vitest';
import { HTTPRequestFactory, RequestConfig, RequestInterceptorControls } from '../src/index.ts';

// Helper: finalize URL via request interceptor and return it as response
const returnURL = async ({controls}) => {
  const final = controls.getProvisionalURL();
  return final; // short-circuit request; execute() returns this value
};

describe('base_url_resolution', () => {
  it('absolute_input_url_is_used_even_with_base', async () => {
    const factory = new HTTPRequestFactory()
        .withBaseURL('https://httpbin.org');

    const result = await factory
      .createGETRequest('https://jsonplaceholder.typicode.com/posts/1')
      .withRequestInterceptors(returnURL)
      .execute();

    expect(result).toBe('https://jsonplaceholder.typicode.com/posts/1');
  });

  it('no_baseURL_keeps_relative_url_as_is', async () => {
    const factory = new HTTPRequestFactory();

    const result = await factory
      .createGETRequest('users/list')
      .withRequestInterceptors(returnURL)
      .execute();

    expect(result).toBe('/users/list');
  });

  it('absolute_base_with_relative_url_concatenates_using_url_resolution', async () => {
    const factory = new HTTPRequestFactory().withBaseURL('https://jsonplaceholder.typicode.com');

    const result = await factory
      .createGETRequest('users')
      .withRequestInterceptors(returnURL)
      .execute();

    expect(result).toBe('https://jsonplaceholder.typicode.com/users');
  });

  it('root_relative_base_with_relative_url_concatenates_cleanly', async () => {
    const factory = new HTTPRequestFactory().withBaseURL('/api/v1/');

    const result = await factory
      .createGETRequest('users')
      .withRequestInterceptors(returnURL)
      .execute();

    expect(result).toBe('/api/v1/users');
  });

  it('both_relative_concatenate_with_single_slash', async () => {
    const factory = new HTTPRequestFactory().withBaseURL('api/v1/');

    const result = await factory
      .createGETRequest('/users')
      .withRequestInterceptors(returnURL)
      .execute();

    expect(result).toBe('/api/v1/users');
  });

  it('absolute_input_url_with_no_base_is_kept', async () => {
    const factory = new HTTPRequestFactory()
        .withBaseURL('/api');

    const result = await factory
      .createGETRequest('https://httpbin.org/get')
      .withRequestInterceptors(returnURL)
      .execute();

    expect(result).toBe('https://httpbin.org/get');
  });
});

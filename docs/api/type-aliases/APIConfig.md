[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / APIConfig

# Type Alias: APIConfig\<TApiConfig\>

> **APIConfig**\<`TApiConfig`\> = `object`

Defined in: [types.ts:354](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L354)

Configuration for an API to be added with [HTTPRequestFactory.withAPIConfig](../classes/HTTPRequestFactory.md#withapiconfig)

## Examples

```ts
// Function-based API definition for type-safe code generation
interface GitHubAPI {
  endpoints: {
    getUser: (params: { pathParams: { username: string } }) => Promise<User>;
    createRepo: (params: {
      pathParams: { owner: string };
      bodyParams: { name: string; description?: string };
    }) => Promise<Repository>;
  };
  meta?: { requiresAuth: boolean };
}
const config: APIConfig<GitHubAPI> = {
  name: 'github',
  endpoints: {
    getUser: { target: '/users/{username}' },
    createRepo: { target: '/repos', method: 'POST' }
  }
};
```

```ts
// Adapter-driven API (no endpoints allowed)
interface OpenAPIConfig {
  meta: { openAPI: { spec: string } };
  endpoints?: never;
}
const config: APIConfig<OpenAPIConfig> = { ... }; // endpoints property forbidden
```

```ts
// Unconstrained API (default)
const config: APIConfig = {
  name: 'myapi',
  endpoints: {
    anyEndpoint: { target: '/any/path' } // Any endpoint name allowed
  }
};
```

## Type Parameters

### TApiConfig

`TApiConfig` *extends* [`BaseAPIInterface`](BaseAPIInterface.md) = [`DefaultAPIConfig`](DefaultAPIConfig.md)

Configuration interface that constrains meta and endpoints.
                      Must extend BaseAPIInterface for function-based endpoint definitions.

## Properties

### baseURL?

> `optional` **baseURL**: `string` \| (`endpoint`) => `string`

Defined in: [types.ts:359](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L359)

The base to be used as base URL for this API. If omitted, the value provided in each endpoint's `target` will be used.

***

### endpoints

> **endpoints**: `TApiConfig` *extends* `object` ? `never` : `TApiConfig` *extends* `object` ? `{ [P in Extract<K, string>]: Endpoint }` : `object`

Defined in: [types.ts:408](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L408)

A map of [Endpoint](Endpoint.md) for the API.
Can be constrained or forbidden by the TApiConfig generic parameter.

#### Examples

```ts
// For adapter-driven APIs, endpoints can be forbidden:
// endpoints?: never (prevents manual endpoint configuration)
```

```ts
// For function-based APIs, only specific endpoint names are allowed:
// endpoints: { getUser: Endpoint; getUserRepos: Endpoint } (constrains keys)
```

***

### errorInterceptors?

> `optional` **errorInterceptors**: [`ErrorInterceptor`](ErrorInterceptor.md) \| [`ErrorInterceptor`](ErrorInterceptor.md)[]

Defined in: [types.ts:394](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L394)

***

### headers?

> `optional` **headers**: `Record`\<`string`, [`HeaderValue`](HeaderValue.md)\>

Defined in: [types.ts:377](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L377)

Any headers that should be applied to each request.
Notice that if a header value is  [DynamicHeaderValue](DynamicHeaderValue.md),
the function will be called with the current request as argument,
so conditional logic can be applied to generate the value.

***

### meta?

> `optional` **meta**: `TApiConfig` *extends* `object` ? `TMeta` : `any`

Defined in: [types.ts:370](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L370)

Any metadata that should be attached to the API for later reference.
The structure is constrained by the TApiConfig generic parameter.

***

### name

> **name**: `string` \| `"default"`

Defined in: [types.ts:365](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L365)

The name of the API to be referenced in [HTTPRequestFactory.createAPIRequest](../classes/HTTPRequestFactory.md#createapirequest)
If the name is 'default' it will be used as the default API when calling [HTTPRequestFactory.createAPIRequest](../classes/HTTPRequestFactory.md#createapirequest)
with one argument (the name of the endpoint).

***

### progressHandlers?

> `optional` **progressHandlers**: [`ProgressHandlerConfig`](ProgressHandlerConfig.md) \| [`ProgressHandlerConfig`](ProgressHandlerConfig.md)[]

Defined in: [types.ts:416](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L416)

***

### requestInterceptors?

> `optional` **requestInterceptors**: [`RequestInterceptor`](RequestInterceptor.md) \| [`RequestInterceptor`](RequestInterceptor.md)[]

Defined in: [types.ts:393](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L393)

***

### responseBodyTransformers?

> `optional` **responseBodyTransformers**: [`ResponseBodyTransformer`](ResponseBodyTransformer.md) \| [`ResponseBodyTransformer`](ResponseBodyTransformer.md)[]

Defined in: [types.ts:382](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L382)

An optional [ResponseBodyTransformer](ResponseBodyTransformer.md) function to be applied to all of
the API's responses.

***

### responseInterceptors?

> `optional` **responseInterceptors**: [`ResponseInterceptor`](ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](ResponseInterceptorWithOptions.md) \| ([`ResponseInterceptor`](ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](ResponseInterceptorWithOptions.md))[]

Defined in: [types.ts:389](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L389)

Optional response interceptors applied to all requests of this API.
Interceptors can be functions or registrations that control transformer behavior.

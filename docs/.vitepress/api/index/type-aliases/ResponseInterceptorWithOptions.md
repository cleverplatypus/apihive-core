[**@apihive/core**](../../README.md)

***

[@apihive/core](../../modules.md) / [index](../README.md) / ResponseInterceptorWithOptions

# Type Alias: ResponseInterceptorWithOptions

> **ResponseInterceptorWithOptions** = `object`

Defined in: [types.ts:162](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L162)

## Properties

### interceptor

> **interceptor**: [`ResponseInterceptor`](ResponseInterceptor.md)

Defined in: [types.ts:163](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L163)

***

### skipTransformersOnReturn?

> `optional` **skipTransformersOnReturn**: `boolean`

Defined in: [types.ts:169](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L169)

If true, any non-undefined value returned by this interceptor
will be returned as-is, without passing through responseBodyTransformers.
Defaults to false (transformers are applied).

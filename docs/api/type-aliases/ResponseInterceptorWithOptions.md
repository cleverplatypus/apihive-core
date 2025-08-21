[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / ResponseInterceptorWithOptions

# Type Alias: ResponseInterceptorWithOptions

> **ResponseInterceptorWithOptions** = `object`

Defined in: [types.ts:252](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L252)

## Properties

### interceptor

> **interceptor**: [`ResponseInterceptor`](ResponseInterceptor.md)

Defined in: [types.ts:253](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L253)

***

### skipTransformersOnReturn?

> `optional` **skipTransformersOnReturn**: `boolean`

Defined in: [types.ts:259](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L259)

If true, any non-undefined value returned by this interceptor
will be returned as-is, without passing through responseBodyTransformers.
Defaults to false (transformers are applied).

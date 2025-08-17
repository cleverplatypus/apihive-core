[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / ResponseInterceptorWithOptions

# Type Alias: ResponseInterceptorWithOptions

> **ResponseInterceptorWithOptions** = `object`

Defined in: [types.ts:182](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L182)

## Properties

### interceptor

> **interceptor**: [`ResponseInterceptor`](ResponseInterceptor.md)

Defined in: [types.ts:183](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L183)

***

### skipTransformersOnReturn?

> `optional` **skipTransformersOnReturn**: `boolean`

Defined in: [types.ts:189](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L189)

If true, any non-undefined value returned by this interceptor
will be returned as-is, without passing through responseBodyTransformers.
Defaults to false (transformers are applied).

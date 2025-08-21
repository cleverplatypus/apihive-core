[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / AdapterPriority

# Interface: AdapterPriority

Defined in: [adapter-types.ts:8](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L8)

Priority configuration for adapter interceptors.
Lower numbers execute earlier in the chain.

## Properties

### errorInterceptor?

> `optional` **errorInterceptor**: `number`

Defined in: [adapter-types.ts:14](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L14)

Priority for error interceptors (default: 500)

***

### requestInterceptor?

> `optional` **requestInterceptor**: `number`

Defined in: [adapter-types.ts:10](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L10)

Priority for request interceptors (default: 500)

***

### responseInterceptor?

> `optional` **responseInterceptor**: `number`

Defined in: [adapter-types.ts:12](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L12)

Priority for response interceptors (default: 500)

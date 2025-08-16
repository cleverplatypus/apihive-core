[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / AdapterPriority

# Interface: AdapterPriority

Defined in: [adapter-types.ts:8](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L8)

Priority configuration for adapter interceptors.
Lower numbers execute earlier in the chain.

## Properties

### errorInterceptor?

> `optional` **errorInterceptor**: `number`

Defined in: [adapter-types.ts:14](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L14)

Priority for error interceptors (default: 500)

***

### requestInterceptor?

> `optional` **requestInterceptor**: `number`

Defined in: [adapter-types.ts:10](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L10)

Priority for request interceptors (default: 500)

***

### responseInterceptor?

> `optional` **responseInterceptor**: `number`

Defined in: [adapter-types.ts:12](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L12)

Priority for response interceptors (default: 500)

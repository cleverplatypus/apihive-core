[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / RequestConfig

# Type Alias: RequestConfig

> **RequestConfig** = `object`

Defined in: [types.ts:196](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L196)

Internal representation of a [HTTPRequest](../classes/HTTPRequest.md)'s configuration

## Properties

### acceptedMIMETypes

> **acceptedMIMETypes**: `string`[]

Defined in: [types.ts:215](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L215)

***

### body

> **body**: `any`

Defined in: [types.ts:203](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L203)

***

### corsMode

> **corsMode**: `RequestMode`

Defined in: [types.ts:216](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L216)

***

### credentials

> **credentials**: `RequestCredentials`

Defined in: [types.ts:213](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L213)

***

### errorInterceptors

> **errorInterceptors**: [`ErrorInterceptor`](ErrorInterceptor.md)[]

Defined in: [types.ts:220](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L220)

***

### expectedResponseFormat

> **expectedResponseFormat**: [`ExpectedResponseFormat`](ExpectedResponseFormat.md)

Defined in: [types.ts:214](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L214)

***

### finalURL?

> `readonly` `optional` **finalURL**: `string`

Defined in: [types.ts:200](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L200)

***

### headers

> **headers**: `Record`\<`string`, [`HeaderValue`](HeaderValue.md)\>

Defined in: [types.ts:202](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L202)

***

### ignoreResponseBody

> **ignoreResponseBody**: `boolean`

Defined in: [types.ts:212](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L212)

***

### jsonMimeTypes

> **jsonMimeTypes**: `string`[]

Defined in: [types.ts:204](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L204)

***

### logLevel

> **logLevel**: `LogLevel`

Defined in: [types.ts:208](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L208)

***

### meta

> **meta**: `Record`\<`string`, `any`\>

Defined in: [types.ts:209](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L209)

***

### method

> **method**: [`HTTPMethod`](HTTPMethod.md)

Defined in: [types.ts:207](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L207)

***

### progressHandlers?

> `optional` **progressHandlers**: [`ProgressHandlerConfig`](ProgressHandlerConfig.md)[]

Defined in: [types.ts:221](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L221)

***

### queryParams

> **queryParams**: `Record`\<`string`, [`QueryParameterValue`](QueryParameterValue.md)\>

Defined in: [types.ts:210](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L210)

***

### requestInterceptors

> **requestInterceptors**: [`RequestInterceptor`](RequestInterceptor.md)[]

Defined in: [types.ts:218](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L218)

***

### responseBodyTransformers

> **responseBodyTransformers**: [`ResponseBodyTransformer`](ResponseBodyTransformer.md)[]

Defined in: [types.ts:211](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L211)

***

### responseInterceptors

> **responseInterceptors**: ([`ResponseInterceptor`](ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](ResponseInterceptorWithOptions.md))[]

Defined in: [types.ts:219](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L219)

***

### templateURL?

> `readonly` `optional` **templateURL**: `string`

Defined in: [types.ts:201](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L201)

***

### templateURLHistory

> **templateURLHistory**: `string`[]

Defined in: [types.ts:198](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L198)

***

### textMimeTypes

> **textMimeTypes**: `string`[]

Defined in: [types.ts:205](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L205)

***

### timeout

> **timeout**: `number`

Defined in: [types.ts:206](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L206)

***

### urlParams

> **urlParams**: [`URLParams`](URLParams.md)

Defined in: [types.ts:217](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L217)

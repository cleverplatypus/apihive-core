[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / RequestConfig

# Type Alias: RequestConfig

> **RequestConfig** = `object`

Defined in: [types.ts:176](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L176)

Internal representation of a [HTTPRequest](../classes/HTTPRequest.md)'s configuration

## Properties

### acceptedMIMETypes

> **acceptedMIMETypes**: `string`[]

Defined in: [types.ts:195](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L195)

***

### body

> **body**: `any`

Defined in: [types.ts:183](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L183)

***

### corsMode

> **corsMode**: `RequestMode`

Defined in: [types.ts:196](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L196)

***

### credentials

> **credentials**: `RequestCredentials`

Defined in: [types.ts:193](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L193)

***

### errorInterceptors

> **errorInterceptors**: [`ErrorInterceptor`](ErrorInterceptor.md)[]

Defined in: [types.ts:200](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L200)

***

### expectedResponseFormat

> **expectedResponseFormat**: [`ExpectedResponseFormat`](ExpectedResponseFormat.md)

Defined in: [types.ts:194](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L194)

***

### finalURL?

> `readonly` `optional` **finalURL**: `string`

Defined in: [types.ts:180](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L180)

***

### headers

> **headers**: `Record`\<`string`, [`HeaderValue`](HeaderValue.md)\>

Defined in: [types.ts:182](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L182)

***

### ignoreResponseBody

> **ignoreResponseBody**: `boolean`

Defined in: [types.ts:192](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L192)

***

### jsonMimeTypes

> **jsonMimeTypes**: `string`[]

Defined in: [types.ts:184](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L184)

***

### logLevel

> **logLevel**: `LogLevel`

Defined in: [types.ts:188](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L188)

***

### meta

> **meta**: `Record`\<`string`, `any`\>

Defined in: [types.ts:189](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L189)

***

### method

> **method**: [`HTTPMethod`](HTTPMethod.md)

Defined in: [types.ts:187](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L187)

***

### progressHandlers?

> `optional` **progressHandlers**: [`ProgressHandlerConfig`](ProgressHandlerConfig.md)[]

Defined in: [types.ts:201](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L201)

***

### queryParams

> **queryParams**: `Record`\<`string`, [`QueryParameterValue`](QueryParameterValue.md)\>

Defined in: [types.ts:190](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L190)

***

### requestInterceptors

> **requestInterceptors**: [`RequestInterceptor`](RequestInterceptor.md)[]

Defined in: [types.ts:198](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L198)

***

### responseBodyTransformers

> **responseBodyTransformers**: [`ResponseBodyTransformer`](ResponseBodyTransformer.md)[]

Defined in: [types.ts:191](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L191)

***

### responseInterceptors

> **responseInterceptors**: ([`ResponseInterceptor`](ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](ResponseInterceptorWithOptions.md))[]

Defined in: [types.ts:199](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L199)

***

### templateURL?

> `readonly` `optional` **templateURL**: `string`

Defined in: [types.ts:181](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L181)

***

### templateURLHistory

> **templateURLHistory**: `string`[]

Defined in: [types.ts:178](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L178)

***

### textMimeTypes

> **textMimeTypes**: `string`[]

Defined in: [types.ts:185](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L185)

***

### timeout

> **timeout**: `number`

Defined in: [types.ts:186](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L186)

***

### urlParams

> **urlParams**: [`URLParams`](URLParams.md)

Defined in: [types.ts:197](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L197)

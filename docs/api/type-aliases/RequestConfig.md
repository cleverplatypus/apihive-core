[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / RequestConfig

# Type Alias: RequestConfig

> **RequestConfig** = `object`

Defined in: [types.ts:278](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L278)

Internal representation of a [HTTPRequest](../classes/HTTPRequest.md)'s configuration

## Properties

### acceptedMIMETypes

> **acceptedMIMETypes**: `string`[]

Defined in: [types.ts:297](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L297)

***

### body

> **body**: `any`

Defined in: [types.ts:285](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L285)

***

### corsMode

> **corsMode**: `RequestMode`

Defined in: [types.ts:298](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L298)

***

### credentials

> **credentials**: `RequestCredentials`

Defined in: [types.ts:295](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L295)

***

### errorInterceptors

> **errorInterceptors**: [`ErrorInterceptor`](ErrorInterceptor.md)[]

Defined in: [types.ts:302](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L302)

***

### expectedResponseFormat

> **expectedResponseFormat**: [`ExpectedResponseFormat`](ExpectedResponseFormat.md)

Defined in: [types.ts:296](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L296)

***

### finalURL?

> `readonly` `optional` **finalURL**: `string`

Defined in: [types.ts:282](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L282)

***

### headers

> **headers**: `Record`\<`string`, [`HeaderValue`](HeaderValue.md)\>

Defined in: [types.ts:284](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L284)

***

### ignoreResponseBody

> **ignoreResponseBody**: `boolean`

Defined in: [types.ts:294](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L294)

***

### jsonMimeTypes

> **jsonMimeTypes**: `string`[]

Defined in: [types.ts:286](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L286)

***

### logLevel

> **logLevel**: `LogLevel`

Defined in: [types.ts:290](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L290)

***

### meta

> **meta**: `Record`\<`string`, `any`\>

Defined in: [types.ts:291](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L291)

***

### method

> **method**: [`HTTPMethod`](HTTPMethod.md)

Defined in: [types.ts:289](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L289)

***

### progressHandlers?

> `optional` **progressHandlers**: [`ProgressHandlerConfig`](ProgressHandlerConfig.md)[]

Defined in: [types.ts:303](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L303)

***

### queryParams

> **queryParams**: `Record`\<`string`, [`QueryParameterValue`](QueryParameterValue.md)\>

Defined in: [types.ts:292](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L292)

***

### requestInterceptors

> **requestInterceptors**: [`RequestInterceptor`](RequestInterceptor.md)[]

Defined in: [types.ts:300](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L300)

***

### responseBodyTransformers

> **responseBodyTransformers**: [`ResponseBodyTransformer`](ResponseBodyTransformer.md)[]

Defined in: [types.ts:293](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L293)

***

### responseInterceptors

> **responseInterceptors**: ([`ResponseInterceptor`](ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](ResponseInterceptorWithOptions.md))[]

Defined in: [types.ts:301](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L301)

***

### templateURL?

> `readonly` `optional` **templateURL**: `string`

Defined in: [types.ts:283](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L283)

***

### templateURLHistory

> **templateURLHistory**: `string`[]

Defined in: [types.ts:280](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L280)

***

### textMimeTypes

> **textMimeTypes**: `string`[]

Defined in: [types.ts:287](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L287)

***

### timeout

> **timeout**: `number`

Defined in: [types.ts:288](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L288)

***

### urlParams

> **urlParams**: [`URLParams`](URLParams.md)

Defined in: [types.ts:299](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L299)

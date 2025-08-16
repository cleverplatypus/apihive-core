[**@apihive/core**](../../README.md)

***

[@apihive/core](../../modules.md) / [HTTPRequest](../README.md) / HTTPRequest

# Class: HTTPRequest

Defined in: [HTTPRequest.ts:41](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L41)

HTTP Request. This class shouldn't be instanciated directly.
Use HTTPRequestFactory createXXXRequest() instead

## Constructors

### Constructor

> **new HTTPRequest**(`__namedParameters`): `HTTPRequest`

Defined in: [HTTPRequest.ts:115](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L115)

#### Parameters

##### \_\_namedParameters

`RequestConstructorArgs`

#### Returns

`HTTPRequest`

## Accessors

### abortController

#### Get Signature

> **get** **abortController**(): `AbortController`

Defined in: [HTTPRequest.ts:62](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L62)

##### Returns

`AbortController`

## Methods

### blank()

> **blank**(): `HTTPRequest`

Defined in: [HTTPRequest.ts:593](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L593)

Clears the config builders array and returns the instance.
Useful in cases where you want to create a new request that doesn't inherit
from API/factory settings that might have headers or other unwanted configuration

#### Returns

`HTTPRequest`

the updated request

***

### execute()

> **execute**(): `Promise`\<`any`\>

Defined in: [HTTPRequest.ts:260](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L260)

Executes the fetch request and returns a Promise that resolves with the parsed result.

#### Returns

`Promise`\<`any`\>

A Promise that resolves with the result of the request.

***

### getHash()

> **getHash**(): `string`

Defined in: [HTTPRequest.ts:947](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L947)

Generates a hash of the request configuration.
The hash is deterministic and includes method, URL, relevant headers,
query parameters, and body content to ensure consistent identification.
This key can be used for request caching purposes.

#### Returns

`string`

A unique hash-based identifier for this request

#### Remark

This is an optional feature (request-hash) that must be enabled on the factory.

***

### getReadOnlyConfig()

> **getReadOnlyConfig**(): [`RequestConfig`](../../index/type-aliases/RequestConfig.md)

Defined in: [HTTPRequest.ts:397](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L397)

Retrieves a read-only copy of configuration with lazy evaluation.
Function-based values (body, headers) are only evaluated when accessed.

#### Returns

[`RequestConfig`](../../index/type-aliases/RequestConfig.md)

A read-only configuration object with lazy evaluation.

***

### ignoreResponseBody()

> **ignoreResponseBody**(): `HTTPRequest`

Defined in: [HTTPRequest.ts:766](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L766)

When called, the request will not try to parse the response

#### Returns

`HTTPRequest`

The updated request instance.

***

### withAbortListener()

> **withAbortListener**(`handler`): `HTTPRequest`

Defined in: [HTTPRequest.ts:605](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L605)

Adds an abort handler to the request.

#### Parameters

##### handler

(`event`) => `void`

The abort handler to add.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withAccept()

> **withAccept**(...`mimeTypes`): `HTTPRequest`

Defined in: [HTTPRequest.ts:621](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L621)

Sets the accepted MIME types for the request.

Short hand for `withHeader('Accept', 'application/json')`

#### Parameters

##### mimeTypes

...`string`[]

An array of MIME types to accept.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withAcceptAny()

> **withAcceptAny**(): `HTTPRequest`

Defined in: [HTTPRequest.ts:755](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L755)

Short-hand for setting the accepted MIME types to ['*/*'] which means the API accepts any MIME type.

#### Returns

`HTTPRequest`

The current object instance.

***

### withBeforeFetchHook()

> **withBeforeFetchHook**(`hook`): `HTTPRequest`

Defined in: [HTTPRequest.ts:977](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L977)

Adds a [BeforeFetchHook](../../index/type-aliases/BeforeFetchHook.md) for the request.

#### Parameters

##### hook

[`BeforeFetchHook`](../../index/type-aliases/BeforeFetchHook.md)

The before fetch hook to apply.

#### Returns

`HTTPRequest`

The updated request object.

***

### withCredentialsPolicy()

> **withCredentialsPolicy**(`config`): `HTTPRequest`

Defined in: [HTTPRequest.ts:580](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L580)

Sets the credentials policy for the HTTP request.

#### Parameters

##### config

`RequestCredentials`

The configuration for the credentials.

#### Returns

`HTTPRequest`

The updated HTTP request instance.

***

### withErrorInterceptors()

> **withErrorInterceptors**(...`interceptors`): `HTTPRequest`

Defined in: [HTTPRequest.ts:679](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L679)

Adds error interceptors to the request configuration.

Error interceptors are executed in the order they are added.
- If an error interceptor returns a rejected promise, the request will fail.
- If an error interceptor returns a resolved promise, the promise's result will be used as the response.
- If the interceptor returns `undefined`, the request will continue to the next interceptor, if present, or to the regular request handling

See [Error Interceptors](https://cleverplatypus.github.io/apihive-core/guide/error-interceptors.html)

#### Parameters

##### interceptors

...[`ErrorInterceptor`](../../index/type-aliases/ErrorInterceptor.md)[]

The error interceptors to add.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withFormDataBody()

> **withFormDataBody**(`composerCallBack`): `HTTPRequest`

Defined in: [HTTPRequest.ts:736](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L736)

Set the request body to a FormData object and allows customizing the form data before sending the request.

#### Parameters

##### composerCallBack

(`formData`) => `void`

The callback function that customizes the FormData object

#### Returns

`HTTPRequest`

The updated request instance.

***

### withFormEncodedBody()

> **withFormEncodedBody**(`data`): `HTTPRequest`

Defined in: [HTTPRequest.ts:657](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L657)

Sets the request body to a form encoded string.

#### Parameters

##### data

`string`

The form encoded string to set as the request body.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withHeader()

> **withHeader**(`name`, `value`): `HTTPRequest`

Defined in: [HTTPRequest.ts:888](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L888)

Sets a single header for the request.
Header values can be literal values or a function that receives
the request config as an argument and returns a value.

If the value is undefined, the corresponding header will be removed if present

#### Parameters

##### name

`string`

header name

##### value

[`HeaderValue`](../../index/type-aliases/HeaderValue.md)

the value for the header, omit this parameter to remove the header

#### Returns

`HTTPRequest`

The updated request instance.

***

### withHeaders()

> **withHeaders**(`headers`): `HTTPRequest`

Defined in: [HTTPRequest.ts:868](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L868)

Sets the request headers for the request.
Header values can be literal values or a function that receives
the request config as an argument and returns a value.

If the value is undefined, the corresponding header will be removed if present

#### Parameters

##### headers

`Record`\<`string`, [`HeaderValue`](../../index/type-aliases/HeaderValue.md)\>

name-value pairs to set as headers

#### Returns

`HTTPRequest`

The updated request instance.

***

### withJSONBody()

> **withJSONBody**(`json`): `HTTPRequest`

Defined in: [HTTPRequest.ts:708](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L708)

Set the request body as a JSON object or string.

#### Parameters

##### json

`any`

The JSON object or string to set as the request body.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withJSONMimeTypes()

> **withJSONMimeTypes**(...`mimeTypes`): `HTTPRequest`

Defined in: [HTTPRequest.ts:825](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L825)

Sets the MIME types that are considered JSON on top of the default
patterns.

#### Parameters

##### mimeTypes

...`string`[]

The MIME types to add.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withLogger()

> **withLogger**(`logger`): `HTTPRequest`

Defined in: [HTTPRequest.ts:568](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L568)

Sets an LoggerFacade compatible logger for the request.
Normally the logger will be set by the factory.

#### Parameters

##### logger

`LoggerFacade`

The logger to be set.

#### Returns

`HTTPRequest`

The updated HTTP request instance.

***

### withLogLevel()

> **withLogLevel**(`level`): `HTTPRequest`

Defined in: [HTTPRequest.ts:852](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L852)

#### Parameters

##### level

`LogLevel`

the log level to apply for this request
Overrides the default log level.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withMeta()

> **withMeta**(`param1`, `param2?`): `HTTPRequest`

Defined in: [HTTPRequest.ts:551](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L551)

Configures the request with metadata that can be inspected later.

#### Parameters

##### param1

The key or object containing the key-value pairs to update the meta property.

`string` | `Record`\<`string`, `any`\>

##### param2?

`any`

The value to associate with the key when param1 is a string.

#### Returns

`HTTPRequest`

The current object instance for method chaining.

***

### withNoCors()

> **withNoCors**(): `HTTPRequest`

Defined in: [HTTPRequest.ts:812](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L812)

Sets the CORS mode to 'no-cors' and returns the current object.

#### Returns

`HTTPRequest`

The current object.

***

### withProgressHandlers()

> **withProgressHandlers**(...`handlers`): `HTTPRequest`

Defined in: [HTTPRequest.ts:964](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L964)

Adds progress handlers for the request.

See [Progress Handlers](https://cleverplatypus.github.io/apihive-core/guide/progress-handlers.html)

#### Parameters

##### handlers

...[`ProgressHandlerConfig`](../../index/type-aliases/ProgressHandlerConfig.md)[]

The progress handlers to apply.

#### Returns

`HTTPRequest`

The updated request object.

#### Remark

This is an optional feature (download-progress and upload-progress) that must be enabled on the factory.

***

### withQueryParam()

> **withQueryParam**(`name`, `value`): `HTTPRequest`

Defined in: [HTTPRequest.ts:801](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L801)

Adds a query parameter to the request.

The value can be a literal value or a function that receives
the request config as an argument and returns a value.

#### Parameters

##### name

`string`

The name of the query parameter.

##### value

[`QueryParameterValue`](../../index/type-aliases/QueryParameterValue.md)

The value of the query parameter.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withQueryParams()

> **withQueryParams**(`params`): `HTTPRequest`

Defined in: [HTTPRequest.ts:785](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L785)

Adds multiple query parameters to the existing query parameters
of the API configuration.

Parameter values can be literal values or a function that receives
the request config as an argument and returns a value.

See [Query Parameters](https://cleverplatypus.github.io/apihive-core/guide/query-parameters.html)

#### Parameters

##### params

`Record`\<`string`, [`QueryParameterValue`](../../index/type-aliases/QueryParameterValue.md)\>

The query parameters
to be added.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withRequestInterceptors()

> **withRequestInterceptors**(...`interceptors`): `HTTPRequest`

Defined in: [HTTPRequest.ts:696](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L696)

Adds a request interceptor to the request configuration.
Interceptors are executed in the order they are added.
- If a request interceptor returns a rejected promise, the request will fail.
- If a request interceptor returns a resolved promise, the promise's result will be used as the response.
- If the interceptor returns `undefined`, the request will continue to the next interceptor, if present, or to the regular request handling
- the interceptor's second parameter is is a function that can be used to remove the interceptor from further request handling

#### Parameters

##### interceptors

...[`RequestInterceptor`](../../index/type-aliases/RequestInterceptor.md)[]

The interceptors to add.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withResponseBodyTransformers()

> **withResponseBodyTransformers**(...`transformers`): `HTTPRequest`

Defined in: [HTTPRequest.ts:905](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L905)

Sets the response body transformer for the request. The provided function will be called
after the request body is parsed.
This is especially useful when used in conjuncion with APIs definition
to hide some data massaging logic specific to the api.

Transformers are executed in the order they are added.

#### Parameters

##### transformers

...[`ResponseBodyTransformer`](../../index/type-aliases/ResponseBodyTransformer.md)[]

The response body transformers to apply.

#### Returns

`HTTPRequest`

The updated request object.

***

### withResponseInterceptors()

> **withResponseInterceptors**(...`interceptors`): `HTTPRequest`

Defined in: [HTTPRequest.ts:929](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L929)

#### Parameters

##### interceptors

...([`ResponseInterceptor`](../../index/type-aliases/ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](../../index/type-aliases/ResponseInterceptorWithOptions.md))[]

#### Returns

`HTTPRequest`

The updated request instance.

***

### withTextMimeTypes()

> **withTextMimeTypes**(...`mimeTypes`): `HTTPRequest`

Defined in: [HTTPRequest.ts:839](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L839)

Sets the MIME types that are considered text on top of the default
patterns.

#### Parameters

##### mimeTypes

...`string`[]

The MIME types to add.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withTimeout()

> **withTimeout**(`timeout`): `HTTPRequest`

Defined in: [HTTPRequest.ts:916](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L916)

#### Parameters

##### timeout

`number`

milliseconds to wait before failing the request as timed out

#### Returns

`HTTPRequest`

The updated request instance.

***

### withURLParam()

> **withURLParam**(`name`, `value`): `HTTPRequest`

Defined in: [HTTPRequest.ts:633](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L633)

Adds a URL parameter to the request configuration.

#### Parameters

##### name

`string`

The name of the URL parameter.

##### value

`string`

The value of the URL parameter.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withURLParams()

> **withURLParams**(`params`): `HTTPRequest`

Defined in: [HTTPRequest.ts:645](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/HTTPRequest.ts#L645)

Assigns multiple query params to the request configuration.

#### Parameters

##### params

`Record`\<`string`, [`QueryParameterValue`](../../index/type-aliases/QueryParameterValue.md)\>

The URL parameters to assign.

#### Returns

`HTTPRequest`

The updated request instance.

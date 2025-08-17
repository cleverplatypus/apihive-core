[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / HTTPRequest

# Class: HTTPRequest

Defined in: [HTTPRequest.ts:43](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L43)

## Remarks

This class shouldn't be instanciated directly.<br>Use [HTTPRequestFactory](HTTPRequestFactory.md) createXXXRequest() instead

## Constructors

### Constructor

> **new HTTPRequest**(`__namedParameters`): `HTTPRequest`

Defined in: [HTTPRequest.ts:118](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L118)

#### Parameters

##### \_\_namedParameters

`RequestConstructorArgs`

#### Returns

`HTTPRequest`

## Accessors

### abortController

#### Get Signature

> **get** **abortController**(): `AbortController`

Defined in: [HTTPRequest.ts:65](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L65)

##### Returns

`AbortController`

## Methods

### blank()

> **blank**(): `HTTPRequest`

Defined in: [HTTPRequest.ts:624](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L624)

Clears the config builders array and returns the instance.
Useful in cases where you want to create a new request that doesn't inherit
from API/factory settings that might have headers or other unwanted configuration

#### Returns

`HTTPRequest`

the updated request

***

### execute()

> **execute**(): `Promise`\<`any`\>

Defined in: [HTTPRequest.ts:279](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L279)

Executes the fetch request and returns a Promise that resolves with the parsed result.

#### Returns

`Promise`\<`any`\>

A Promise that resolves with the result of the request.

***

### getHash()

> **getHash**(): `string`

Defined in: [HTTPRequest.ts:979](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L979)

Generates a hash of the request configuration.
The hash is deterministic and includes method, URL, relevant headers,
query parameters, and body content to ensure consistent identification.
This key can be used for request caching purposes.

#### Returns

`string`

A unique hash-based identifier for this request

#### Remarks

This is an optional feature (request-hash) that must be enabled on the factory.

***

### getReadOnlyConfig()

> **getReadOnlyConfig**(): [`RequestConfig`](../type-aliases/RequestConfig.md)

Defined in: [HTTPRequest.ts:418](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L418)

Retrieves a read-only copy of configuration with lazy evaluation.
Function-based values (body, headers) are only evaluated when accessed.

#### Returns

[`RequestConfig`](../type-aliases/RequestConfig.md)

A read-only configuration object with lazy evaluation.

***

### ignoreResponseBody()

> **ignoreResponseBody**(): `HTTPRequest`

Defined in: [HTTPRequest.ts:797](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L797)

When called, the request will not try to parse the response

#### Returns

`HTTPRequest`

The updated request instance.

***

### withAbortListener()

> **withAbortListener**(`handler`): `HTTPRequest`

Defined in: [HTTPRequest.ts:636](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L636)

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

Defined in: [HTTPRequest.ts:652](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L652)

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

Defined in: [HTTPRequest.ts:786](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L786)

Short-hand for setting the accepted MIME types to ['*/*'] which means the API accepts any MIME type.

#### Returns

`HTTPRequest`

The current object instance.

***

### withBeforeFetchHook()

> **withBeforeFetchHook**(`hook`): `HTTPRequest`

Defined in: [HTTPRequest.ts:1009](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L1009)

Adds a [BeforeFetchHook](../type-aliases/BeforeFetchHook.md) for the request.

#### Parameters

##### hook

[`BeforeFetchHook`](../type-aliases/BeforeFetchHook.md)

The before fetch hook to apply.

#### Returns

`HTTPRequest`

The updated request object.

***

### withCredentialsPolicy()

> **withCredentialsPolicy**(`config`): `HTTPRequest`

Defined in: [HTTPRequest.ts:611](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L611)

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

Defined in: [HTTPRequest.ts:710](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L710)

Adds error interceptors to the request configuration.

Error interceptors are executed in the order they are added.
- If an error interceptor returns a rejected promise, the request will fail.
- If an error interceptor returns a resolved promise, the promise's result will be used as the response.
- If the interceptor returns `undefined`, the request will continue to the next interceptor, if present, or to the regular request handling

See [Error Interceptors](https://cleverplatypus.github.io/apihive-core/guide/error-interceptors.html)

#### Parameters

##### interceptors

...[`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)[]

The error interceptors to add.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withFormDataBody()

> **withFormDataBody**(`composerCallBack`): `HTTPRequest`

Defined in: [HTTPRequest.ts:767](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L767)

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

Defined in: [HTTPRequest.ts:688](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L688)

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

Defined in: [HTTPRequest.ts:919](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L919)

Sets a single header for the request.
Header values can be literal values or a function that receives
the request config as an argument and returns a value.

If the value is undefined, the corresponding header will be removed if present

#### Parameters

##### name

`string`

header name

##### value

[`HeaderValue`](../type-aliases/HeaderValue.md)

the value for the header, omit this parameter to remove the header

#### Returns

`HTTPRequest`

The updated request instance.

***

### withHeaders()

> **withHeaders**(`headers`): `HTTPRequest`

Defined in: [HTTPRequest.ts:899](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L899)

Sets the request headers for the request.
Header values can be literal values or a function that receives
the request config as an argument and returns a value.

If the value is undefined, the corresponding header will be removed if present

#### Parameters

##### headers

`Record`\<`string`, [`HeaderValue`](../type-aliases/HeaderValue.md)\>

name-value pairs to set as headers

#### Returns

`HTTPRequest`

The updated request instance.

***

### withJSONBody()

> **withJSONBody**(`json`): `HTTPRequest`

Defined in: [HTTPRequest.ts:739](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L739)

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

Defined in: [HTTPRequest.ts:856](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L856)

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

Defined in: [HTTPRequest.ts:599](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L599)

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

Defined in: [HTTPRequest.ts:883](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L883)

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

Defined in: [HTTPRequest.ts:582](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L582)

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

Defined in: [HTTPRequest.ts:843](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L843)

Sets the CORS mode to 'no-cors' and returns the current object.

#### Returns

`HTTPRequest`

The current object.

***

### withProgressHandlers()

> **withProgressHandlers**(...`handlers`): `HTTPRequest`

Defined in: [HTTPRequest.ts:996](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L996)

Adds progress handlers for the request.

See [Progress Handlers](https://cleverplatypus.github.io/apihive-core/guide/progress-handlers.html)

#### Parameters

##### handlers

...[`ProgressHandlerConfig`](../type-aliases/ProgressHandlerConfig.md)[]

The progress handlers to apply.

#### Returns

`HTTPRequest`

The updated request object.

#### Remarks

This is an optional feature (download-progress and upload-progress) that must be enabled on the factory.

***

### withQueryParam()

> **withQueryParam**(`name`, `value`): `HTTPRequest`

Defined in: [HTTPRequest.ts:832](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L832)

Adds a query parameter to the request.

The value can be a literal value or a function that receives
the request config as an argument and returns a value.

#### Parameters

##### name

`string`

The name of the query parameter.

##### value

[`QueryParameterValue`](../type-aliases/QueryParameterValue.md)

The value of the query parameter.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withQueryParams()

> **withQueryParams**(`params`): `HTTPRequest`

Defined in: [HTTPRequest.ts:816](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L816)

Adds multiple query parameters to the existing query parameters
of the API configuration.

Parameter values can be literal values or a function that receives
the request config as an argument and returns a value.

See [Query Parameters](https://cleverplatypus.github.io/apihive-core/guide/query-parameters.html)

#### Parameters

##### params

`Record`\<`string`, [`QueryParameterValue`](../type-aliases/QueryParameterValue.md)\>

The query parameters
to be added.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withRequestInterceptors()

> **withRequestInterceptors**(...`interceptors`): `HTTPRequest`

Defined in: [HTTPRequest.ts:727](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L727)

Adds a request interceptor to the request configuration.
Interceptors are executed in the order they are added.
- If a request interceptor returns a rejected promise, the request will fail.
- If a request interceptor returns a resolved promise, the promise's result will be used as the response.
- If the interceptor returns `undefined`, the request will continue to the next interceptor, if present, or to the regular request handling
- the interceptor's second parameter is is a function that can be used to remove the interceptor from further request handling

#### Parameters

##### interceptors

...[`RequestInterceptor`](../type-aliases/RequestInterceptor.md)[]

The interceptors to add.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withResponseBodyTransformers()

> **withResponseBodyTransformers**(...`transformers`): `HTTPRequest`

Defined in: [HTTPRequest.ts:936](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L936)

Sets the response body transformer for the request. The provided function will be called
after the request body is parsed.
This is especially useful when used in conjuncion with APIs definition
to hide some data massaging logic specific to the api.

Transformers are executed in the order they are added.

#### Parameters

##### transformers

...[`ResponseBodyTransformer`](../type-aliases/ResponseBodyTransformer.md)[]

The response body transformers to apply.

#### Returns

`HTTPRequest`

The updated request object.

***

### withResponseInterceptors()

> **withResponseInterceptors**(...`interceptors`): `HTTPRequest`

Defined in: [HTTPRequest.ts:961](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L961)

#### Parameters

##### interceptors

...([`ResponseInterceptor`](../type-aliases/ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](../type-aliases/ResponseInterceptorWithOptions.md))[]

The response interceptors to apply.

See [Response Interceptors](https://cleverplatypus.github.io/apihive-core/guide/response-interceptors.html)

#### Returns

`HTTPRequest`

The updated request instance.

***

### withTextMimeTypes()

> **withTextMimeTypes**(...`mimeTypes`): `HTTPRequest`

Defined in: [HTTPRequest.ts:870](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L870)

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

Defined in: [HTTPRequest.ts:947](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L947)

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

Defined in: [HTTPRequest.ts:664](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L664)

Adds a URL parameter to the request configuration.

#### Parameters

##### name

`string`

The name of the URL parameter.

##### value

[`URLParamValue`](../type-aliases/URLParamValue.md)

The value of the URL parameter.

#### Returns

`HTTPRequest`

The updated request instance.

***

### withURLParams()

> **withURLParams**(`params`): `HTTPRequest`

Defined in: [HTTPRequest.ts:676](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequest.ts#L676)

Assigns multiple query params to the request configuration.

#### Parameters

##### params

`Record`\<`string`, [`URLParamValue`](../type-aliases/URLParamValue.md)\>

The URL parameters to assign.

#### Returns

`HTTPRequest`

The updated request instance.

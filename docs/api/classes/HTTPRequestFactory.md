[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / HTTPRequestFactory

# Class: HTTPRequestFactory

Defined in: [HTTPRequestFactory.ts:40](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L40)

HTTPRequestFactory is the entry point of @APIHive/core.
Instantiate this class to create HTTP requests
either directly with the create[VERB]Request() methods
or by defining an API and calling the createAPIRequest() method.

The factory can have defaults that can be applied to every request
or conditionally using the when() builder method.

Request/Response interceptors and response body transformers can be added to the factory
to customise the request and response processing.

Adapters can be created or chosen from third parties and added to the factory
to provide additional functionality for common use cases such as
request caching, logging, transformation, auto-api generation etc.

## Constructors

### Constructor

> **new HTTPRequestFactory**(): `HTTPRequestFactory`

#### Returns

`HTTPRequestFactory`

## Accessors

### logger

#### Get Signature

> **get** **logger**(): `LoggerFacade`

Defined in: [HTTPRequestFactory.ts:62](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L62)

##### Returns

`LoggerFacade`

***

### logLevel

#### Get Signature

> **get** **logLevel**(): `LogLevel`

Defined in: [HTTPRequestFactory.ts:66](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L66)

##### Returns

`LogLevel`

## Methods

### always()

> **always**(): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:433](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L433)

Call this to reset any conditions in the method chain set by [when](#when)

See [Conditional Building](http://cleverplatypus.github.io/apihive-core/guide/conditional-building.html) in the docs.

#### Returns

`HTTPRequestFactory`

***

### createAPIRequest()

> **createAPIRequest**(...`args`): [`HTTPRequest`](HTTPRequest.md)

Defined in: [HTTPRequestFactory.ts:634](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L634)

Creates a [HTTPRequest](HTTPRequest.md) with configuration based on the given [APIConfig](../type-aliases/APIConfig.md)'s name and endpoint name.
If invoked with one argument (endpoint name), it will use the default API.

It also populates the request's meta with info about the API and endpoint inside `request.meta.api`
merging in any meta defined in the api config's `api.meta` and `endpoint.meta`.
This is useful for conditional request configuration based on the API
definition and for debugging purposes.

See [API Invocation](http://cleverplatypus.github.io/apihive-core/guide/api-invocation.html) in the docs.

#### Parameters

##### args

Either [apiName, endpointName] or [endpointName] for default API.

\[`string`, `string`\] | \[`string`\]

#### Returns

[`HTTPRequest`](HTTPRequest.md)

The created request.

***

### createDELETERequest()

> **createDELETERequest**(`url`): [`HTTPRequest`](HTTPRequest.md)

Defined in: [HTTPRequestFactory.ts:560](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L560)

Creates a DELETE request with the factory defaults applied.

See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.

#### Parameters

##### url

`string`

the URL to create the request for

#### Returns

[`HTTPRequest`](HTTPRequest.md)

the created HTTPRequest object

***

### createGETRequest()

> **createGETRequest**(`url`): [`HTTPRequest`](HTTPRequest.md)

Defined in: [HTTPRequestFactory.ts:527](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L527)

Creates a GET request with the factory defaults applied.

See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.

#### Parameters

##### url

`string`

the URL to create the request for

#### Returns

[`HTTPRequest`](HTTPRequest.md)

the created HTTPRequest object

***

### createHEADRequest()

> **createHEADRequest**(`url`): [`HTTPRequest`](HTTPRequest.md)

Defined in: [HTTPRequestFactory.ts:582](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L582)

Creates a HEAD request with the factory defaults applied.

See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.

#### Parameters

##### url

`string`

the URL to create the request for

#### Returns

[`HTTPRequest`](HTTPRequest.md)

the created HTTPRequest object

***

### createPATCHRequest()

> **createPATCHRequest**(`url`): [`HTTPRequest`](HTTPRequest.md)

Defined in: [HTTPRequestFactory.ts:571](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L571)

Creates a PATCH request with the factory defaults applied.

See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.

#### Parameters

##### url

`string`

the URL to create the request for

#### Returns

[`HTTPRequest`](HTTPRequest.md)

the created HTTPRequest object

***

### createPOSTRequest()

> **createPOSTRequest**(`url`): [`HTTPRequest`](HTTPRequest.md)

Defined in: [HTTPRequestFactory.ts:538](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L538)

Creates a POST request with the factory defaults applied.

See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.

#### Parameters

##### url

`string`

the URL to create the request for

#### Returns

[`HTTPRequest`](HTTPRequest.md)

the created HTTPRequest object

***

### createPUTRequest()

> **createPUTRequest**(`url`): [`HTTPRequest`](HTTPRequest.md)

Defined in: [HTTPRequestFactory.ts:549](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L549)

Creates a PUT request with the factory defaults applied.

See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.

#### Parameters

##### url

`string`

the URL to create the request for

#### Returns

[`HTTPRequest`](HTTPRequest.md)

the created HTTPRequest object

***

### createRequest()

> **createRequest**(`url`, `method`): [`HTTPRequest`](HTTPRequest.md)

Defined in: [HTTPRequestFactory.ts:500](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L500)

Creates a HTTPRequest object with the factory defaults applied.

Generally this method is not called directly, but instead
the factory methods [createGETRequest](#creategetrequest), [createPOSTRequest](#createpostrequest),
[createPUTRequest](#createputrequest), [createDELETERequest](#createdeleterequest), [createPATCHRequest](#createpatchrequest), [createHEADRequest](#createheadrequest), [createTRACERequest](#createtracerequest) or [createAPIRequest](#createapirequest) are used.

See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.

#### Parameters

##### url

`string`

the URL to create the request for

##### method

[`HTTPMethod`](../type-aliases/HTTPMethod.md) = `'GET'`

the HTTP method to use

#### Returns

[`HTTPRequest`](HTTPRequest.md)

the created HTTPRequest object

***

### createTRACERequest()

> **createTRACERequest**(`url`): [`HTTPRequest`](HTTPRequest.md)

Defined in: [HTTPRequestFactory.ts:593](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L593)

Creates a TRACE request with the factory defaults applied.

See [Creating Requests](http://cleverplatypus.github.io/apihive-core/guide/creating-requests.html) in the docs.

#### Parameters

##### url

`string`

the URL to create the request for

#### Returns

[`HTTPRequest`](HTTPRequest.md)

the created HTTPRequest object

***

### deleteRequestInterceptor()

> **deleteRequestInterceptor**(`interceptor`): `void`

Defined in: [HTTPRequestFactory.ts:479](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L479)

Removes a request interceptor from the factory defaults.

See [Request Interceptors](http://cleverplatypus.github.io/apihive-core/guide/request-interceptors.html) in the docs.

#### Parameters

##### interceptor

[`RequestInterceptor`](../type-aliases/RequestInterceptor.md)

the interceptor to remove

#### Returns

`void`

***

### detachAdapter()

> **detachAdapter**(`adapterName`): `Promise`\<`HTTPRequestFactory`\>

Defined in: [HTTPRequestFactory.ts:683](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L683)

Detaches an adapter from the factory.

See [Adapters](http://cleverplatypus.github.io/apihive-core/guide/adapters.html) in the docs.

#### Parameters

##### adapterName

`string`

The name of the adapter to detach.

#### Returns

`Promise`\<`HTTPRequestFactory`\>

The factory instance.

#### Remarks

It requires the "adapters" feature to be enabled.

***

### getAttachedAdapters()

> **getAttachedAdapters**(): `string`[]

Defined in: [HTTPRequestFactory.ts:697](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L697)

Returns the names of the adapters attached to the factory.

See [Adapters](http://cleverplatypus.github.io/apihive-core/guide/adapters.html) in the docs.

#### Returns

`string`[]

The names of the attached adapters.

#### Remarks

It requires the "adapters" feature to be enabled.

***

### hasAdapter()

> **hasAdapter**(`adapterName`): `boolean`

Defined in: [HTTPRequestFactory.ts:712](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L712)

Returns true if the factory has an adapter attached with the given name.

See [Adapters](http://cleverplatypus.github.io/apihive-core/guide/adapters.html) in the docs.

#### Parameters

##### adapterName

`string`

The name of the adapter to check.

#### Returns

`boolean`

True if the adapter is attached, false otherwise.

#### Remarks

It requires the "adapters" feature to be enabled.

***

### use()

> **use**(`feature`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:90](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L90)

Enables a feature in the factory.

To minimise the size of the module's bundle, some less used pieces
of functionality are not included by default:
- progress handlers
- request hash generation
- adapters API

To enable any of these features, import the feature from the
@apihive/core/features/[feature-name] and call this method
with the feature object.

#### Parameters

##### feature

[`Feature`](../interfaces/Feature.md)

a reference to a supported feature

#### Returns

`HTTPRequestFactory`

the factory instance

***

### when()

> **when**(`condition`): `any`

Defined in: [HTTPRequestFactory.ts:442](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L442)

Adds a condition for the application of method-chain settings. It can be reset by calling [always](#always)

See [Conditional Building](http://cleverplatypus.github.io/apihive-core/guide/conditional-building.html) in the docs.

#### Parameters

##### condition

(`config`) => `boolean`

#### Returns

`any`

***

### withAbortListener()

> **withAbortListener**(`listener`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:418](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L418)

Adds the provided abort listener to the factory defaults.
See [Abort Listeners](http://cleverplatypus.github.io/apihive-core/guide/abort-listeners.html) in the documentation

#### Parameters

##### listener

(`event`) => `void`

the listener to add

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withAccept()

> **withAccept**(...`mimeTypes`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:188](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L188)

Sets the default accept header to the factory defaults.

#### Parameters

##### mimeTypes

...`string`[]

the MIME types to accept

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withAdapter()

> **withAdapter**(`adapter`, `options?`): `Promise`\<`HTTPRequestFactory`\>

Defined in: [HTTPRequestFactory.ts:668](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L668)

Attaches an adapter to the factory.

See [Adapters](http://cleverplatypus.github.io/apihive-core/guide/adapters.html) in the docs.

#### Parameters

##### adapter

[`Adapter`](../interfaces/Adapter.md)

The adapter to attach.

##### options?

[`AdapterOptions`](../interfaces/AdapterOptions.md)

Optional. The options for the adapter.

#### Returns

`Promise`\<`HTTPRequestFactory`\>

The factory instance.

#### Remarks

It requires the "adapters" feature to be enabled.

***

### withAPIConfig()

> **withAPIConfig**(...`apis`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:613](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L613)

Adds API configurations ([APIConfig](../type-aliases/APIConfig.md)) to the factory.

API endpoints can then be invoked using [createAPIRequest](#createapirequest).

If an API has a name that is "default", it will be used as the default API.
Which means that [createAPIRequest](#createapirequest) can be called with just the endpoint name.

See [API Config](http://cleverplatypus.github.io/apihive-core/guide/api-config.html) in the docs.

#### Parameters

##### apis

...[`APIConfig`](../type-aliases/APIConfig.md)[]

the API configurations to add

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withBaseURL()

> **withBaseURL**(`baseURL`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:300](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L300)

Sets the default base URL for requests created with a relative URL.

#### Parameters

##### baseURL

`string`

the base URL to set

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withCredentialsPolicy()

> **withCredentialsPolicy**(`config`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:289](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L289)

Sets the default credentials policy to the factory defaults.

#### Parameters

##### config

`RequestCredentials`

the credentials policy to set

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withErrorInterceptors()

> **withErrorInterceptors**(...`interceptors`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:335](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L335)

Adds the provided error interceptors to the factory defaults.
See [Error Interceptors](http://cleverplatypus.github.io/apihive-core/guide/error-interceptors.html) in the documentation

#### Parameters

##### interceptors

...[`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)[]

the interceptors to add

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withHeader()

> **withHeader**(`key`, `value`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:263](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L263)

Sets the default [value] for the header [key] to the factory defaults.

#### Parameters

##### key

`string`

the header key

##### value

the header value

`string` | (`config`) => `string`

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withHeaders()

> **withHeaders**(`headers`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:274](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L274)

Sets the value for the passed key/value pairs of headers to the factory defaults.

#### Parameters

##### headers

`Record`\<`string`, [`HeaderValue`](../type-aliases/HeaderValue.md)\>

a key/value pair of headers to set

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withJSONMimeTypes()

> **withJSONMimeTypes**(...`mimeTypes`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:367](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L367)

Instructs the factory to treat response mime types that match
the provided regexp as JSON when the library's default
JSON types matching is not enough.

#### Parameters

##### mimeTypes

...`string`[]

the MIME types to add

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withLogger()

> **withLogger**(`logger`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:164](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L164)

Sets the logger adapter for the factory.

#### Parameters

##### logger

`LoggerFacade`

a logger complying with the LoggerFacade interface

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withLogLevel()

> **withLogLevel**(`level`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:176](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L176)

Sets the log level for the factory.

#### Parameters

##### level

`LogLevel`

the log level to set

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withProgressHandlers()

> **withProgressHandlers**(...`handlers`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:400](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L400)

Adds the provided progress handlers to the factory defaults.
See [Progress Handlers](http://cleverplatypus.github.io/apihive-core/guide/progress-handlers.html) in the documentation

#### Parameters

##### handlers

...[`ProgressHandlerConfig`](../type-aliases/ProgressHandlerConfig.md)[]

the handlers to add

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withQueryParam()

> **withQueryParam**(`key`, `value`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:220](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L220)

Adds a query parameter to the factory defaults.

The value can be a literal value or a function that receives
the request config as an argument and returns a value.

#### Parameters

##### key

`string`

##### value

[`QueryParameterValue`](../type-aliases/QueryParameterValue.md)

The value of the query parameter.

#### Returns

`HTTPRequestFactory`

The updated request instance.

***

### withQueryParams()

> **withQueryParams**(`params`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:205](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L205)

Adds multiple query parameters to the factory defaults.

Parameter values can be literal values or a function that receives
the request config as an argument and returns a value.

See [Query Parameters](https://cleverplatypus.github.io/apihive-core/guide/query-parameters.html)

#### Parameters

##### params

`Record`\<`string`, [`QueryParameterValue`](../type-aliases/QueryParameterValue.md)\>

The query parameters
to be added.

#### Returns

`HTTPRequestFactory`

The updated request instance.

***

### withRequestInterceptors()

> **withRequestInterceptors**(...`interceptors`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:317](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L317)

Adds the provided request interceptors to the factory defaults.
See [Request Interceptors](http://cleverplatypus.github.io/apihive-core/guide/request-interceptors.html) in the documentation

#### Parameters

##### interceptors

...[`RequestInterceptor`](../type-aliases/RequestInterceptor.md)[]

the interceptors to add

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withResponseBodyTransformers()

> **withResponseBodyTransformers**(...`transformers`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:349](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L349)

Adds the provided response body transformers to the factory defaults.
See [Response Body Transformers](http://cleverplatypus.github.io/apihive-core/guide/response-body-transformers.html) in the documentation

#### Parameters

##### transformers

...[`ResponseBodyTransformer`](../type-aliases/ResponseBodyTransformer.md)[]

the transformers to add

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withTextMimeTypes()

> **withTextMimeTypes**(...`mimeTypes`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:382](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L382)

Instructs the factory to treat response mime types that match
the provided regexp as text when the library's default
text types matching is not enough.

#### Parameters

##### mimeTypes

...`string`[]

the MIME types to add

#### Returns

`HTTPRequestFactory`

the factory instance

***

### withURLParam()

> **withURLParam**(`key`, `value`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:251](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L251)

Adds a URL parameter to the factory defaults.

URL parameters are used to replace {{placeholders}} in the URL template.
Their value can be a literal value or a function that receives
the request config as an argument and returns a value.

#### Parameters

##### key

`string`

##### value

[`URLParamValue`](../type-aliases/URLParamValue.md)

The value of the URL parameter.

#### Returns

`HTTPRequestFactory`

The updated request instance.

***

### withURLParams()

> **withURLParams**(`params`): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:235](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L235)

Adds multiple URL parameters to the factory defaults.

URL parameters are used to replace {{placeholders}} in the URL template.
Their value can be a literal value or a function that receives
the request config as an argument and returns a value.

#### Parameters

##### params

`Record`\<`string`, [`URLParamValue`](../type-aliases/URLParamValue.md)\>

The URL parameters to add.

#### Returns

`HTTPRequestFactory`

The updated request instance.

***

### withWrappedResponseError()

> **withWrappedResponseError**(): `HTTPRequestFactory`

Defined in: [HTTPRequestFactory.ts:153](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/HTTPRequestFactory.ts#L153)

Enables factory-wide wrapping of results into a `{ response? , error? }` object.

This leverages a fail-fast programming style without try/catch blocks.

#### Returns

`HTTPRequestFactory`

the factory instance

#### Example

```typescript
const factory = new HTTPRequestFactory()
  .withWrappedResponseError();

const {response, error} = await factory
  .createGETRequest('https://httpbin.org/json')
  .execute();

if (error) { //fail fast
  console.error('TODO: handle error', error);
  return;
}

console.log('deal with response', response);

```

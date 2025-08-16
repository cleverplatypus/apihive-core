[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / RequestInterceptorControls

# Interface: RequestInterceptorControls

Defined in: [types.ts:74](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L74)

Control APIs available to interceptors for manipulating the request during execution.

## Methods

### abort()

> **abort**(): `void`

Defined in: [types.ts:78](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L78)

Abort the current request

#### Returns

`void`

***

### finaliseURL()

> **finaliseURL**(): `string`

Defined in: [types.ts:95](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L95)

Finalise the request URL. After this call, the URL becomes immutable
and further calls to replaceURL() will throw.
Returns the composed final URL.

#### Returns

`string`

***

### replaceURL()

> **replaceURL**(`newURL`, `newURLParams?`): `void`

Defined in: [types.ts:83](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L83)

Replace the request URL

#### Parameters

##### newURL

`string`

##### newURLParams?

[`URLParams`](../type-aliases/URLParams.md)

#### Returns

`void`

***

### updateHeaders()

> **updateHeaders**(`headers`): `void`

Defined in: [types.ts:88](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L88)

Update request headers (merges with existing headers)

#### Parameters

##### headers

`Record`\<`string`, `any`\>

#### Returns

`void`

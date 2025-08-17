[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / RequestInterceptorControls

# Interface: RequestInterceptorControls

Defined in: [types.ts:74](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L74)

Control APIs available to interceptors for manipulating the request during execution.

## Methods

### abort()

> **abort**(): `void`

Defined in: [types.ts:78](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L78)

Abort the current request

#### Returns

`void`

***

### finaliseURL()

> **finaliseURL**(): `string`

Defined in: [types.ts:95](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L95)

Finalise the request URL. After this call, the URL becomes immutable
and further calls to replaceURL() will throw.
Returns the composed final URL.

#### Returns

`string`

***

### getProvisionalURL()

> **getProvisionalURL**(): `string`

Defined in: [types.ts:100](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L100)

Get the provisional URL before finalisation

#### Returns

`string`

***

### replaceBody()

> **replaceBody**(`replacer`): `void`

Defined in: [types.ts:108](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L108)

Sets a last-minute body replacer

#### Parameters

##### replacer

(`body`) => `any`

The function to be called with the current body as argument and returning the new body

#### Returns

`void`

#### Remarks

when a request has a JSON body, the received body is always a string.<br>This means the body would generally need parsing.

***

### replaceURL()

> **replaceURL**(`newURL`, `newURLParams?`): `void`

Defined in: [types.ts:83](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L83)

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

Defined in: [types.ts:88](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L88)

Update request headers (merges with existing headers)

#### Parameters

##### headers

`Record`\<`string`, `any`\>

#### Returns

`void`

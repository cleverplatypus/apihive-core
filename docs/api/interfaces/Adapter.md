[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / Adapter

# Interface: Adapter

Defined in: [adapter-types.ts:21](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L21)

Core interface for all adapters in the apihive ecosystem.
Adapters extend the factory's functionality through interceptors and hooks.

## Properties

### name

> `readonly` **name**: `string`

Defined in: [adapter-types.ts:24](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L24)

Unique identifier for this adapter

***

### priority?

> `readonly` `optional` **priority**: [`AdapterPriority`](AdapterPriority.md)

Defined in: [adapter-types.ts:27](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L27)

Default priority for this adapter's interceptors

***

### use?

> `readonly` `optional` **use**: [`Feature`](Feature.md)[]

Defined in: [adapter-types.ts:30](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L30)

Features required by this adapter. The adapters feature will auto-enable them on attach.

## Methods

### getErrorInterceptors()?

> `optional` **getErrorInterceptors**(): [`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)[]

Defined in: [adapter-types.ts:45](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L45)

Returns error interceptors this adapter provides

#### Returns

[`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)[]

***

### getFactoryDefaults()?

> `optional` **getFactoryDefaults**(): [`RequestConfigBuilder`](../type-aliases/RequestConfigBuilder.md)[]

Defined in: [adapter-types.ts:48](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L48)

Returns factory defaults this adapter provides

#### Returns

[`RequestConfigBuilder`](../type-aliases/RequestConfigBuilder.md)[]

***

### getRequestInterceptors()?

> `optional` **getRequestInterceptors**(): [`RequestInterceptor`](../type-aliases/RequestInterceptor.md)[]

Defined in: [adapter-types.ts:39](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L39)

Returns request interceptors this adapter provides

#### Returns

[`RequestInterceptor`](../type-aliases/RequestInterceptor.md)[]

***

### getResponseInterceptors()?

> `optional` **getResponseInterceptors**(): ([`ResponseInterceptor`](../type-aliases/ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](../type-aliases/ResponseInterceptorWithOptions.md))[]

Defined in: [adapter-types.ts:42](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L42)

Returns response interceptors this adapter provides

#### Returns

([`ResponseInterceptor`](../type-aliases/ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](../type-aliases/ResponseInterceptorWithOptions.md))[]

***

### onAttach()?

> `optional` **onAttach**(`factory`): `void`

Defined in: [adapter-types.ts:33](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L33)

Called when adapter is attached to a factory

#### Parameters

##### factory

[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

#### Returns

`void`

***

### onDetach()?

> `optional` **onDetach**(`factory`): `void`

Defined in: [adapter-types.ts:36](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/adapter-types.ts#L36)

Called when adapter is detached from a factory

#### Parameters

##### factory

[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

#### Returns

`void`

[**@apihive/core**](../../README.md)

***

[@apihive/core](../../modules.md) / [index](../README.md) / Adapter

# Interface: Adapter

Defined in: [adapter-types.ts:21](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L21)

Core interface for all adapters in the apihive ecosystem.
Adapters extend the factory's functionality through interceptors and hooks.

## Properties

### name

> `readonly` **name**: `string`

Defined in: [adapter-types.ts:23](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L23)

Unique identifier for this adapter

***

### priority?

> `readonly` `optional` **priority**: [`AdapterPriority`](AdapterPriority.md)

Defined in: [adapter-types.ts:26](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L26)

Default priority for this adapter's interceptors

## Methods

### getErrorInterceptors()?

> `optional` **getErrorInterceptors**(): [`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)[]

Defined in: [adapter-types.ts:41](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L41)

Returns error interceptors this adapter provides

#### Returns

[`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)[]

***

### getFactoryDefaults()?

> `optional` **getFactoryDefaults**(): [`RequestConfigBuilder`](../type-aliases/RequestConfigBuilder.md)[]

Defined in: [adapter-types.ts:44](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L44)

Returns factory defaults this adapter provides

#### Returns

[`RequestConfigBuilder`](../type-aliases/RequestConfigBuilder.md)[]

***

### getRequestInterceptors()?

> `optional` **getRequestInterceptors**(): [`RequestInterceptor`](../type-aliases/RequestInterceptor.md)[]

Defined in: [adapter-types.ts:35](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L35)

Returns request interceptors this adapter provides

#### Returns

[`RequestInterceptor`](../type-aliases/RequestInterceptor.md)[]

***

### getResponseInterceptors()?

> `optional` **getResponseInterceptors**(): ([`ResponseInterceptor`](../type-aliases/ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](../type-aliases/ResponseInterceptorWithOptions.md))[]

Defined in: [adapter-types.ts:38](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L38)

Returns response interceptors this adapter provides

#### Returns

([`ResponseInterceptor`](../type-aliases/ResponseInterceptor.md) \| [`ResponseInterceptorWithOptions`](../type-aliases/ResponseInterceptorWithOptions.md))[]

***

### onAttach()?

> `optional` **onAttach**(`factory`): `void` \| `Promise`\<`void`\>

Defined in: [adapter-types.ts:29](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L29)

Called when adapter is attached to a factory

#### Parameters

##### factory

[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onDetach()?

> `optional` **onDetach**(`factory`): `void` \| `Promise`\<`void`\>

Defined in: [adapter-types.ts:32](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/adapter-types.ts#L32)

Called when adapter is detached from a factory

#### Parameters

##### factory

[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

#### Returns

`void` \| `Promise`\<`void`\>

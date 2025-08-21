[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / FeatureFactoryDelegates

# Type Alias: FeatureFactoryDelegates

> **FeatureFactoryDelegates** = `object`

Defined in: [types.ts:54](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L54)

## Properties

### createSSERequest()?

> `optional` **createSSERequest**: (`url`, `args`) => `any`

Defined in: [types.ts:63](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L63)

Factory-level delegate to construct an SSERequest instance.
Implementations should instantiate the request with factory defaults applied.

#### Parameters

##### url

`string`

##### args

###### defaultConfigBuilders

(`request`) => `void`[]

###### wrapErrors

`boolean`

#### Returns

`any`

***

### detachAdapter()?

> `optional` **detachAdapter**: (`adapterName`) => [`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

Defined in: [types.ts:56](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L56)

#### Parameters

##### adapterName

`string`

#### Returns

[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

***

### getAttachedAdapters()?

> `optional` **getAttachedAdapters**: () => `string`[]

Defined in: [types.ts:57](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L57)

#### Returns

`string`[]

***

### hasAdapter()?

> `optional` **hasAdapter**: (`name`) => `boolean`

Defined in: [types.ts:58](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L58)

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### withAdapter()?

> `optional` **withAdapter**: (`adapter`, `options?`) => [`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

Defined in: [types.ts:55](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L55)

#### Parameters

##### adapter

[`Adapter`](../interfaces/Adapter.md)

##### options?

[`AdapterOptions`](../interfaces/AdapterOptions.md)

#### Returns

[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

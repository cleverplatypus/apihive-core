[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / FeatureFactoryDelegates

# Type Alias: FeatureFactoryDelegates

> **FeatureFactoryDelegates** = `object`

Defined in: [types.ts:53](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L53)

## Properties

### detachAdapter()

> **detachAdapter**: (`adapterName`) => `Promise`\<[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)\>

Defined in: [types.ts:55](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L55)

#### Parameters

##### adapterName

`string`

#### Returns

`Promise`\<[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)\>

***

### getAttachedAdapters()

> **getAttachedAdapters**: () => `string`[]

Defined in: [types.ts:56](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L56)

#### Returns

`string`[]

***

### hasAdapter()

> **hasAdapter**: (`name`) => `boolean`

Defined in: [types.ts:57](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L57)

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### withAdapter()

> **withAdapter**: (`adapter`, `options?`) => `Promise`\<[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)\>

Defined in: [types.ts:54](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L54)

#### Parameters

##### adapter

[`Adapter`](../interfaces/Adapter.md)

##### options?

[`AdapterOptions`](../interfaces/AdapterOptions.md)

#### Returns

`Promise`\<[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)\>

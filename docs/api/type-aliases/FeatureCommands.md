[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / FeatureCommands

# Type Alias: FeatureCommands

> **FeatureCommands** = `object`

Defined in: [types.ts:101](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L101)

## Properties

### addRequestDefaults()

> **addRequestDefaults**: (...`args`) => `void`

Defined in: [types.ts:102](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L102)

#### Parameters

##### args

...[`RequestConfigBuilder`](RequestConfigBuilder.md)[]

#### Returns

`void`

***

### afterRequestCreated()

> **afterRequestCreated**: (`hook`) => `void` \| [`FeatureRequestDelegates`](FeatureRequestDelegates.md)

Defined in: [types.ts:104](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L104)

#### Parameters

##### hook

(`request`) => `void`

#### Returns

`void` \| [`FeatureRequestDelegates`](FeatureRequestDelegates.md)

***

### beforeFetch()

> **beforeFetch**: (`hook`) => `void`

Defined in: [types.ts:105](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L105)

#### Parameters

##### hook

[`BeforeFetchHook`](BeforeFetchHook.md)

#### Returns

`void`

***

### removeRequestDefaults()

> **removeRequestDefaults**: (...`args`) => `void`

Defined in: [types.ts:103](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L103)

#### Parameters

##### args

...[`RequestConfigBuilder`](RequestConfigBuilder.md)[]

#### Returns

`void`

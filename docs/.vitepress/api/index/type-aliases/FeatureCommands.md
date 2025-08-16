[**@apihive/core**](../../README.md)

***

[@apihive/core](../../modules.md) / [index](../README.md) / FeatureCommands

# Type Alias: FeatureCommands

> **FeatureCommands** = `object`

Defined in: [types.ts:60](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L60)

## Properties

### addRequestDefaults()

> **addRequestDefaults**: (...`args`) => `void`

Defined in: [types.ts:61](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L61)

#### Parameters

##### args

...[`RequestConfigBuilder`](RequestConfigBuilder.md)[]

#### Returns

`void`

***

### afterRequestCreated()

> **afterRequestCreated**: (`hook`) => `void` \| [`FeatureRequestDelegates`](FeatureRequestDelegates.md)

Defined in: [types.ts:63](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L63)

#### Parameters

##### hook

(`request`) => `void`

#### Returns

`void` \| [`FeatureRequestDelegates`](FeatureRequestDelegates.md)

***

### beforeFetch()

> **beforeFetch**: (`hook`) => `void`

Defined in: [types.ts:64](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L64)

#### Parameters

##### hook

[`BeforeFetchHook`](BeforeFetchHook.md)

#### Returns

`void`

***

### removeRequestDefaults()

> **removeRequestDefaults**: (...`args`) => `void`

Defined in: [types.ts:62](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L62)

#### Parameters

##### args

...[`RequestConfigBuilder`](RequestConfigBuilder.md)[]

#### Returns

`void`

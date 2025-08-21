[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / Feature

# Interface: Feature

Defined in: [types.ts:34](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L34)

## Properties

### name

> **name**: [`FeatureName`](../type-aliases/FeatureName.md)

Defined in: [types.ts:35](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L35)

## Methods

### apply()?

> `optional` **apply**(`target`, `commands`): `void`

Defined in: [types.ts:36](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L36)

#### Parameters

##### target

[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

##### commands

[`FeatureCommands`](../type-aliases/FeatureCommands.md)

#### Returns

`void`

***

### getDelegates()?

> `optional` **getDelegates**(`factory`): `object`

Defined in: [types.ts:37](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L37)

#### Parameters

##### factory

[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

#### Returns

`object`

##### factory?

> `optional` **factory**: `Partial`\<[`FeatureFactoryDelegates`](../type-aliases/FeatureFactoryDelegates.md)\>

##### request?

> `optional` **request**: [`FeatureRequestDelegates`](../type-aliases/FeatureRequestDelegates.md)

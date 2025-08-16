[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / Feature

# Interface: Feature

Defined in: [types.ts:33](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L33)

## Properties

### name

> **name**: [`FeatureName`](../type-aliases/FeatureName.md)

Defined in: [types.ts:34](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L34)

## Methods

### apply()?

> `optional` **apply**(`target`, `commands`): `void`

Defined in: [types.ts:35](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L35)

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

Defined in: [types.ts:36](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L36)

#### Parameters

##### factory

[`HTTPRequestFactory`](../classes/HTTPRequestFactory.md)

#### Returns

`object`

##### factory?

> `optional` **factory**: [`FeatureFactoryDelegates`](../type-aliases/FeatureFactoryDelegates.md)

##### request?

> `optional` **request**: [`FeatureRequestDelegates`](../type-aliases/FeatureRequestDelegates.md)

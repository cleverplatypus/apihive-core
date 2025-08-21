[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / EndpointParams

# Type Alias: EndpointParams

> **EndpointParams** = `object`

Defined in: [types.ts:340](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L340)

Parameter object structure for endpoint functions.

This type provides IntelliSense suggestions for standard endpoint parameters
while remaining flexible enough to allow specific parameter shapes.

## Example

```ts
Standard usage:
(params: { pathParams: { id: string }; bodyParams?: { name: string } }) => Promise<User>
```

## Indexable

\[`key`: `string`\]: `any`

## Properties

### bodyParams?

> `optional` **bodyParams**: `Record`\<`string`, `any`\>

Defined in: [types.ts:342](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L342)

***

### pathParams?

> `optional` **pathParams**: `Record`\<`string`, `any`\>

Defined in: [types.ts:341](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L341)

***

### queryParams?

> `optional` **queryParams**: `Record`\<`string`, `any`\>

Defined in: [types.ts:343](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L343)

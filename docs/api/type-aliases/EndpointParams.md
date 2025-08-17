[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / EndpointParams

# Type Alias: EndpointParams

> **EndpointParams** = `object`

Defined in: [types.ts:258](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L258)

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

Defined in: [types.ts:260](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L260)

***

### pathParams?

> `optional` **pathParams**: `Record`\<`string`, `any`\>

Defined in: [types.ts:259](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L259)

***

### queryParams?

> `optional` **queryParams**: `Record`\<`string`, `any`\>

Defined in: [types.ts:261](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L261)

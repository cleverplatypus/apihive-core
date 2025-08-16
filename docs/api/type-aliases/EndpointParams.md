[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / EndpointParams

# Type Alias: EndpointParams

> **EndpointParams** = `object`

Defined in: [types.ts:238](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L238)

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

Defined in: [types.ts:240](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L240)

***

### pathParams?

> `optional` **pathParams**: `Record`\<`string`, `any`\>

Defined in: [types.ts:239](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L239)

***

### queryParams?

> `optional` **queryParams**: `Record`\<`string`, `any`\>

Defined in: [types.ts:241](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L241)

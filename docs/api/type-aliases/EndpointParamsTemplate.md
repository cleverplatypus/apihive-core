[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / EndpointParamsTemplate

# Type Alias: EndpointParamsTemplate

> **EndpointParamsTemplate** = `object`

Defined in: [types.ts:358](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L358)

Template type for endpoint parameters that provides IntelliSense.
Use intersection with this type to get autocomplete for standard parameter properties.

## Example

```ts
type CreateUserParams = EndpointParamsTemplate & {
  pathParams: { orgId: string };
  bodyParams: { name: string; email: string };
  queryParams?: { notify: boolean };
}
```

## Properties

### bodyParams?

> `optional` **bodyParams**: `any`

Defined in: [types.ts:360](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L360)

***

### pathParams?

> `optional` **pathParams**: `any`

Defined in: [types.ts:359](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L359)

***

### queryParams?

> `optional` **queryParams**: `any`

Defined in: [types.ts:361](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L361)

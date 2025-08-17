[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / EndpointParamsTemplate

# Type Alias: EndpointParamsTemplate

> **EndpointParamsTemplate** = `object`

Defined in: [types.ts:276](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L276)

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

Defined in: [types.ts:278](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L278)

***

### pathParams?

> `optional` **pathParams**: `any`

Defined in: [types.ts:277](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L277)

***

### queryParams?

> `optional` **queryParams**: `any`

Defined in: [types.ts:279](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L279)

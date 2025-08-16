[**@apihive/core**](../../README.md)

***

[@apihive/core](../../modules.md) / [index](../README.md) / EndpointParamsTemplate

# Type Alias: EndpointParamsTemplate

> **EndpointParamsTemplate** = `object`

Defined in: [types.ts:256](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L256)

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

Defined in: [types.ts:258](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L258)

***

### pathParams?

> `optional` **pathParams**: `any`

Defined in: [types.ts:257](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L257)

***

### queryParams?

> `optional` **queryParams**: `any`

Defined in: [types.ts:259](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L259)

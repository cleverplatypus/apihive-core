[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / Endpoint

# Type Alias: Endpoint

> **Endpoint** = `object`

Defined in: [types.ts:207](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L207)

The definition of an API endpoint to be listed in the [APIConfig.endpoints](APIConfig.md#endpoints) map

## Properties

### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [types.ts:219](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L219)

Any metadata that should be attached to the endpoint's requests for later reference

***

### method?

> `optional` **method**: [`HTTPMethod`](HTTPMethod.md)

Defined in: [types.ts:215](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L215)

The HTTP method of the endpoint. Defaults to `GET`

***

### target

> **target**: `string`

Defined in: [types.ts:211](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L211)

The path of the endpoint relative to the API [APIConfig.baseURL](APIConfig.md#baseurl)

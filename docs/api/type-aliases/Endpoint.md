[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / Endpoint

# Type Alias: Endpoint

> **Endpoint** = `object`

Defined in: [types.ts:227](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L227)

The definition of an API endpoint to be listed in the [APIConfig.endpoints](APIConfig.md#endpoints) map

## Properties

### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [types.ts:239](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L239)

Any metadata that should be attached to the endpoint's requests for later reference

***

### method?

> `optional` **method**: [`HTTPMethod`](HTTPMethod.md)

Defined in: [types.ts:235](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L235)

The HTTP method of the endpoint. Defaults to `GET`

***

### target

> **target**: `string`

Defined in: [types.ts:231](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L231)

The path of the endpoint relative to the API [APIConfig.baseURL](APIConfig.md#baseurl)

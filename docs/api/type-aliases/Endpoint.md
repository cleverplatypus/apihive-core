[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / Endpoint

# Type Alias: Endpoint

> **Endpoint** = `object`

Defined in: [types.ts:309](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L309)

The definition of an API endpoint to be listed in the [APIConfig.endpoints](APIConfig.md#endpoints) map

## Properties

### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [types.ts:321](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L321)

Any metadata that should be attached to the endpoint's requests for later reference

***

### method?

> `optional` **method**: [`HTTPMethod`](HTTPMethod.md) \| [`SSEMethod`](SSEMethod.md)

Defined in: [types.ts:317](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L317)

The HTTP method of the endpoint. Defaults to `GET`

***

### target

> **target**: `string`

Defined in: [types.ts:313](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L313)

The path of the endpoint relative to the API [APIConfig.baseURL](APIConfig.md#baseurl)

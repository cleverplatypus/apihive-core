[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / BaseAPIInterface

# Type Alias: BaseAPIInterface

> **BaseAPIInterface** = `object`

Defined in: [types.ts:380](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L380)

Base type for API configurations where endpoints are defined as functions
with single-object parameters. This enables type-safe code generation.

## Example

```ts
type GitHubAPI = BaseAPIInterface & {
  endpoints: {
    getUser: (params: { pathParams: { username: string } }) => Promise<User>;
    createRepo: (params: {
      pathParams: { owner: string };
      bodyParams: { name: string; description?: string };
    }) => Promise<Repository>;
  };
  meta?: { requiresAuth: boolean };
}
```

## Properties

### endpoints?

> `optional` **endpoints**: `Record`\<`string`, (`params`) => `Promise`\<`any`\>\>

Defined in: [types.ts:381](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L381)

***

### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [types.ts:382](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L382)

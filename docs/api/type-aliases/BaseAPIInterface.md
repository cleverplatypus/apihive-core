[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / BaseAPIInterface

# Type Alias: BaseAPIInterface

> **BaseAPIInterface** = `object`

Defined in: [types.ts:298](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L298)

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

Defined in: [types.ts:299](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L299)

***

### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [types.ts:300](https://github.com/cleverplatypus/apihive-core/blob/41e3c1cea55590dc03062ff0c7aaa365f3b52362/src/types.ts#L300)

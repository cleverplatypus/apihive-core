[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / BaseAPIInterface

# Type Alias: BaseAPIInterface

> **BaseAPIInterface** = `object`

Defined in: [types.ts:278](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L278)

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

Defined in: [types.ts:279](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L279)

***

### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [types.ts:280](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L280)

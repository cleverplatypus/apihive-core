[**@apihive/core**](../README.md)

***

[@apihive/core](../globals.md) / FeatureRequestDelegates

# Type Alias: FeatureRequestDelegates

> **FeatureRequestDelegates** = `object`

Defined in: [types.ts:43](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L43)

## Properties

### getFetchImpl()?

> `optional` **getFetchImpl**: (`config`) => [`FetchLike`](FetchLike.md)

Defined in: [types.ts:51](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L51)

#### Parameters

##### config

[`RequestConfig`](RequestConfig.md)

#### Returns

[`FetchLike`](FetchLike.md)

***

### getHash()?

> `optional` **getHash**: (`request`, `options?`) => `string`

Defined in: [types.ts:44](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L44)

#### Parameters

##### request

[`HTTPRequest`](../classes/HTTPRequest.md)

##### options?

[`RequestHashOptions`](RequestHashOptions.md)

#### Returns

`string`

***

### handleDownloadProgress()?

> `optional` **handleDownloadProgress**: (`info`) => `Promise`\<`Blob`\>

Defined in: [types.ts:46](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L46)

#### Parameters

##### info

###### abortController

`AbortController`

###### config

[`RequestConfig`](RequestConfig.md)

###### response

`Response`

#### Returns

`Promise`\<`Blob`\>

***

### handleUploadProgress()?

> `optional` **handleUploadProgress**: (`info`) => `void`

Defined in: [types.ts:45](https://github.com/cleverplatypus/apihive-core/blob/07013091b03a0f47e51724fb271d78c36a50ebbd/src/types.ts#L45)

#### Parameters

##### info

[`ProgressInfo`](ProgressInfo.md)

#### Returns

`void`

[**@apihive/core**](../../README.md)

***

[@apihive/core](../../modules.md) / [index](../README.md) / FeatureRequestDelegates

# Type Alias: FeatureRequestDelegates

> **FeatureRequestDelegates** = `object`

Defined in: [types.ts:42](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L42)

## Properties

### getFetchImpl()?

> `optional` **getFetchImpl**: (`config`) => [`FetchLike`](FetchLike.md)

Defined in: [types.ts:50](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L50)

#### Parameters

##### config

[`RequestConfig`](RequestConfig.md)

#### Returns

[`FetchLike`](FetchLike.md)

***

### getHash()?

> `optional` **getHash**: (`request`) => `string`

Defined in: [types.ts:43](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L43)

#### Parameters

##### request

[`HTTPRequest`](../../HTTPRequest/classes/HTTPRequest.md)

#### Returns

`string`

***

### handleDownloadProgress()?

> `optional` **handleDownloadProgress**: (`info`) => `Promise`\<`Blob`\>

Defined in: [types.ts:45](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L45)

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

Defined in: [types.ts:44](https://github.com/cleverplatypus/apihive-core/blob/917ef8bbf07171bc9393193650ebef9dbc655327/src/types.ts#L44)

#### Parameters

##### info

[`ProgressInfo`](ProgressInfo.md)

#### Returns

`void`

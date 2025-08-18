# Optional Features

APIHive has some optional features that were made available as separate modules to reduce the bundle size of the core library.


## Features

| Feature Name | Description |
| --- | --- |
| upload-progress | Adds support for tracking upload progress |
| download-progress | Adds support for tracking download progress |
| request-hash | Adds support for generating a hash for the request |
| adapters | Adds support for adapters |
| sse-request | Adds support for Server-Sent Events |

## How to enable features

To enable a feature, import the feature from the @apihive/core/features/[feature-name] and call the use() method on the factory instance.

```ts
import { HTTPRequestFactory } from '@apihive/core';
import { uploadProgressFeature } from '@apihive/core/features/upload-progress';

const factory = new HTTPRequestFactory()
    .use(uploadProgressFeature);
```

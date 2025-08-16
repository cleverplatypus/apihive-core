# Optional Features

Some less common features are available as separate modules. This enables tree-shaking for smaller bundle sizes.


Available features:

- `upload-progress`: Tracks upload progress of requests
- `download-progress`: Tracks download progress of requests
- `adapters`: enables the [adapters API](./adapters.md)
- `request-hash`: makes a `request.getHash()` method available. Useful for caching purposes. Typically activated from within an adapter.

These features can be activated on demand like this:
```ts
import feature from "@apihive/core/features/[feature-name]";

const factory = new HTTPRequestFactory()
    .use(feature);
```
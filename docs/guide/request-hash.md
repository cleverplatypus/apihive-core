# Request Hash

::: tip Optional Feature
This feature is [optional](/guide/optional-features) and must be enabled to use it.
:::

When enabled, the request.getHash() method will return a hash string that can be used to uniquely identify the request.

The hash is generated based on the request method, URL, query parameters, URL parameters, headers, and body.

It's useful for caching responses or for deduplication purposes.

## Usage

```typescript
const hash = request.getHash(options);
```

That easy.

But in real-life apps, you'll probably use a custom request interceptor or a ready made adapter like the `@apihive/adapter-simple-cache` that make use of the hash to cache responses.

### Example: Simple Cache Using Interceptors

The following example shows how to implement a rudimentary cache using request and response interceptors.
```typescript
const factory = new HTTPRequestFactory()
    .use('request-hash')
    .withRequestInterceptors(({ controls }) => {
        controls.finaliseURL();
        const hash = controls.getHash({ includeBody: true });
        const cachedResponse = cache.get(hash);
        if (cachedResponse) {
            return cachedResponse;
        }
    })
    .withResponseInterceptors(async ({ response, controls }) => {
        const hash = controls.getHash({ includeBody: true });
        try {
            const body = await response.clone().json();
            cache.set(hash, body);
            return body;
        } catch {
            // Non-JSON bodies: let default parsing handle it
            return undefined;
        }
    });

const data = await factory
    .createGETRequest('/api/data')
    .execute();

const dataAgain = await factory
    .createGETRequest('/api/data')
    .execute(); //THIS TIME IT'S FROM CACHE

```

::: info
<a href="../demos/simple-interceptors-cache/"><img src="/images/apihive-demo-button.png" alt="Demo" class="demo-button" /></a> 
<p>See it in action <a href="../demos/simple-interceptors-cache/">here</a>.</p>
:::

        


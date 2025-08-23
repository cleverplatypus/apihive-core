# Server Side Events
::: tip Optional Feature
This feature is [optional](/guide/optional-features) and must be enabled.
:::

Server Side Events (SSE) are a way to receive real-time updates from the server over HTTP (not WebSockets). They are a simple way to implement a push-based architecture.

It is a mono-directional protocol, meaning the server can only send data to the client, not the other way around. The client only initiates the connection.

The type of data that can be sent is limited to plain text or JSON.

It's very useful for implementing real-time features like in-app notifications, database synchronisation, live updates etc, without the need to poll the server or to implement WebSockets which are notoriously harder to implement.

::: tip Availability
Server Side Events are supported by most modern browsers but there are limitations when communicating with a server that doesn't support HTTP/2.
Refer to [this page](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) for details.
:::

## Quick Start

APIHive provides a thin abstraction over [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) API which is consistent with the rest of the library.

```typescript
import { HTTPRequestFactory } from '@apihive/core';
import { sseFeature } from '@apihive/core/features/sse-request';

const factory = new HTTPRequestFactory()
  .use(sseFeature);

const subscription = await factory
  .createSSERequest(`https://myserver.com/updates`)
  .withSSEListeners((data) => {
    console.log(`Here's an update: `, data);
  })
  .execute();

// later that day...
subscription.close();
```

::: info
<a href="../demos/sse-ticker/"><img src="/images/apihive-demo-button.png" alt="Demo" class="demo-button" /></a> 
<p>See <a href="../demos/sse-ticker/">here</a> for a live demo of SSE used to implement a simple update ticker.</p>
:::


## Factory Default Configuration

[EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) supports a limited set of options compared to fetch API requests. Namely, it doesn't support custom headers so `withHeaders` called on the factory won't have effect on SSE connections.

Also, because of the streaming nature of SSE, it doesn't support response interceptors. 

However [response body transformers](/guide/response-body-transformers) can still be used.

```typescript
const subscription = await factory
  .createSSERequest(`https://myserver.com/updates`)
  .withResponseBodyTransformers((data: any) => 
   toCamelCaseObject(data.content) // remove the 'envelope', normalize case
  )
  .withSSEListeners((data) => {
    console.log(`Here's the actual content: `, data);
  })
  .execute();
```
## Feature comparison

| Feature | HTTPRequest | SSERequest |
| --- | --- | --- |
| API Config | ✅ | ✅ |
| URL parameters | ✅ | ✅ |
| Query parameters | ✅ | ✅ |
| Base URL (factory) | ✅ | ✅ |
| Timeout | ✅ | ✅ |
| Request interceptors | ✅ | ✅ |
| Error interceptors | ✅ | ✅ |
| Response body transformers | ✅ | ✅ |
| Abort (AbortController) | ✅ | ✅ |
| Wrapped response/error result | ✅ | ✅ |
| SSE listeners | ❌ | ✅ |
| Progress handlers (download/upload) | ✅ | ❌ |
| Headers | ✅ | ❌ |
| Credentials policy | ✅ | ❌ |
| Response interceptors | ✅ | ❌ |
| BeforeFetch hooks | ✅ | ❌ |
| MIME type helpers (JSON/Text) | ✅ | ❌ |
| HTTP methods (POST/PUT/...) | ✅ | ❌ (GET only) |

::: info Notes
- Headers are not supported by EventSource; custom headers set on the factory won't apply to SSE connections.
- SSE timeout applies only to the initial connection attempt; it does not time out an established stream.
- Response interceptors are not supported for SSE, but response body transformers still apply to each event payload.
:::

## API Config support

It's possible to configure SSE endpoints in an API config.

```typescript
const api : APIConfig = {
  baseURL: 'https://myserver.com',
  responseBodyTransformers: (data: any, config: SSERequestConfig) => {
   if(config.api?.endpointName === 'get-updates') {
    return toCamelCaseObject(data.content);
   }
   return data;    
  },
  endpoints: {
    'get-updates' : {
      method: 'SSE',
      path: '/updates'
    }
  }
};
const factory = new HTTPRequestFactory().use(sseFeature);
const subscription = 
    await factory.createSSEAPIRequest('get-updates')
        .withSSEListeners((data) => {
            console.log(`Here's the actual content: `, data);
        })
        .execute();
```

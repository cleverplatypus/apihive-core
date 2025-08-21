# Getting Started

## Installation

:::code-group
```bash [yarn]
yarn add @apihive/core
```

```bash [npm]
npm install @apihive/core
```

```bash [jsr]
jsr add @apihive/apihive-core
```
:::

### Basic Usage

```typescript
import { HTTPRequestFactory } from '@apihive/core';

const factory = new HTTPRequestFactory(); //reusable factory instance

const response = await factory
  .createGETRequest('https://api.github.com/users/octocat')
  .withHeader('Accept', 'application/vnd.github.v3+json')
  .execute();

console.log(response.login); // 'octocat'
```

### API Configuration

::: code-group
```typescript [request-factory.ts]
import { HTTPRequestFactory } from '@apihive/core';

export default new HTTPRequestFactory()
  .withAPIConfig({
    name: 'api',
    baseURL: 'https://jsonplaceholder.typicode.com',
    headers: {
      'Authentication': (config) => config.url.includes('/admin/') && mySessionObject.isAuthenticated() ? `Bearer ${mySessionObject.getAccessToken()}` : undefined
    },
    endpoints: {
      'get-posts': {
        target: '/posts'
      },
      'post-edit': {
        target: '/admin/posts/:id',
        method: 'PUT'
      }
    }
  }, /* other APIS */);
```

```typescript [consumers.ts]
import requestFactory from './request-factory.ts';

//Execute a GET request from the API
const posts = await requestFactory.createAPIRequest('get-posts')
  .execute();

//Execute a PUT request from the API that automatically adds authentication headers
const post = await requestFactory.createAPIRequest('post-edit')
  .withJSONBody({
    title: 'foo',
    body: 'bar'
  })
  .execute();
```
:::

## Next Steps

- [Core Concepts](/guide/core-concepts) - Learn the fundamentals of APIHive
- [API Reference](/api/globals) - Complete API documentation

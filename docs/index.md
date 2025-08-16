---
layout: home

hero:
  name: "APIHive"
  image: './images/hero-image.svg'
  text: "HTTP APIs Made Easy"
  tagline: "A modern HTTP client with config-based interceptors, lazy evaluation, and extensible adapter ecosystem."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/cleverplatypus/apihive-core
    - theme: alt
      text: API Reference
      link: /api/globals

features:
  - title: 🏗️ Config-Based Architecture
    details: Minimize boilerplate code by using a config-first approach consume HTTP APIs.
  - title: ⚡ Just In Time Setup
    details: Pre-configure requests passing functions to request builders (e.g. headers, body, queryParams, etc.)
  - title: 🔌 Adapter Ecosystem
    details: Extensible plugin architecture for caching, OpenAPI integration, logging, and more. Build once, use everywhere.
  - title: 🎯 TypeScript Support
    details: Built from the ground up with TypeScript. Full type safety, excellent IntelliSense, and zero runtime surprises. Still works with plain JavaScript.
  - title: 🌐 Runtime Agnostic
    details: Works seamlessly in browsers, Node.js, Deno, and edge runtimes. One API, everywhere.
  - title: 🔄 Conditional Builder Pattern
    details: Powerful .when() API for applying interceptors and configuration conditionally based on request properties.
---

## Why APIHive?

APIHive is designed for modern TypeScript applications to reduce the amount of boilerplate code required to make HTTP requests, particularly when working with APIs.

It is built on top of the Fetch API and provides a config-first approach APIs consumption, with interceptors, lazy evaluation, and extensible adapters.

Official [adapters](adapters) are in the works to address common use cases, such as caching, retries, logging, OpenAPI integration, and more.

If you're familiar with Axios, [read here](why-not-axios.md) for a comparison with APIHive.

### Installation

::: code-group
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



## Ready for Production

- ✅ **Battle-tested** - Used in production applications
- ✅ **Zero dependencies** - Built on web standards
- ✅ **Fully typed** - 100% TypeScript coverage
- ✅ **Extensible** - Plugin architecture for any use case
- ✅ **Framework agnostic** - Works with React, Vue, Svelte, Node.js, Deno


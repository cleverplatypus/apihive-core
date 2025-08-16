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
      link: /getting-started
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

### Why not use Axios?

Axios has earned its place as a popular HTTP client in the JavaScript ecosystem. It wraps `XMLHttpRequest`, provides automatic data transformation, and offers an easy-to-use syntax. But the web has evolved. Here’s why APIHive may be the smarter choice for modern applications:

* **Built on modern standards**. APIHive leverages the native Fetch API, giving you a promise-based interface that’s built into all modern browsers and Node.js. There’s no need to ship a large third-party client when the platform already provides one. A lightweight polyfill covers the rare legacy environment, so you get the best of both worlds without extra bloat.

* **Configuration‑first design**. Define your APIs up front—base URLs, default headers, endpoint names and methods—and generate typed client calls automatically. This declarative approach keeps your request logic consistent, centralizes API definitions, and reduces boilerplate wrappers that you often need to write around Axios instances.

* **Compositional middleware**. Attach request, response and error interceptors conditionally based on API metadata. Apply transformations (e.g., unwrap nested response objects) only when they make sense. APIHive’s interceptor and transformer system is more flexible than Axios’s global interceptors, letting you compose behavior cleanly without patching global functions.

* **Pluggable adapters**. Extend the core client with authentication providers, caching layers, telemetry hooks or OpenAPI integration without hacking the core. Adapters register their own interceptors and lifecycle hooks and can be dynamically added or removed to tailor your client’s behavior. Axios has no comparable plugin architecture.

* **Deterministic request hashing**. APIHive can generate a stable hash of each request (method, URL, body, query, headers). This makes it trivial to build custom caching or request deduplication layers on top of the client, something Axios users must implement manually.

* **Clear error handling**. Fetch’s promise model encourages handling both network errors and HTTP error statuses explicitly. APIHive builds on this with error interceptors that fit into the same configuration-first model, giving you consistent error treatment across your entire API surface.

Axios still has a place if you need older browser support out of the box. For most modern web and Node.js projects, though, APIHive offers a more elegant, extensible foundation that embraces the Fetch standard and helps your team organize API logic with less code and more control.

::: details APIHive vs Axios comparison table
| Feature                          | APIHive                                      | Axios                                |
| -------------------------------- | -------------------------------------------- | ------------------------------------ |
| **Base API**                     | Fetch API                                    | XMLHttpRequest                       |
| **Installation**                 | Polyfill optional on older browsers          | Requires npm package                 |
| **Default data parsing**         | Manual `response.json()`                     | Automatic JSON parsing               |
| **Interceptors**                 | Request, response & error, conditional       | Request & response (global)          |
| **Config-first API definitions** | Yes; named endpoints & metadata              | No native support; requires wrappers |
| **Adapter/plugin system**        | Pluggable adapters (auth, caching)           | None                                 |
| **Request hashing & deduping**   | Built-in stable hash generation              | Not included                         |
| **Browser support**              | Modern browsers & Node ≥18 (polyfill for IE) | Supports older browsers like IE11    |
| **Streaming support**            | Yes (native Fetch & Node)                    | Limited                              |
| **Built-in timeout**             | Use AbortController                          | Provided option                      |

:::

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


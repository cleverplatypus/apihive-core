<p align="center">
  <a href="https://cleverplatypus.github.io/apihive-core/">
    <img src="./docs/public/images/logo.svg" alt="APIHive logo" width="120" />
  </a>
</p>

<h1 align="center">APIHive Core</h1>
<p align="center"><i>HTTP APIs made easy — a modern, TypeScript‑first HTTP client built on Fetch.</i></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@apihive/core">
    <img alt="npm version" src="https://img.shields.io/npm/v/%40apihive/core?color=cb0000&label=npm&logo=npm" />
  </a>
  <a href="https://www.npmjs.com/package/@apihive/core">
    <img alt="npm downloads" src="https://img.shields.io/npm/dm/%40apihive/core" />
  </a>
  <a href="https://github.com/cleverplatypus/apihive-core/actions/workflows/test.yml">
    <img alt="Tests" src="https://github.com/cleverplatypus/apihive-core/actions/workflows/test.yml/badge.svg?branch=master" />
  </a>
  <a href="https://vitest.dev/">
    <img alt="tested with vitest" src="https://img.shields.io/badge/tested%20with-vitest-6E9F18?logo=vitest" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" />
  </a>
  <a href="LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg" />
  </a>
  <a href="https://bundlephobia.com/package/@apihive/core">
    <img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/%40apihive%2Fcore?label=minzipped" />
  </a>
  <a href="https://cleverplatypus.github.io/apihive-core/">
    <img alt="docs" src="https://img.shields.io/badge/docs-vitepress-2ea44f" />
  </a>
</p>


APIHive is a modern, standards‑based HTTP client for TypeScript and JavaScript apps. It builds on the native Fetch API and adds a clean, config‑first architecture with interceptors, progressive features (opt‑in via a feature system), typed APIs, and an adapter ecosystem for real‑world needs.

📙 Documentation: https://cleverplatypus.github.io/apihive-core/

### Some notes on simplicity 

We're all about an uncomplicated life and we (not so) secretly despise merchants of complexity. If your app only needs to make a handful of HTTP calls, **just use the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) directly** — really.

If your application needs to grow, there is a threshold where adding a light abstraction on top of Fetch actually solves problems: organizing a whole API interface, centralizing defaults, adding interceptors, retry/backoff, progress, SSE, and more. APIHive is designed exactly for that moment.

The API is thought so that it's always clear what's going on, and it's easy to reason about. The method names are self-explanatory, and the API is designed to be easy to use and understand. `HTTPRequestFactory` is less flashy and *brand-y* than, say, `axios`, but it's clearer what it does.

## Feature highlights

- Config‑first HTTP client
  - Centralize headers, base URL, query params, and behavior at the factory/API level
  - Progressive disclosure: opt‑in only to what you need
- Interceptors and transformers
  - Request, response, error interceptors with controls (abort, replace URL/body, update headers)
  - Response body transformers for post‑processing
- Strong TypeScript story
  - Type‑safe configuration, excellent IntelliSense, and built‑in types
- Adapters ecosystem (opt‑in via features)
  - Attach adapters to add capabilities (caching, OpenAPI, logging, etc.)
- Optional features you can enable when needed
  - Retries with linear/exponential backoff and meta‑driven policy
  - Upload and download progress with throttling and fall‑through handlers
  - Deterministic request hashing for caching keys
  - Server‑Sent Events (SSE) with a dedicated request type
- Ergonomic URL and params API
  - URL templates with `{placeholders}`, query param builders, conditional building with `when()`
- Developer‑friendly extras
  - Wrapped error mode to avoid try/catch: receive `{ response?, error? }`
  - Framework‑agnostic and ESM‑first


## Installation

Using npm

```bash
npm install @apihive/core
```

Using yarn

```bash
yarn add @apihive/core
```

Using pnpm

```bash
pnpm add @apihive/core
```


## Quick start

Basic request

```ts
import { HTTPRequestFactory } from '@apihive/core';

const http = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com');

const user = await http
  .createGETRequest('/users/{id}')
  .withURLParam('id', '42')
  .withQueryParam('include', 'repos')
  .execute();
```

Fail‑fast handling without try/catch

```ts
import { HTTPRequestFactory } from '@apihive/core';

const http = new HTTPRequestFactory().withWrappedResponseError();

const { response, error } = await http
  .createGETRequest('https://httpbin.org/json')
  .execute();

if (error) {
  // deal with it early and return
}
```

Define an API interface and call endpoints by name

```ts
import { HTTPRequestFactory } from '@apihive/core';

const http = new HTTPRequestFactory().withAPIConfig({
  name: 'default',
  baseURL: 'https://api.github.com',
  headers: { 'accept': 'application/vnd.github+json' },
  endpoints: {
    getUser: { target: '/users/{username}' },
    updateUser: { target: '/user', method: 'PATCH' }
  }
});

const user = await http
  .createAPIRequest('getUser')
  .withURLParam('username', 'octocat')
  .execute();
```

Opt‑in features (retry, progress, hashing, SSE)

```ts
import { HTTPRequestFactory } from '@apihive/core';
import {
  RetryFeature,
  UploadProgressFeature,
  DownloadProgressFeature,
  RequestHashFeature,
  SSERequestFeature
} from '@apihive/core/features';

const http = new HTTPRequestFactory()
  .use(
    new RetryFeature().withDefaultAttempts(3),
    new UploadProgressFeature(),
    new DownloadProgressFeature(),
    new RequestHashFeature(),
    new SSERequestFeature()
  );

// Retry example
await http
  .createGETRequest('https://httpbin.org/status/503')
  .withRetry({ 
    attempts: 3, 
    onRetry: () => console.log('Retrying...'),
    onRetrySuccess: () => console.log('Retry successful!'),
    onRetryError: () => console.log('Retry failed!')
  })
  .execute();

// Upload progress example
await http
  .createPOSTRequest('/upload')
  .withFormDataBody(fd => fd.append('file', new File(['data'], 'demo.txt')))
  .withProgressHandlers({
    upload: ({ percentProgress, fallThrough }) => {
      console.log('Upload', percentProgress);
      fallThrough(); //lets other handlers process the progress
    }
  })
  .execute();
```


## Documentation

- Getting started, concepts, demos, and API reference: https://cleverplatypus.github.io/apihive-core/


## Contributing

Contributions are welcome! Issues and PRs are appreciated — in particular new adapters and docs improvements. See existing code and docs for patterns and conventions.


## License

MIT © 2025 Nicola Dal Pont

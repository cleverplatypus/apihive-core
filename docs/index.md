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
  - title: 🔌 Adapters Ecosystem
    details: Extensible plugin architecture for caching, OpenAPI integration, logging, and more. Build once, use everywhere.
  - title: 🎯 TypeScript Support
    details: Built from the ground up with TypeScript. Full type safety, excellent IntelliSense, and zero runtime surprises. Still works with plain JavaScript.
---

## Why APIHive?

APIHive is designed for modern TypeScript applications to reduce the amount of boilerplate code required to make HTTP requests, particularly when working with APIs.

It is built on top of the Fetch API and provides a config-first approach APIs consumption, with interceptors, lazy evaluation, and extensible adapters.

Official [adapters](adapters) are in the works to address common use cases, such as caching, retries, logging, OpenAPI integration, and more.

If you're familiar with Axios, [read here](why-not-axios.md) for a comparison with APIHive.

::: tip Impatient?
Jump to the [Getting Started](guide/getting-started.md) or [Core Concepts page](guide/core-concepts.md).
:::


## Committed to Simplicity

APIHive is built with simplicity in mind and follows progressive disclosure principles. Only expose the features you need and hide the rest. You can always opt-in later, right?

Looking ahead, the roadmap is to consolidate the core, simplify if possible and make the codebase more robust and adapted to the shifting web platform.

Any big new piece of functionality is likely to be added as an adapter, to keep the core as simple as possible. The community can help shape the APIHive ecosystem by [submitting adapters](./adapters-community/) for various use cases.

## Ready for Production

- ✅ **Battle-tested** - Used in production applications
- ✅ **Zero dependencies** - Built on web standards
- ✅ **Fully typed** - 100% TypeScript coverage
- ✅ **Extensible** - Plugin architecture for any use case
- ✅ **Framework agnostic** - Works with React, Vue, Svelte, Node.js, Deno


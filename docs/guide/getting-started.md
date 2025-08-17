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

## Basic Usage

### Simple Request
```typescript
import { HTTPRequestFactory } from '@apihive/core';

const factory = new HTTPRequestFactory();

const response = await factory
  .createGETRequest('https://jsonplaceholder.typicode.com/users/1')
  .execute();

console.log(response.name); // "Leanne Graham"
```

## Next Steps

- [Core Concepts](/guide/core-concepts) - Learn the fundamentals of APIHive
- [API Reference](/api/globals) - Complete API documentation

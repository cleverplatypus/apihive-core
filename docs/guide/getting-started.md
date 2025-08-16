# Getting Started

APIHive is a modern TypeScript-first HTTP client designed for applications that need more than basic fetch functionality but want better architecture than traditional HTTP libraries.

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
const factory = new HTTPRequestFactory();

const response = await factory
  .createGETRequest('https://jsonplaceholder.typicode.com/users/1')
  .execute();

console.log(response.name); // "Leanne Graham"
```



### POST with JSON Body
```typescript
const newUser = await factory
  .createPOSTRequest('https://jsonplaceholder.typicode.com/users')
  .withJSONBody({
    name: 'John Doe',
    email: 'john@example.com'
  })
  .withHeader('Content-Type', 'application/json')
  .execute();
```

## Core Concepts

### 1. Factory Pattern

APIHive uses a factory pattern to create requests. This allows you to configure defaults once and reuse them:

```typescript
const api = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
  .withHeader('User-Agent', 'MyApp/1.0')
  .withLogLevel('debug');

// All requests from this factory inherit the defaults
const user = await api.createGETRequest('/users/123').execute();
const posts = await api.createGETRequest('/posts').execute();
```

### 2. Method Chaining

Requests are built using fluent method chaining:

```typescript
const response = await factory
  .createPOSTRequest('/api/data')
  .withHeader('Authorization', 'Bearer token')
  .withJSONBody({ key: 'value' })
  .withTimeout(5000)
  .withMeta({ retryable: true })
  .execute();
```

### 3. Config-Based Interceptors

Unlike other HTTP clients, APIHive interceptors receive **immutable config objects** instead of mutable request instances:

```typescript
const factory = new HTTPRequestFactory()
  .withRequestInterceptors(async (config, controls) => {
    // config is immutable - no accidental mutations
    console.log('Making request to:', config.url);
    console.log('Method:', config.method);
    console.log('Headers:', config.headers);
    
    // Use controls for modifications
    if (config.url.includes('/auth/')) {
      controls.updateHeaders({ 'X-Auth-Required': 'true' });
    }
  });
```

## Advanced Features

### Conditional Configuration with `.when()`

Apply configuration conditionally based on request properties:

```typescript
const api = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
  // Only add auth header for requests that need it
  .when((config) => config.meta.requiresAuth)
  .withHeader('Authorization', (config) => `Bearer ${getToken()}`)
  .withRequestInterceptors(async (config) => {
    console.log('Authenticated request to:', config.url);
  });

// This request will include auth
const user = await api
  .createGETRequest('/user/profile')
  .withMeta({ requiresAuth: true })
  .execute();

// This request will not include auth
const publicData = await api
  .createGETRequest('/public/data')
  .execute();
```

### Dynamic Headers and Body

Use functions for values that should be evaluated at request time:

```typescript
const factory = new HTTPRequestFactory()
  .withHeader('X-Request-ID', () => crypto.randomUUID())
  .withHeader('X-Timestamp', () => new Date().toISOString())
  .withHeader('Authorization', (config) => {
    // Access to config for conditional logic
    return config.meta.apiKey ? `API-Key ${config.meta.apiKey}` : null;
  });
```

### Request Interceptors

Intercept and modify requests before they're sent:

```typescript
const factory = new HTTPRequestFactory()
  .withRequestInterceptors(
    // Logging interceptor
    async (config, controls) => {
      console.log(`[${config.method}] ${config.url}`);
    },
    
    // Auth interceptor
    async (config, controls) => {
      if (config.url.includes('/api/')) {
        const token = await getAuthToken();
        controls.updateHeaders({ Authorization: `Bearer ${token}` });
      }
    },
    
    // Cache interceptor
    async (config, controls) => {
      if (config.method === 'GET' && config.meta.cacheable) {
        const cached = await cache.get(config.url);
        if (cached) {
          return cached; // Return cached response, skip network
        }
      }
    }
  );
```

### Response Interceptors

Process responses before they reach your application code:

```typescript
const factory = new HTTPRequestFactory()
  .withResponseInterceptors(
    // Transform response
    async (response, config, controls) => {
      const data = await response.json();
      return {
        ...data,
        _requestUrl: config.url,
        _timestamp: new Date().toISOString()
      };
    },
    
    // Cache successful responses
    async (response, config, controls) => {
      if (response.ok && config.meta.cacheable) {
        const data = await response.clone().json();
        await cache.set(config.url, data, { ttl: 300 });
      }
    }
  );
```

### Error Handling

Handle errors globally with error interceptors:

```typescript
const factory = new HTTPRequestFactory()
  .withErrorInterceptors(
    // Retry on network errors
    async (error) => {
      if (error.message.includes('network') && !error.retried) {
        error.retried = true;
        await delay(1000);
        return true; // Retry the request
      }
      return false; // Don't retry
    },
    
    // Log errors
    async (error) => {
      console.error('Request failed:', error.message);
      await logError(error);
      return false;
    }
  );
```

## API Configuration

For applications with multiple APIs, use API configurations:

```typescript
const factory = new HTTPRequestFactory()
  .withAPIConfig({
    name: 'github',
    baseURL: 'https://api.github.com',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MyApp/1.0'
    },
    endpoints: {
      getUser: { target: '/users/{username}' },
      getUserRepos: { target: '/users/{username}/repos' }
    }
  })
  .withAPIConfig({
    name: 'internal',
    baseURL: process.env.API_BASE_URL,
    requestInterceptors: [
      async (config, controls) => {
        const token = await getInternalToken();
        controls.updateHeaders({ Authorization: `Bearer ${token}` });
      }
    ]
  });

// Use configured APIs
const user = await factory
  .createAPIRequest('github', 'getUser')
  .withURLParam('username', 'octocat')
  .execute();

const data = await factory
  .createAPIRequest('internal', 'getData')
  .execute();
```

## TypeScript Integration

APIHive is built with TypeScript first. Define types for your APIs:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

const factory = new HTTPRequestFactory();

// Type-safe responses
const user: User = await factory
  .createGETRequest('https://api.example.com/users/1')
  .execute();

// Type-safe request bodies
const newUser: User = await factory
  .createPOSTRequest('https://api.example.com/users')
  .withJSONBody<CreateUserRequest>({
    name: 'John Doe',
    email: 'john@example.com'
  })
  .execute();
```

## Next Steps

- [API Reference](/api/globals) - Complete API documentation
- [Adapter Guide](/adapters) - Learn about the adapter ecosystem
- [Advanced Patterns](/advanced) - Complex use cases and patterns
- [Migration Guide](/migration) - Migrating from other HTTP clients
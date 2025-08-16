# Migration Guide

Migrating to APIHive from other HTTP clients is straightforward. This guide shows you how to translate common patterns from popular HTTP libraries.

## From Axios

### Basic Request
```javascript
// Axios
const response = await axios.get('https://api.example.com/users/1');
console.log(response.data);

// APIHive
const response = await factory
  .createGETRequest('https://api.example.com/users/1')
  .execute();
console.log(response); // Direct response, no .data wrapper
```

### POST Request with JSON
```javascript
// Axios
const response = await axios.post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// APIHive
const response = await factory
  .createPOSTRequest('https://api.example.com/users')
  .withJSONBody({
    name: 'John Doe',
    email: 'john@example.com'
  })
  .execute();
```

### Global Configuration
```javascript
// Axios
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Authorization': 'Bearer token'
  }
});

// APIHive
const api = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
  .withTimeout(5000)
  .withHeader('Authorization', 'Bearer token');
```

### Interceptors
```javascript
// Axios - mutable request object
axios.interceptors.request.use(
  config => {
    config.headers.Authorization = `Bearer ${getToken()}`;
    return config; // Must return modified config
  },
  error => Promise.reject(error)
);

// APIHive - immutable config, explicit controls
const api = new HTTPRequestFactory()
  .withRequestInterceptors(async (config, controls) => {
    // config is immutable, use controls for modifications
    const token = getToken();
    controls.updateHeaders({ Authorization: `Bearer ${token}` });
    // No need to return anything for modifications
  });
```

### Response Transformation
```javascript
// Axios
axios.interceptors.response.use(
  response => {
    return {
      ...response.data,
      _timestamp: new Date().toISOString()
    };
  }
);

// APIHive
const api = new HTTPRequestFactory()
  .withResponseInterceptors(async (response, config) => {
    const data = await response.json();
    return {
      ...data,
      _timestamp: new Date().toISOString()
    };
  });
```

### Error Handling
```javascript
// Axios
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

// APIHive
const api = new HTTPRequestFactory()
  .withErrorInterceptors(async (error) => {
    if (error.status === 401) {
      // Handle unauthorized
      return true; // Handled
    }
    return false; // Not handled
  });
```

## From Fetch API

### Basic Request
```javascript
// Fetch
const response = await fetch('https://api.example.com/users/1');
const data = await response.json();

// APIHive
const data = await factory
  .createGETRequest('https://api.example.com/users/1')
  .execute(); // Auto-parses JSON response
```

### POST with JSON
```javascript
// Fetch
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
});

// APIHive
const response = await factory
  .createPOSTRequest('https://api.example.com/users')
  .withJSONBody({
    name: 'John Doe',
    email: 'john@example.com'
  })
  .execute(); // Headers and serialization handled automatically
```

### Error Handling
```javascript
// Fetch - manual error checking
const response = await fetch('https://api.example.com/users/1');
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();

// APIHive - automatic error handling
try {
  const data = await factory
    .createGETRequest('https://api.example.com/users/1')
    .execute(); // Throws on HTTP errors automatically
} catch (error) {
  console.error('Request failed:', error.message);
}
```

### Timeouts
```javascript
// Fetch - manual AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('https://api.example.com/users/1', {
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  const data = await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out');
  }
}

// APIHive - built-in timeout support
const data = await factory
  .createGETRequest('https://api.example.com/users/1')
  .withTimeout(5000)
  .execute();
```

## Key Advantages of APIHive

### 1. Immutable Configuration
**Problem with Axios/Fetch:** Mutable request objects can lead to unexpected mutations.

```javascript
// Axios - dangerous mutation
const config = { headers: {} };
axios.interceptors.request.use(req => {
  req.headers.Authorization = 'Bearer token'; // Mutates original
  return req;
});

// APIHive - immutable config prevents bugs
factory.withRequestInterceptors(async (config, controls) => {
  // config is read-only, safe from mutations
  controls.updateHeaders({ Authorization: 'Bearer token' });
});
```

### 2. Better TypeScript Support
```typescript
// Axios - runtime type issues
const response = await axios.get('/users/1');
console.log(response.data.nane); // Typo, no compile-time error

// APIHive - full type safety
interface User { name: string; email: string; }
const user: User = await factory
  .createGETRequest('/users/1')
  .execute();
console.log(user.nane); // Compile-time error caught
```

### 3. Conditional Configuration
```javascript
// Axios - complex conditional logic
const api = axios.create({
  baseURL: 'https://api.example.com'
});

api.interceptors.request.use(config => {
  if (config.url.includes('/auth/')) {
    config.headers.Authorization = `Bearer ${getToken()}`;
  }
  return config;
});

// APIHive - declarative conditional config
const api = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
  .when(config => config.url.includes('/auth/'))
  .withHeader('Authorization', () => `Bearer ${getToken()}`);
```

### 4. Lazy Evaluation
```javascript
// Axios - eager evaluation
const timestamp = new Date().toISOString(); // Evaluated immediately
const api = axios.create({
  headers: {
    'X-Timestamp': timestamp // Same timestamp for all requests
  }
});

// APIHive - lazy evaluation
const api = new HTTPRequestFactory()
  .withHeader('X-Timestamp', () => new Date().toISOString()); // Fresh timestamp per request
```

### 5. Extensible Architecture
```javascript
// Axios - limited extensibility
// Hard to add custom functionality without monkey-patching

// APIHive - adapter ecosystem
const api = new HTTPRequestFactory()
  .withAdapter(new CacheAdapter())
  .withAdapter(new RetryAdapter())
  .withAdapter(new OpenAPIAdapter());
```

## Bundle Size Comparison

| Library | Bundle Size (minified + gzipped) |
|---------|----------------------------------|
| APIHive | ~8KB                            |
| Axios   | ~13KB                           |
| Fetch   | 0KB (native)                    |

APIHive provides more features than Axios in a smaller bundle, and adds significant value over native fetch.

## Migration Checklist

### From Axios
- [ ] Replace `axios.create()` with `new HTTPRequestFactory()`
- [ ] Update interceptors to use immutable config pattern
- [ ] Remove `.data` access from responses
- [ ] Update error handling to use APIHive's error interceptors
- [ ] Replace global axios defaults with factory configuration

### From Fetch
- [ ] Replace manual fetch calls with factory methods
- [ ] Remove manual JSON parsing (handled automatically)
- [ ] Replace manual error checking with try/catch
- [ ] Replace AbortController timeouts with `.withTimeout()`
- [ ] Move repeated configuration to factory defaults

## Need Help?

- Check the [Getting Started Guide](/getting-started) for basic usage
- Browse [API Reference](/api/globals) for detailed documentation
- See [Advanced Patterns](/advanced) for complex use cases
- Join our [Discord community](https://discord.gg/apihive) for support

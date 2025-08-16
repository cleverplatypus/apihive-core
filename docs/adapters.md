# Adapter Ecosystem

One of APIHive's most powerful features is its extensible adapter architecture. Adapters allow you to add functionality like caching, authentication, logging, and API integration without modifying your application code.

## What are Adapters?

Adapters are plugins that extend APIHive's functionality through:
- **Interceptors** - Modify requests/responses at runtime
- **Factory Defaults** - Apply configuration to all requests
- **Lifecycle Hooks** - React to adapter attachment/detachment

## Built-in Adapters

### Cache Adapter
```typescript
import { CacheAdapter } from '@apihive/cache-adapter';

const factory = new HTTPRequestFactory()
  .withAdapter(new CacheAdapter({
    ttl: 300, // 5 minutes
    storage: 'memory' // or 'localStorage', 'redis'
  }));

// Cached automatically
const data = await factory
  .createGETRequest('/api/users')
  .withMeta({ cacheable: true })
  .execute();
```

### OpenAPI Adapter
```typescript
import { OpenAPIAdapter } from '@apihive/openapi-adapter';

const factory = new HTTPRequestFactory()
  .withAdapter(new OpenAPIAdapter({
    spec: 'https://api.example.com/openapi.json',
    validateRequests: true,
    validateResponses: true
  }));

// Type-safe API calls with validation
const user = await factory
  .createOpenAPIRequest('getUser', { userId: 123 })
  .execute();
```

### Retry Adapter
```typescript
import { RetryAdapter } from '@apihive/retry-adapter';

const factory = new HTTPRequestFactory()
  .withAdapter(new RetryAdapter({
    maxRetries: 3,
    backoff: 'exponential',
    retryCondition: (error) => error.status >= 500
  }));
```

### Analytics Adapter
```typescript
import { AnalyticsAdapter } from '@apihive/analytics-adapter';

const factory = new HTTPRequestFactory()
  .withAdapter(new AnalyticsAdapter({
    provider: 'mixpanel',
    apiKey: process.env.MIXPANEL_KEY,
    trackRequests: true,
    trackErrors: true
  }));
```

## Creating Custom Adapters

### Basic Adapter Structure
```typescript
import { Adapter, RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from '@apihive/core';

export class MyCustomAdapter implements Adapter {
  readonly name = 'my-custom-adapter';
  readonly priority = {
    requestInterceptor: 100,   // Lower numbers run first
    responseInterceptor: 100,
    errorInterceptor: 100
  };

  // Called when adapter is attached
  async onAttach(factory: HTTPRequestFactory) {
    console.log('Adapter attached to factory');
  }

  // Called when adapter is detached
  async onDetach(factory: HTTPRequestFactory) {
    console.log('Adapter detached from factory');
  }

  // Request interceptors run before the request is sent
  getRequestInterceptors(): RequestInterceptor[] {
    return [
      async (config, controls) => {
        console.log('Intercepting request:', config.url);
        
        // Modify headers
        controls.updateHeaders({
          'X-Custom-Header': 'CustomValue'
        });
        
        // Conditionally abort
        if (config.url.includes('blocked')) {
          controls.abort();
        }
        
        // Return response to short-circuit (skip network)
        if (config.url.includes('cached')) {
          return { cached: true, data: 'from-cache' };
        }
      }
    ];
  }

  // Response interceptors run after successful responses
  getResponseInterceptors(): ResponseInterceptor[] {
    return [
      async (response, config, controls) => {
        const data = await response.json();
        
        // Transform response
        return {
          ...data,
          _interceptedBy: 'my-custom-adapter',
          _timestamp: new Date().toISOString()
        };
      }
    ];
  }

  // Error interceptors run when requests fail
  getErrorInterceptors(): ErrorInterceptor[] {
    return [
      async (error) => {
        console.error('Request failed:', error.message);
        
        // Return true to mark error as handled
        if (error.status === 404) {
          return true; // Don't propagate 404s
        }
        
        return false; // Let other error handlers run
      }
    ];
  }

  // Factory defaults applied to all requests
  getFactoryDefaults() {
    return [
      (request: HTTPRequest) => {
        request.withHeader('X-Adapter-Applied', this.name);
      }
    ];
  }
}
```

### Real-World Example: Auth Adapter
```typescript
export class AuthAdapter implements Adapter {
  readonly name = 'auth-adapter';
  
  constructor(private options: {
    tokenProvider: () => Promise<string>;
    refreshProvider: () => Promise<string>;
    tokenHeader?: string;
  }) {}

  getRequestInterceptors(): RequestInterceptor[] {
    return [
      async (config, controls) => {
        // Skip auth for public endpoints
        if (config.meta.public) return;
        
        try {
          const token = await this.options.tokenProvider();
          const header = this.options.tokenHeader || 'Authorization';
          controls.updateHeaders({
            [header]: `Bearer ${token}`
          });
        } catch (error) {
          console.error('Failed to get auth token:', error);
          controls.abort();
        }
      }
    ];
  }

  getErrorInterceptors(): ErrorInterceptor[] {
    return [
      async (error) => {
        // Auto-refresh on 401
        if (error.status === 401) {
          try {
            await this.options.refreshProvider();
            return true; // Retry the request
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
        return false;
      }
    ];
  }
}

// Usage
const authAdapter = new AuthAdapter({
  tokenProvider: () => getAccessToken(),
  refreshProvider: () => refreshAccessToken()
});

const factory = new HTTPRequestFactory()
  .withAdapter(authAdapter);
```

### Logging Adapter
```typescript
export class LoggingAdapter implements Adapter {
  readonly name = 'logging-adapter';
  
  constructor(private logger = console) {}

  getRequestInterceptors(): RequestInterceptor[] {
    return [
      async (config, controls) => {
        const startTime = Date.now();
        config.meta._startTime = startTime;
        
        this.logger.info(`→ ${config.method} ${config.url}`, {
          headers: config.headers,
          body: config.body ? 'present' : 'none'
        });
      }
    ];
  }

  getResponseInterceptors(): ResponseInterceptor[] {
    return [
      async (response, config, controls) => {
        const duration = Date.now() - (config.meta._startTime || 0);
        
        this.logger.info(`← ${response.status} ${config.url} (${duration}ms)`, {
          status: response.status,
          contentType: response.headers.get('content-type')
        });
        
        // Don't modify the response
        return undefined;
      }
    ];
  }

  getErrorInterceptors(): ErrorInterceptor[] {
    return [
      async (error) => {
        this.logger.error(`✗ Request failed: ${error.message}`, {
          status: error.status,
          url: error.url
        });
        return false;
      }
    ];
  }
}
```

## Adapter Composition

Combine multiple adapters for powerful functionality:

```typescript
const factory = new HTTPRequestFactory()
  // Order matters - earlier adapters run first
  .withAdapter(new LoggingAdapter())           // Log all requests
  .withAdapter(new AuthAdapter(authConfig))    // Add authentication  
  .withAdapter(new RetryAdapter(retryConfig))  // Retry failed requests
  .withAdapter(new CacheAdapter(cacheConfig))  // Cache responses
  .withAdapter(new AnalyticsAdapter(analyticsConfig)); // Track usage

// All adapters work together automatically
const data = await factory
  .createGETRequest('/api/sensitive-data')
  .withMeta({ cacheable: true, retryable: true })
  .execute();
```

## Adapter Priority

Control execution order with priorities:

```typescript
export class HighPriorityAdapter implements Adapter {
  readonly name = 'high-priority';
  readonly priority = {
    requestInterceptor: 10,  // Runs early
    responseInterceptor: 10,
    errorInterceptor: 10
  };
}

export class LowPriorityAdapter implements Adapter {
  readonly name = 'low-priority';
  readonly priority = {
    requestInterceptor: 500, // Runs late
    responseInterceptor: 500,
    errorInterceptor: 500
  };
}
```

## Testing Adapters

```typescript
import { describe, it, expect, vi } from 'vitest';
import { HTTPRequestFactory } from '@apihive/core';
import { MyCustomAdapter } from './MyCustomAdapter';

describe('MyCustomAdapter', () => {
  it('should add custom header to requests', async () => {
    const factory = new HTTPRequestFactory()
      .withAdapter(new MyCustomAdapter());

    // Mock fetch to capture the request
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }))
    );
    global.fetch = mockFetch;

    await factory.createGETRequest('https://api.example.com/test').execute();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Custom-Header': 'CustomValue'
        })
      })
    );
  });

  it('should transform responses', async () => {
    const factory = new HTTPRequestFactory()
      .withAdapter(new MyCustomAdapter());

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: 'test' }))
    );

    const result = await factory
      .createGETRequest('https://api.example.com/test')
      .execute();

    expect(result).toMatchObject({
      data: 'test',
      _interceptedBy: 'my-custom-adapter',
      _timestamp: expect.any(String)
    });
  });
});
```

## Publishing Adapters

### Package Structure
```
my-adapter/
├── src/
│   ├── index.ts
│   └── MyAdapter.ts
├── package.json
├── README.md
└── tsconfig.json
```

### package.json
```json
{
  "name": "@apihive/my-adapter",
  "version": "1.0.0",
  "description": "Custom adapter for APIHive",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["apihive", "adapter", "http", "typescript"],
  "peerDependencies": {
    "@apihive/core": "^1.0.0"
  }
}
```

### Documentation
Include comprehensive documentation:
- Installation instructions
- Configuration options
- Usage examples
- TypeScript types
- Migration guides

## Best Practices

### 1. Single Responsibility
Each adapter should focus on one concern:
```typescript
// Good - focused on caching
class CacheAdapter implements Adapter { }

// Bad - doing too much
class CacheAuthLoggingAdapter implements Adapter { }
```

### 2. Configuration Validation
Validate adapter configuration:
```typescript
export class MyAdapter implements Adapter {
  constructor(private config: MyAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('MyAdapter requires apiKey in configuration');
    }
  }
}
```

### 3. Graceful Degradation
Handle failures gracefully:
```typescript
getRequestInterceptors(): RequestInterceptor[] {
  return [
    async (config, controls) => {
      try {
        await this.enhanceRequest(config, controls);
      } catch (error) {
        // Log error but don't break the request
        console.warn('Adapter enhancement failed:', error);
      }
    }
  ];
}
```

### 4. TypeScript Support
Provide full TypeScript definitions:
```typescript
export interface MyAdapterConfig {
  apiKey: string;
  timeout?: number;
  retries?: number;
}

export class MyAdapter implements Adapter {
  constructor(config: MyAdapterConfig) { }
}
```

## Official Adapter Registry

Find community adapters at:
- [APIHive Adapter Registry](https://apihive.dev/adapters)
- [npm @apihive organization](https://www.npmjs.com/org/apihive)
- [GitHub apihive-adapters topic](https://github.com/topics/apihive-adapters)

## Contributing

Want to contribute an adapter? See our [Adapter Development Guide](https://github.com/cleverplatypus/apihive-core/blob/main/ADAPTER_DEVELOPMENT.md).

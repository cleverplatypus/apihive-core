# Adapters

One of APIHive's most powerful features is its extensible adapter architecture. Adapters allow you to add functionality like caching, authentication, logging, and API integration in isolation from your application's business logic.

## What are Adapters?

Adapters are plugins that extend APIHive's functionality through:
- **Interceptors** - Modify/monitor/guard requests and responses
- **Response Body Transformers** - Transform response bodies at runtime
- **Factory Defaults** - Apply configuration to all requests
- **Lifecycle Hooks** - React to adapter attachment/detachment


::: tip Community Adapters
If you create a general purpose adapter, please share it with the community by submitting it to APIHive. Check [this page](./adapters-community) for more information where you can also find other developed adapters.
:::


## Creating Custom Adapters

### Basic Adapter Structure
```typescript
import { Adapter, RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from '@apihive/core';

export class MyCustomAdapter implements Adapter {
  readonly name = 'my-custom-adapter';
  readonly use = ['retry'];
  
  readonly priority = {
    requestInterceptor: 100,   // Lower numbers run first
    responseInterceptor: 100,
    errorInterceptor: 100,
    responseBodyTransformer: 100,
  };

  // Called when adapter is attached
  onAttach(factory: HTTPRequestFactory) {
    console.log('Adapter attached to factory');
  }

  // Called when adapter is detached
  onDetach(factory: HTTPRequestFactory) {
    console.log('Adapter detached from factory');
  }

  // Request interceptors run before the request is sent
  getRequestInterceptors(): RequestInterceptor[] {
    return [
      async ({ config, controls, factory }) => {
        // Do stuff here
      }
    ];
  }

  // Response interceptors run after successful responses
  getResponseInterceptors(): ResponseInterceptor[] {
    return [
      async ({ response, controls, config, factory }) => {
        // Do stuff here
      }
    ];
  }

  // Error interceptors run when requests fail
  getErrorInterceptors(): ErrorInterceptor[] {
    return [
      async (error) => {
        // Do stuff here
        return false; // Let other error handlers run
      }
    ];
  }

  getResponseBodyTransformers(): ResponseBodyTransformer[] {
    return [
      async ({ body, config, controls, factory }) => {
        // transform response body
        return body;
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

  //...
}

export class LowPriorityAdapter implements Adapter {
  readonly name = 'low-priority';
  readonly priority = {
    requestInterceptor: 500, // Runs late
    responseInterceptor: 500,
    errorInterceptor: 500
  };

  //...
}
```

## Testing Adapters

```typescript
import { describe, it, expect, vi } from 'vitest';
import { HTTPRequestFactory } from '@apihive/core';
import { MyCustomAdapter } from './MyCustomAdapter';

describe('MyCustomAdapter', () => {
  it('should_add_custom_header_to_requests', async () => {
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

  it('should_transform_responses', async () => {
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

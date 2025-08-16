# Advanced Patterns

This guide covers advanced patterns and real-world use cases that showcase APIHive's powerful features.

## Multi-Environment API Management

Handle different environments with conditional configuration:

```typescript
interface AppConfig {
  apiBaseUrl: string;
  authProvider: string;
  environment: 'development' | 'staging' | 'production';
}

const config: AppConfig = getAppConfig();

const factory = new HTTPRequestFactory()
  .withBaseURL(config.apiBaseUrl)
  .withLogLevel(config.environment === 'production' ? 'error' : 'debug')
  
  // Development-only debugging
  .when((reqConfig) => config.environment === 'development')
  .withRequestInterceptors(async (reqConfig, controls) => {
    console.log('🚀 DEV REQUEST:', reqConfig.method, reqConfig.url);
  })
  .withResponseInterceptors(async (response, reqConfig) => {
    console.log('📥 DEV RESPONSE:', response.status, reqConfig.url);
  })
  
  // Production-only analytics
  .when((reqConfig) => config.environment === 'production')
  .withResponseInterceptors(async (response, reqConfig) => {
    await analytics.track('api_request', {
      endpoint: reqConfig.url,
      method: reqConfig.method,
      status: response.status
    });
  });
```

## Authentication with Token Refresh

Implement automatic token refresh with retry logic:

```typescript
class TokenManager {
  private token: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  
  async getToken(): Promise<string> {
    if (this.token && !this.isTokenExpired(this.token)) {
      return this.token;
    }
    
    // Prevent concurrent refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = this.refreshToken();
    try {
      this.token = await this.refreshPromise;
      return this.token;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  private async refreshToken(): Promise<string> {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const { token } = await response.json();
    return token;
  }
  
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}

const tokenManager = new TokenManager();

const factory = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
  
  // Add auth header to protected endpoints
  .when((config) => !config.meta.public)
  .withRequestInterceptors(async (config, controls) => {
    try {
      const token = await tokenManager.getToken();
      controls.updateHeaders({ Authorization: `Bearer ${token}` });
    } catch (error) {
      console.error('Authentication failed:', error);
      // Redirect to login or handle auth failure
      window.location.href = '/login';
      controls.abort();
    }
  })
  
  // Handle auth failures with automatic retry
  .withErrorInterceptors(async (error) => {
    if (error.status === 401) {
      try {
        // Force token refresh and retry
        await tokenManager.getToken();
        return true; // Retry the request
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        window.location.href = '/login';
      }
    }
    return false;
  });

// Usage
const protectedData = await factory
  .createGETRequest('/user/profile')
  .execute(); // Auth handled automatically

const publicData = await factory
  .createGETRequest('/public/stats')
  .withMeta({ public: true })
  .execute(); // No auth needed
```

## Request Caching with TTL

Implement intelligent caching with TTL and cache invalidation:

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttl: number, etag?: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      etag
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  getETag(key: string): string | undefined {
    const entry = this.cache.get(key);
    return entry?.etag;
  }
  
  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const cache = new RequestCache();

const factory = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
  
  // Cache GET requests with ETags
  .withRequestInterceptors(async (config, controls) => {
    if (config.method === 'GET' && config.meta.cacheable) {
      const cacheKey = `${config.method}:${config.url}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached; // Return cached response
      }
      
      // Add ETag header for conditional requests
      const etag = cache.getETag(cacheKey);
      if (etag) {
        controls.updateHeaders({ 'If-None-Match': etag });
      }
    }
  })
  
  // Handle cache responses
  .withResponseInterceptors(async (response, config) => {
    if (config.method === 'GET' && config.meta.cacheable) {
      const cacheKey = `${config.method}:${config.url}`;
      
      // Handle 304 Not Modified
      if (response.status === 304) {
        const cached = cache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      // Cache successful responses
      if (response.ok) {
        const data = await response.clone().json();
        const etag = response.headers.get('etag');
        const ttl = config.meta.cacheTTL || 300000; // 5 minutes default
        
        cache.set(cacheKey, data, ttl, etag);
        return data;
      }
    }
  })
  
  // Invalidate cache on mutations
  .withResponseInterceptors(async (response, config) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method) && response.ok) {
      // Invalidate related cache entries
      const urlPattern = config.url.split('?')[0]; // Remove query params
      cache.invalidate(urlPattern);
    }
  });

// Usage
const users = await factory
  .createGETRequest('/users')
  .withMeta({ cacheable: true, cacheTTL: 600000 }) // 10 minutes
  .execute(); // Cached automatically

// This will invalidate the users cache
await factory
  .createPOSTRequest('/users')
  .withJSONBody({ name: 'New User' })
  .execute();
```

## Request Batching and Deduplication

Batch multiple requests and deduplicate identical ones:

```typescript
class RequestBatcher {
  private pendingRequests = new Map<string, Promise<any>>();
  private batchQueue: Array<{
    key: string;
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private batchTimeout: NodeJS.Timeout | null = null;
  
  constructor(
    private maxBatchSize = 10,
    private batchDelay = 50 // ms
  ) {}
  
  async execute<T>(key: string, request: () => Promise<T>): Promise<T> {
    // Check for existing identical request
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing;
    }
    
    // Create new promise for this request
    const promise = new Promise<T>((resolve, reject) => {
      this.batchQueue.push({ key, request, resolve, reject });
      
      // Schedule batch execution
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, this.batchDelay);
      }
      
      // Process immediately if batch is full
      if (this.batchQueue.length >= this.maxBatchSize) {
        this.processBatch();
      }
    });
    
    this.pendingRequests.set(key, promise);
    
    // Clean up after request completes
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
    
    return promise;
  }
  
  private async processBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    const batch = this.batchQueue.splice(0, this.maxBatchSize);
    if (batch.length === 0) return;
    
    // Execute all requests in parallel
    await Promise.allSettled(
      batch.map(async ({ request, resolve, reject }) => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      })
    );
    
    // Process remaining requests if any
    if (this.batchQueue.length > 0) {
      setTimeout(() => this.processBatch(), 0);
    }
  }
}

const batcher = new RequestBatcher();

const factory = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
  
  // Batch GET requests
  .withRequestInterceptors(async (config, controls) => {
    if (config.method === 'GET' && config.meta.batchable) {
      const requestKey = `${config.method}:${config.url}`;
      
      return batcher.execute(requestKey, async () => {
        // Perform the actual request
        const response = await fetch(config.url, {
          method: config.method,
          headers: config.headers
        });
        return response.json();
      });
    }
  });

// Usage - these requests will be batched and deduplicated
const [user1, user2, user3] = await Promise.all([
  factory.createGETRequest('/users/1').withMeta({ batchable: true }).execute(),
  factory.createGETRequest('/users/1').withMeta({ batchable: true }).execute(), // Deduplicated
  factory.createGETRequest('/users/2').withMeta({ batchable: true }).execute()
]);
```

## GraphQL Integration

Use APIHive with GraphQL APIs:

```typescript
const factory = new HTTPRequestFactory()
  .withBaseURL('https://api.github.com/graphql')
  .withHeader('Authorization', () => `Bearer ${getGitHubToken()}`)
  .withHeader('Content-Type', 'application/json')
  
  // GraphQL error handling
  .withResponseInterceptors(async (response, config) => {
    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL Error: ${data.errors.map(e => e.message).join(', ')}`);
    }
    
    return data.data; // Return just the data portion
  });

// Helper for GraphQL queries
function createGraphQLRequest(query: string, variables?: any) {
  return factory
    .createPOSTRequest('')
    .withJSONBody({
      query,
      variables
    });
}

// Usage
const query = `
  query GetRepository($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      name
      description
      stargazerCount
      forkCount
    }
  }
`;

const repository = await createGraphQLRequest(query, {
  owner: 'facebook',
  name: 'react'
}).execute();

console.log(repository.repository.stargazerCount);
```

## File Upload with Progress

Handle file uploads with progress tracking:

```typescript
const factory = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
  
  // Handle file uploads
  .withRequestInterceptors(async (config, controls) => {
    if (config.meta.uploadProgress && config.body instanceof FormData) {
      // Create a custom XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            config.meta.uploadProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
        
        xhr.open(config.method, config.url);
        
        // Set headers
        Object.entries(config.headers).forEach(([key, value]) => {
          if (key !== 'content-type') { // Let browser set content-type for FormData
            xhr.setRequestHeader(key, value as string);
          }
        });
        
        xhr.send(config.body);
      });
    }
  });

// Usage
async function uploadFile(file: File, onProgress: (progress: number) => void) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({
    originalName: file.name,
    size: file.size
  }));
  
  return factory
    .createPOSTRequest('/upload')
    .withFormDataBody((form) => {
      form.append('file', file);
      form.append('metadata', JSON.stringify({
        originalName: file.name,
        size: file.size
      }));
    })
    .withMeta({ uploadProgress: onProgress })
    .execute();
}

// Usage with progress
const result = await uploadFile(selectedFile, (progress) => {
  console.log(`Upload progress: ${progress.toFixed(1)}%`);
  updateProgressBar(progress);
});
```

## WebSocket Integration

Combine HTTP requests with WebSocket for real-time features:

```typescript
class WebSocketManager {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Function[]>();
  
  connect(url: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const listeners = this.listeners.get(data.type) || [];
      listeners.forEach(listener => listener(data));
    };
  }
  
  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }
  
  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

const wsManager = new WebSocketManager();
wsManager.connect('wss://api.example.com/ws');

const factory = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
  
  // Enable real-time updates for certain endpoints
  .withResponseInterceptors(async (response, config) => {
    if (config.meta.realtime && response.ok) {
      const data = await response.clone().json();
      
      // Subscribe to real-time updates
      wsManager.send('subscribe', {
        resource: config.meta.resource,
        id: data.id
      });
      
      return data;
    }
  });

// Usage
const document = await factory
  .createGETRequest('/documents/123')
  .withMeta({ 
    realtime: true, 
    resource: 'document' 
  })
  .execute();

// Listen for real-time updates
wsManager.on('document:update', (update) => {
  if (update.data.id === document.id) {
    console.log('Document updated:', update.data);
    // Update UI with new data
  }
});
```

## Testing Patterns

Advanced testing patterns for APIHive applications:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HTTPRequestFactory } from '@apihive/core';

describe('API Integration Tests', () => {
  let factory: HTTPRequestFactory;
  let fetchMock: any;
  
  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    
    factory = new HTTPRequestFactory()
      .withBaseURL('https://api.test.com');
  });
  
  it('should handle retry logic', async () => {
    // Mock failing then succeeding
    fetchMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    
    const retryFactory = factory
      .withErrorInterceptors(async (error) => {
        if (error.message.includes('Network') && !error.retried) {
          error.retried = true;
          return true; // Retry
        }
        return false;
      });
    
    const result = await retryFactory
      .createGETRequest('/data')
      .execute();
    
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });
  
  it('should cache responses correctly', async () => {
    const cache = new Map();
    
    const cachingFactory = factory
      .withRequestInterceptors(async (config, controls) => {
        if (config.method === 'GET') {
          const cached = cache.get(config.url);
          if (cached) {
            return cached;
          }
        }
      })
      .withResponseInterceptors(async (response, config) => {
        if (config.method === 'GET' && response.ok) {
          const data = await response.clone().json();
          cache.set(config.url, data);
          return data;
        }
      });
    
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: 'test' }))
    );
    
    // First request - hits network
    await cachingFactory.createGETRequest('/data').execute();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    // Second request - hits cache
    await cachingFactory.createGETRequest('/data').execute();
    expect(fetchMock).toHaveBeenCalledTimes(1); // Still 1
  });
});
```

These advanced patterns demonstrate APIHive's flexibility and power for real-world applications. The config-based interceptor architecture, lazy evaluation, and adapter ecosystem enable sophisticated HTTP client behavior with clean, maintainable code.

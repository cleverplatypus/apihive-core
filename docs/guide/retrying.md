# Retrying

::: tip Optional Feature
This feature is [optional](/guide/optional-features) and must be enabled to use it.
:::

APIHive provides an optional retry feature that can be enabled using the `RetryFeature` class from the `@apihive/core/features` module.

```typescript
import { HTTPRequestFactory } from '@apihive/core';
import { RetryFeature } from '@apihive/core/features';

const factory = new HTTPRequestFactory()
  .use(new RetryFeature());
```

## Configuration
One way to configure the retry feature is to use the `withRetry` method on the factory, request, or by setting the `retry` property on an `APIConfig`.

```typescript
import { HTTPRequestFactory } from '@apihive/core';
import { RetryFeature } from '@apihive/core/features';

const factory = new HTTPRequestFactory()
  .use(new RetryFeature())
  .withRetry({
    attempts: 3
```

Pretty straightforward. Every requests created by the factory that fails with a 500 status code will be retried up to 3 times with a delay of 1 second.

Optionally, you can also set more detailed configuration:

```typescript

const factory = new HTTPRequestFactory()
  .use(new RetryFeature())
  .withRetry({
    attempts: 3,
    retryDelay: 1000,
    retryCondition: (error) => error instanceof HTTPError 
      && error.status === 500
  });
```

## Default Config

It's also possible to set default retry settings on the feature instance.

```typescript
const retryFeature = new RetryFeature()
    .withDefaultAttempts(3)
    .withDefaultRetryDelay(1000)
    .withDefaultRetryCondition((error) => error instanceof HTTPError 
        && error.status === 500);
```

These defaults will be applied to all requests created by the factory in the absence of more granular configuration.

## Retry Condition

The retry condition is a function that takes an error as a parameter and returns a boolean indicating whether the request should be retried.

```typescript

const retryFeature = new RetryFeature()
    .withDefaultRetryCondition((error) => error instanceof HTTPError 
        && error.status >= 500);
```

## Dynamic Configuration

It's also possible to set retry settings on a per request basis using the builder strategy. Just pass a function to `withRetry` or on `APIConfig.retry` and the retry strategy will be evaluated just before a request is executed.

```typescript
const api : APIConfig = {
  name: 'default',
  retry: (config) => {
    if(config.api.endpointName.startsWith('user:'))
      return {
        attempts: 3
      };
  },
  endpoints: {
    //...
  }
}

```

## Meta Config
It's also possible to leverage the meta config feature to enable retries on a per endpoint basis.

```typescript
const retryFeature = new RetryFeature()
    .withMetaConfig({
        defaults: {
            attempts: 3,
            retryDelay: 1000,
            retryCondition: (error) => error instanceof HTTPError 
                && error.status === 500
        }
    });

const factory = new HTTPRequestFactory()
  .use(retryFeature)
  .withAPIConfig({
    name : 'default',
    endpoints: {
      'getItems': {
        target: '/items',
        meta: {
          retry: true
        }
      },
      'postItem': {
        target: '/items',
        method: 'POST'
      }
    }
  });

factory.createAPIRequest('getItems')
    .execute();//this will retry

factory.createAPIRequest('postItem')
    .execute();//this won't

```

::: warning Warning
Meta-based retrying will be ignored when a request has a retry policy set either directly or via `APIConfig` or the factory.
:::

### Custom meta evaluator

By default the retry feature will evaluate the `meta.retry` property to determine whether to retry a request. It's possible to provide a custom evaluator to determine whether to retry a request based on the request's meta object.

The evaluation goes hand in hand with the `normally` optional property of the `RetryMetaConfig` interface. `normally` can be either `'on'` or `'off'` and it determines the behaviour applied according to the evaluation result.

For instance with `normally: 'on'`, a `true` or `undefined` evaluation result will result in a retry, while a `false` evaluation result will result in no retry. Conversely, with `normally: 'off'`, a `false` or `undefined` evaluation result will result in no retry, while a `true` evaluation result will result in a retry.

```typescript
const retryFeature = new RetryFeature()
    .withMetaConfig({
        evaluator: (meta) => meta.retry,
        defaults: {
            attempts: 3,
            retryDelay: 1000,
            retryCondition: (error) => error instanceof HTTPError 
                && error.status === 500
        }
    })
    

const factory = new HTTPRequestFactory()
  .use(retryFeature)
  .withAPIConfig({
    name : 'default',
    endpoints: {
      'getItems': {
        target: '/items',
        meta: {
          retry: true
        }
      },
      'postItem': {
        target: '/items',
        method: 'POST'
      }
    }
  });

factory.createAPIRequest('getItems')
    .execute();//this will retry

factory.createAPIRequest('postItem')
    .execute();//this won't

```

### Cascading defaults
The retry feature can be configured with defaults that will be applied to all requests created by the factory in the absence of more granular configuration.

When using meta retry configuration, for instance, if some settings are not passed to the `default` property, they will be taken from the feature's defaults.

```typescript
const retryFeature = new RetryFeature()
    .withDefaultAttempts(5)
    .withDefaultRetryDelay(300)
    .withMetaConfig() 
```

## Backoff Strategies

The feature provides two complex backoff strategies out of the box, beyond a simple fixed delay: `exponentialBackoff` and `linearBackoff`.

::: info
You can read [this article](https://dev.to/biomousavi/understanding-jitter-backoff-a-beginners-guide-2gc) about the exponential backoff strategy for more information.
:::

They can be imported and used as follows:

```typescript
import { exponentialBackoff } from '@apihive/core/features/retry';

const retryFeature = new RetryFeature()
    .withDefaultRetryDelay(exponentialBackoff({
        initialDelay: 100,
        multiplier: 2,
        maxDelay: 30000,
        jitter: true
    }))
```

or

```typescript
import { linearBackoff } from '@apihive/core/features/retry';

const factory = new HTTPRequestFactory()
    .use(new RetryFeature())
    .withRetry({
        attempts: 3,
        retryDelay: linearBackoff(1000)
    });
```
    


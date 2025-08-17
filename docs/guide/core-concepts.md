# Core Concepts

## The Service Layer

APIHive was designed to help isolate the service layer from other business logic of web applications, particularly where the application design follows the Model-View-Controller (MVC) pattern.

The idea is to have a clear separation of concerns between the service layer and the rest of the application. This allows you to have a more maintainable and testable codebase. Changes in the way the service layer works should not affect the rest of the application.

Typically controllers in a MVC application consume services, in this case by calling endpoints on a APIHive API and modifying the application state (Models).

Controllers shouln't be aware of what the DTOs look like as they should only deal with the data as modeled by the front-end application.

That being said...

## Factory and Builder Patterns

APIHive uses a factory pattern to create requests. This allows you to configure defaults once and reuse them.

The builder pattern is used to configure both the factory and the requests. 
This allows you to build configuration in a more readable way when using the factory procedurally.

```typescript
const factory = new HTTPRequestFactory()
  .withBaseURL('https://api.example.com')
    .withHeader('User-Agent', 'MyApp/1.0')
    .withLogLevel('debug');

// All requests from this factory inherit the defaults
const posts = await factory
  .createGETRequest('/posts')
  .execute();

// Requests can have their own additional/overriding configuraton
const user = await factory
  .createGETRequest('/users-search')
  .withQueryParam('name', 'John Doe')
  .withHeader('Authorization', 'Bearer 123456789')
  .execute();
```
::: tip More Info
Conditional building is also supported. Check [this page](./conditional-building.md) for more information.
:::

## APIs

APIHive allows you to define APIs in a more declarative way. This allows you to define a group of endpoints with rules, interceptors and more.

A factory can be assigned with multiple APIs. Each API can have its own configuration and endpoints that can override the factory's configuration.

#### API configuration:

The below configuration is a simple API configuration with a default API.

- `baseURL` is used to prepend the endpoint's `target` when creating a request
- `endpoints` is a map of endpoint names to endpoint configurations
- `headers` is a map of header names to header values. Header values can be functions that receive the request config as a parameter and return a header value or `undefined` to skip the header.

> See [APIConfig type](/api/type-aliases/APIConfig.md) for full API configuration options reference.

We are configuring a conditional 'Authorization' header that will be set only if the endpoint requires authentication. We're also putting a guard to throw an error if no token is found when needed.

```typescript
const myAPI : APIConfig = {
  name: 'default',
  baseURL: 'https://api.example.com',
  headers: {
    'X-My-API-Key': '123456789',
    'Authorization': (config) => {
      if (config.meta.requiresAuth) {
        const token = myAPITokenGetter();
        if(!token) {
          throw new Error('Trying to call an API that requires authentication but no token was found');
        }
        return `Bearer ${token}`;
      }
    }
  },
  endpoints: {
    getPosts: { target: '/posts' },
    addPost: { 
      target: '/posts',
      method: 'POST',
      meta: {
        requiresAuth: true
      }
    }
  }
}
```

#### Usage:

We can now use the factory to create requests referencing the API and endpoint names.

Individual endpoint invocations can be configured with additional settings.
In this case we're removing the 'X-My-API-Key' header from the request.

> NOTE: we're calling `createAPIRequest(api, endpoint)` without an API name because we registered the API with `name: 'default'`.

```typescript
const factory = new HTTPRequestFactory()

factory.withAPIConfig(myAPI);

const posts = await factory.createAPIRequest('getPosts').execute();

const addPost = await factory.createAPIRequest('addPost')
  .withJSONBody({
    title: 'New Post',
    body: 'This is a new post'
  })
  .withHeader('X-My-API-Key', null)
  .execute();
```

APIs can be configured pretty much like the factory in a declarative way. API settings override the factory settings.

Check the guides for more information on how to use the various configuration options.

## Interceptors

Interceptors are used to intercept and modify requests and responses. This can be done at the factory, API, or request level although at the request level it doesn't make much sense and it's generally done at the factory or API level.

The use cases for interceptors include:

- Logging requests and responses
- Massaging the request/response body
- Adding request caching capabilities
- Adding mock responders during development
- Adding telemetry

::: tip More Info
See the [Interceptors Guide](./interceptors.md) for more information on interceptors.
:::

## Response Body Transformers

Body transformers operate in a similar way to response interceptors but they operate after the response body has been parsed whilst response interceptors have access to the raw FetchAPI response. This makes them more straightforward to implement and use.

They can be used to perform properties case transformations at the API level, for example  or to unwrap data from "envelope" responses.

## Adapters

Adapters can be created or imported from third-party packages to provide common scenarios integrations and request handling.

Essentially they are plug-ins that register feature delegates to the factory, such as request interceptors, response interceptors, etc.

They can be used, for instance, to perform request validation using JSONSchema from a swagger document during development or to share common request handling logic across multiple applications.

::: tip More Info
See the [Adapters Guide](./adapters.md) for more information.
:::
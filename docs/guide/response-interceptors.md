# Response Interceptors

APIHive allows you to intercept the raw fetch responses after they are received but before they're processed by the response parser or the body transformers.

They are generally used when there is a need for sneakily modifying the response body before the application code has access to it. 

Common use cases include:

- Caching, in conjunction with request interceptors
- Auditing
- Custom request parsing

## Quick Start

```typescript
const factory = new HTTPRequestFactory()
    .withBaseURL('https://myapi.com/api')
    .withResponseInterceptors(async ({ response, config }) => {
        if (config.meta.resolveEntities) {
            const body = await response.json();
            if(body.userId){
                body.user = await factory.createAPIRequest('getUser')
                    .withURLParams({ userId: body.userId })
                    .execute();
            }
            controls.replaceBody(response.body());
    });

const result = await factory
    .createAPIRequest('getPost')
    .withURLParams({ postId: 1 })
    .withMeta({ resolveEntities: true })
    .execute();

```

::: tip Note
It's often a good idea to package response interceptors into [adapters](/guide/adapters) along with request interceptors to create a cohesive and reusable unit of functionality.
:::

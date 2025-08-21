# Response Body Transformers

APIHive allows you to transform the response body after it is parsed but before it is returned to the application code.

Useful to massage the data returned by the API into a shape that is more convenient for the application code to consume, e.g. DTO to domain model.

## Usage

```typescript
const factory = new HTTPRequestFactory()
    .withBaseURL('https://api.example.com')
    .withResponseBodyTransformers(({ config, body }) => {
        return makeObjectCamelCase(body.content);
    });

const result = await factory
    .createGETRequest('/product/134')
    .execute();

```

## Usage In APIs

```typescript
const api : APIConfig = {
    name: 'default',
    baseURL: 'https://api.example.com',
    responseBodyTransformers: ({ config, body }) => {
        if(config.meta.camelize)
            return makeObjectCamelCase(body.content);
        return body.content;
    },
    endpoints: {
        'product': {
            target: '/product/{{id}}',
            method: 'GET'
        }
    }
}
const factory = new HTTPRequestFactory()
    .withAPIConfig(apiConfig);
    const result = await factory
        .createAPIRequest('product')
        .withURLParams({ id: 134 })
        .execute();
```


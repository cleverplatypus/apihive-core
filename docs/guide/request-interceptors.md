# Request Interceptors

APIHive allows you to intercept requests before they are executed. This is useful when you want to modify, mock, short-circuit or prevent the request before it is executed.

If nothing (`undefined`) is returned from the interceptor, the request will continue as normal (albeit with the modifications applied).

If a value is returned, it will be used as the response. This can be used to mock responses or short-circuit the request.



## Quick Start

```typescript
const factory = new HTTPRequestFactory()
    .withBaseURL('https://api.example.com')
    .withRequestInterceptors(({ config, controls }) => {
        if (config.meta.requiresCaptcha) {
            const body = config.body()
            body['captcha'] = myCaptchaRetrieveFn();
            controls.replaceBody(body);
        }
    });

const result = await factory
    .createPOSTRequest('/register')
    .withMeta({ requiresCaptcha: true })
    .execute();

```

## Mocking Responses

During development it's common to mock responses to avoid making real requests. APIHive allows you to mock responses using request interceptors.

In the following example we provide automatic mocking for any endpoint that has a `mockResponse` meta property.

Once the real endpoint becomes available, it's enough to remove the `mockResponse` meta property to enable the real endpoint.

::: tip Note
In the example there is also a `responseBodyTransformers` configuration to transform the response body to the format expected by the app. If your mock response is already in the format expected by the app, you can skip the `responseBodyTransformers` by calling `skipBodyTransformers()` in [controls](/api/interfaces/RequestInterceptorControls#skipbodytransformers).
:::


```typescript
const api : APIConfig = {
    baseURL: 'https://myapp.com/api',
    requestInterceptors: ({ config }) => {
        if (config.meta.mockResponse) {
            return config.meta.mockResponse;
        }
    },
    responseBodyTransformers: [
        (body, config) => {
            return makeResponseCamelCase(body);
        }        
    ],
    endpoints : {
        getProducts : {
            target : '/products',
            meta: {
                mockResponse: import('@/mock/data/products.json')
                    .then(m => m.default)
            }
        }
    }

}
const factory = new HTTPRequestFactory()
    .withAPIConfig(api);

const result = await factory
    .createAPIRequest('getProducts')
    .execute();

```

## Interceptor Controls

The request config cannot be modified directly. Instead, controls are provided via the interceptor parameter object as `params.controls`.

### abort()

Aborts the request. The request call will throw a `AbortError`.

### replaceURL(url)

Replaces the request URL template which can contain placeholders that will be replaced with the values from the request config's URL params.

### replaceURLParams(urlParams)

Replaces the request URL params.

```typescript
const requestInterceptor = ({ controls }) => {
    controls.replaceURLParams({ id: 1 });
}
```

### finaliseURL()

Finalises the request URL. After this call, the URL becomes immutable and further calls to replaceURL() will throw.
Returns the composed final URL.

### getHash()

Returns a hash string that can be used to uniquely identify the request.
It requires `finaliseURL()` to be called first. This is required to make sure that the developer knows what is going on with the request and prevent casual calls to `getHash()` without considering the implications.

### getLogger()

Returns the logger used by the factory.

### getProvisionalURL()

Returns the URL as it would be rendered at that point in time.

::: tip Note
It's often a good idea to package request interceptors into [adapters](/guide/adapters) along with response interceptors to create a cohesive and reusable unit of functionality.
:::

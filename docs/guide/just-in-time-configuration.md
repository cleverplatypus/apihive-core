# Just-in-time Configuration

Just-in-time configuration is a feature that allows you to configure requests at runtime based on conditions evaluated just before the request is executed.

It's available for:
- Headers
- Query Params
- URL Params

The utility of this feature becomes apparent when configuring these parameters at the API or factory level. 


## API JIT configuration

In this example we're declaring two just in time headers injectors
- `Authorization` header that will be set only if the endpoint requires authentication based on the endpont's URL
- `x-captcha-token` header that will be set only if the endpoint requires captcha based on the endpoint's metadata

```typescript
const api : APIConfig = {
    baseURL: 'https://myapp.com/api',
    headers: {
        'Authorization':    (config) => config.templateURL.includes('/account/') ? `Bearer ${myTokenRetrieveFn()}` : undefined,
        'x-captcha-token':  (config) => config.meta.requiresCaptcha ? myCaptchaRetrieveFn() : undefined,
    },
    queryParams: {
        'clearCache': (config) => config.meta.clearCache ? 'true' : undefined,
    },
    urlParams: {
        'departmentId': (config) => appContext.currentDepartmentId,
    },
    endpoints: {
        getMyProfile : { //will include Authorization header
            target: '/account/my-profile'
        },
        registerUser : { //will include x-captcha-token 
            target: '/register', 
            meta: { requiresCaptcha: true }, header
            method: 'POST'
        },
        login : { //won't include any headers
            target: '/login', 
            method: 'POST'
        },
        getDepartmentProducts : {//URL automatically includes departmentId
            target: '/department/{{departmentId}}/products',
            method: 'GET'
        },
        freshUpdates: { //URL will include clearCache query param
            target: '/updates',
            meta: { clearCache: true },
            method: 'GET'
        }
    }
};
```

## Factory JIT configuration

JIT injectors can be set at the factory level as well and will be applied to all requests built by the factory. If you have multiple APIs defined for the same factory, the JIT injectors will be applied to all of them.

::: tip Injectors Override
Factory's JIT injectors can be overridden at the API and then at the request level.
:::

```typescript
const factory = new HTTPRequestFactory()
    .withBaseURL('https://myapp.com/api')
    .withHeaders({
        'Authorization': (config) => 
            config.templateURL.includes('/account/')
                ? `Bearer ${myTokenRetrieveFn()}`
                : undefined,
        'x-captcha-token': (config) => 
            config.meta.requiresCaptcha
            ? myCaptchaRetrieveFn()
            : undefined
    })
    .withQueryParams({
        'clearCache': (config) => config.meta.clearCache ? 'true' : undefined,
    })
    .withURLParams({
        'departmentId': (config) => appContext.currentDepartmentId,
    });

const myProfile = await factory
    .createGETRequest('/account/my-profile')
    .execute(); //will include Authorization header
const registerUser = await factory
    .createPOSTRequest('/register')
    .execute(); //will include x-captcha-token header
const login = await factory
    .createPOSTRequest('/login')
    .execute(); //won't include any headers
const departmentProducts = await factory
    .createGETRequest('/department/{{departmentId}}/products')
    .execute(); //URL will include departmentId
const freshUpdates = await factory
    .createGETRequest('/updates')
    .execute(); //URL will include clearCache query param
```

### Single/Multiple methods

All injector methods have a single and multiple variant. The single variant accepts a single header/query/url param, while the multiple variant accepts an object with multiple headers/query/url params.

```typescript
factory.withHeader(headerName, injector)
factory.withHeaders({headerName: injector})

factory.withQueryParam(paramName, injector)
factory.withQueryParams({
    paramName1: injector1,
    paramName2: injector2
})

factory.withURLParam(paramName, injector)
factory.withURLParams({
    paramName1: injector1,
    paramName2: injector2
})
```


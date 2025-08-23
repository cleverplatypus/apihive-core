# Logging

APIHive Core uses the [LoggerFacade](https://www.npmjs.com/package/@apihive/logger-facade) interface to provide logging functionality.

By default, it uses the `ConsoleLogger` which is a simple console implementation but it's possible to interface any logger library by implementing the `LoggerFacade` or using a ready made facade like the [`@apihive/logger-facade-pino`](https://www.npmjs.com/package/@apihive/logger-facade-pino).

To enable a custom logger, use the `withLogger` method.

In the following example, we use the [pino facade](https://www.npmjs.com/package/@apihive/logger-facade-pino) to wrap an existing pino logger instance from an app.

This way the logging strategy can be shared across the app and APIHive Core.

```typescript
import PinoFacade from '@apihive/logger-facade-pino';
import myPinoLogger from './my-pino-logger';

const factory = new HTTPRequestFactory()
    .withLogger(new PinoFacade(myPinoLogger))
    .withLogLevel('debug');
```

The logger instance used by the factory is available throughout the API, such as in interceptors or adapters.

```typescript
const factory = new HTTPRequestFactory()
    .withLogger(new PinoFacade(myPinoLogger))
    .withRequestInterceptors(({ controls }) => {
        controls.getLogger()
            .info('Request created');
    });

```



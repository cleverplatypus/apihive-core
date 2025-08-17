## DEMO: Captcha Integration

This example uses HCaptcha to inject a captcha token into the request body.

Normally it only makes sense to have only one captcha per page. So, the captcha element is here encapsulated in a reusable component that sets the captcha token in a global model that is consumed by the factory's conditional building when the API request being created has the `useCaptcha` meta property set.

::: tip Note
In real life it would probably be simpler just to have the conditional captcha injector straight in a request interceptor defined right in the API config or have a reusable adapter that does the same. The purpose of this example is to show a comprehensive use of the factory capabilities.
:::

<script setup>
import CaptchaRequestDemo from './CaptchaRequestDemo.vue'
</script>

<ClientOnly>
    <CaptchaRequestDemo />
</ClientOnly>

### Code

::: code-group
<<< @/demos/captcha-requests/requestFactory.ts{11-13,24-33} [requestFactory.ts]
<<< @/demos/captcha-requests/captcha-requests-controller.ts[captcha-requests-controller.ts]
<<< @/demos/captcha-requests/CaptchaRequestDemo.vue [CaptchaRequestDemo.vue]
<<< @/demos/captcha-requests/CaptchaElement.vue [CaptchaElement.vue]
<<< @/demos/captcha-requests/captcha-model.ts [captcha-model.ts]
:::

# DEMO: Simple Cache

Here's a simple demo of how to use the request hash to cache responses.

Click the button to repeatedly call the API and see the cache in action.

You can verify in the network tab of your browser's devtools that requests after the first are not sent to the server.

Of course this is a very limited cache implementation. For a production-ready cache, you should use a ready made adapter like the [`@apihive/adapter-simple-cache`](https://npmjs.com/package/@apihive/adapter-simple-cache).

<script setup>
import SimpleInterceptorsCacheDemo from './SimpleInterceptorsCacheDemo.vue';
</script>

<ClientOnly>
<SimpleInterceptorsCacheDemo />
</ClientOnly>


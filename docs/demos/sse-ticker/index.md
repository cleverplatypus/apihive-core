## Demo: SSE Ticker

This demo shows how to use SSE to implement a simple update ticker.

It connects to wikipedia's public SSE endpoint and displays the latest 10 updates in a ticker.

<script setup>
import 'apihive-common-docs-assets/style/styles.scss';
import SSETickerDemo from './SSETickerDemo.vue';
</script>

<ClientOnly>
    <SSETickerDemo />
</ClientOnly>

## Code

::: code-group
<<< ./SSETickerDemo.vue [SSETickerDemo.vue]
<<< ./sse-ticker-controller.ts [sse-ticker-controller.ts]
<<< ./sse-ticker-model.ts [sse-ticker-model.ts]
:::
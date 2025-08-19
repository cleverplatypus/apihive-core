<template>
<div class="simple-interceptors-cache-demo demo pico">
    <div class="justify-between">
        <button @click="callService">Call API</button>
        <button class="secondary" @click="cache.clear()">Clear Cache</button>
    </div>
    <pre>{{ fetchedData }}</pre>
    <article v-if="source === 'cache'">Response from cache</article>
    <article v-if="source === 'network'">Response from network</article>
</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { HTTPRequestFactory } from "../../../src";
import requestHashFeature from "../../../src/features/request-hash";

const fetchedData = ref<any>();
const cache = new Map<string, any>();
const source = ref<'cache' | 'network' | ''>('');

const factory = new HTTPRequestFactory()
    .use(requestHashFeature)
    .withBaseURL('https://jsonplaceholder.typicode.com')
    .withRequestInterceptors( (config, controls) => {
        controls.finaliseURL();
        const hash = controls.getHash();
        const cachedBody = cache.get(hash);
        if (cachedBody !== undefined) {
            // Returning a value short-circuits the request and returns it as the response
            source.value = 'cache';
            return cachedBody;
        }
    })
    .withResponseInterceptors(async (response, config, controls) => {
        const hash = controls.getHash();
        try {
            const body = await response.clone().json();
            cache.set(hash, body);
            source.value = 'network';
        } catch {}
    });

const callService = async () => {
    fetchedData.value = await factory
        .createGETRequest('/posts/1')
        .execute();
}

</script>

<style lang="scss" scoped>
.simple-interceptors-cache-demo {
    pre {
        background-color: var(--pico-color-azure-100);
        padding: 1rem;
        margin-top: 1rem;
        &:empty {
            display: none;
        }
    }
    .justify-between {
        display: flex;
        justify-content: space-between;
    }
}
</style>
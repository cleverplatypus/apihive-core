<template>
  <div class="adapters-community-list pico">
      <h2>Official Adapters</h2>
      <AdaptersTable :adapters="officialAdapters" />
      <template v-if="communityAdapters.length > 0">
        <h2>Community Adapters</h2>
        <AdaptersTable :adapters="communityAdapters" />
      </template>
  </div>
</template>

<script setup lang="ts">
import { HTTPRequestFactory } from '../../src';
import { onMounted, reactive } from 'vue';
import { Adapter } from './types';
import AdaptersTable from './AdaptersTable.vue';

const factory = new HTTPRequestFactory().withBaseURL('https://apihive-deno-agent.cleverplatypus.deno.net/adapters');

const officialAdapters = reactive<Array<Adapter>>([]);
const communityAdapters = reactive<Array<Adapter>>([]);

onMounted(async () => {
  const allAdapters = (await factory.createGETRequest('/adapters').execute()) as Array<Adapter>;
  officialAdapters.push(...allAdapters.filter((adapter) => adapter.pkgName.startsWith('@apihive/')));
  officialAdapters.sort((a, b) => b.downloads - a.downloads);
  communityAdapters.push(...allAdapters.filter((adapter) => !adapter.pkgName.startsWith('@apihive/')));
  communityAdapters.sort((a, b) => b.downloads - a.downloads);
});
</script>

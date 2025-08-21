<template>
  <table class="adapters-table" v-if="adapters.length">
    <thead>
      <tr>
        <th>Name</th>
        <th>Description</th>
        <th>Version</th>
        <th><span data-tooltip="Downloads (npm - last month)" data-placement="left"><v-icon name="io-code-download-outline"/></span></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="adapter in adapters" :key="adapter.repo">
        <td>
          <a :href="adapter.repo">{{ adapter.name }}</a>
        </td>
        <td>{{ adapter.description }}</td>
        <td>{{ adapter.version }}</td>
        <td>{{ adapter.downloads }}</td>
      </tr>
    </tbody>
  </table>
  <progress v-else/>
</template>


<script setup lang="ts">
import { Adapter } from './types';

defineProps<{ adapters: Array<Adapter> }>();
</script>

<style lang="scss" scoped>
.adapters-table {
    tbody {
      tr {
        td:first-child {
          white-space: nowrap;
        }
      }
    }
}
</style>

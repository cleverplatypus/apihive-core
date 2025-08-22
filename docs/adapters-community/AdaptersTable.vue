<template>
  <table class="adapters-table" v-if="adapters.length">
    <thead>
      <tr>
        <th>Name</th>
        <th class="description-column">Description</th>
        <th>Version</th>
        <th>
          <span data-tooltip="Downloads (npm - last month)" data-placement="left"
            ><v-icon name="io-code-download-outline"
          /></span>
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="adapter in adapters" :key="adapter.repo">
        <tr>
          <td>
            <a :href="adapter.repo">{{ adapter.name }}</a>
          </td>
          <td class="description-column"><div v-html="md.render(adapter.description)"></div></td>
          <td>{{ adapter.version }}</td>
          <td>{{ adapter.downloads }}</td>
        </tr>
        <tr class="wrapped-description">
          <td colspan="4">
            <div v-html="md.render(adapter.description)"></div>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
  <progress v-else />
</template>

<script setup lang="ts">
import { Adapter } from './types';
import MarkdownIt from 'markdown-it';

defineProps<{ adapters: Array<Adapter> }>();

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});
</script>

<style lang="scss" scoped>
.adapters-table {
  .wrapped-description {
    > td {
      white-space: normal !important;
    }
    @media screen and (min-width: 768px) {
      display: none;
    }
  }
  .description-column {
    display: none;
    @media screen and (min-width: 768px) {
      display: table-cell;
    }
  }
  tbody {
    tr:nth-child(4n + 1),
    tr:nth-child(4n + 2) {
      td {
        background-color: transparent; // normal
      }
    }

    // next two rows of each 4-row block
    tr:nth-child(4n + 3),
    tr:nth-child(4n + 4) {
      td {
        background-color: var(--vp-c-default-soft); // alternate color
      }
    }

    tr {
      td:first-child {
        white-space: nowrap;
      }
    }
  }
}
</style>

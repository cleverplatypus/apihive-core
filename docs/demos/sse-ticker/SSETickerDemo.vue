<template>
  <article class="sse-ticker-demo pico demo">
    <div class="top-bar">
      <div class="buttons">
        <button
          v-if="
            ['disconnected', 'connecting'].includes(model.connectionState) ||
            (!model.updates.length && model.connectionState === 'connected')
          "
          :disabled="model.connectionState !== 'disconnected'"
          :aria-busy="
            model.connectionState === 'connecting' || (model.connectionState === 'connected' && !model.updates.length)
          "
          @click="controller.start"
        >
          Start Receiving Updates
        </button>
        <button v-if="model.connectionState === 'connected'" class="secondary" @click="controller.stop">Stop</button>
      </div>
      <button class="outline secondary" disabled>Status: {{ model.connectionState }}</button>
    </div>
    <InlineMessage ref="inlineMessage" />
    <template v-if="model.updates.length">
      <hr />
      <table v-if="model.updates.length" class="striped">
        <colgroup>
          <col style="width: auto" />
          <col style="width: 1%" />
        </colgroup>
        <thead>
          <tr>
            <th><span class="truncate">Title</span></th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="update in model.updates" :key="update.id">
            <td>
              <span class="truncate">{{ update.title }}</span>
            </td>
            <td>{{ update.timestamp }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import controller from './sse-ticker-controller';
import model from './sse-ticker-model';
import InlineMessage from '../common/InlineMessage.vue';

const inlineMessage = ref<typeof InlineMessage | null>(null);

controller.onDisconnect((message) => {
  inlineMessage.value!.show('error', message);
});
</script>

<style lang="scss" scoped>
@import '@/common/styles.scss';
.sse-ticker-demo {
  table {
    width: 100% !important;
    table-layout: fixed; // ensures columns respect set widths and enables truncation reliably

    // Let the first column take remaining space and allow it to shrink below content size
    th:first-child,
    td:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 0; // critical for truncation in fixed-layout tables
      min-width: 0; // allow shrinking below content size in some browsers
    }

    // Keep the timestamp column compact so the first column can take remaining space
    th:nth-child(2),
    td:nth-child(2) {
      width: 1% !important; // minimal width; content length won't expand table
      white-space: nowrap;
    }
  }
  // Helper for reliable truncation inside table cells
  .truncate {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .buttons {
      display: flex;
      gap: 0.5rem;
    }
  }
}
</style>

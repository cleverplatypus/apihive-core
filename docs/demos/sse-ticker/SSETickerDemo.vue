<template>
  <article class="sse-ticker-demo pico demo">
    <button
      v-if="['disconnected', 'connecting'].includes(model.connectionState)"
      :disabled="model.connectionState === 'connecting'"
      :aria-busy="model.connectionState === 'connecting'"
      @click="controller.start"
    >
      Start Receiving Updates
    </button>
    <button v-if="model.connectionState === 'connected'" class="secondary" @click="controller.stop">Stop</button>
    <hr />
    <div>Status: {{ model.connectionState }}</div>
    <template v-if="model.updates.length">
      <hr />
      <table class="striped">
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
import controller from './sse-ticker-controller';
import model from './sse-ticker-model';
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
  .flex-row {
    display: flex;
    justify-content: space-between;
  }
}
</style>

<template>
  <transition>
    <article
      v-show="isShowing"
      class="inline-message"
      :class="`${config.type}`"
    >
      {{ config.message }}
    </article>
  </transition>
</template>

<script setup lang="ts">
import { reactive, ref, type Reactive } from 'vue';
const show = (type: string, message: string) => {
  config.type = type;
  config.message = message;
  isShowing.value = true;
  setTimeout(() => {
    isShowing.value = false;
  }, 3000);
};

defineExpose({ show });

const isShowing = ref(false);

const config = reactive({
  type: 'info',
  message: '',
});
</script>

<style lang="scss" scoped>
.inline-message {
  padding: 0.5rem 0.75rem;

  &.info {
    background-color: var(--pico-color-azure-150);
    color: var(--pico-color-black);
  }
  &.error {
    background-color: var(--pico-color-red-450);
    color: white;
  }
  &.warn {
    background-color: var(--pico-color-pumpkin-200);
    color: var(--pico-color-black);
  }
  &.success {
    background-color: var(--pico-color-jade-50);
    color: var(--pico-color-black);
  }
}
</style>

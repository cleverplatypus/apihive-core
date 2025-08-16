<template>
    <form action.prevent class="pico">
      <div style="display: flex; gap: 1rem; justify-content: space-between; align-items: center;">
      <input
        type="file"
        ref="fileInput"
        :disabled="model.progress > -1 && model.progress < 100"
        @change="onFileChange"
      />
      <div style="display: flex; gap: 1rem;">
        <button
          type="button"
          :disabled="!model.file || (model.progress > -1 && model.progress < 100)"
          v-if="model.file"
          @click="uploadFile()"
        >
          Upload
        </button>
        <button type="button" class="secondary" v-if="!!abortUpload" @click="abortUploadAndNotify">
          Abort
        </button>
      </div>
      </div>
      <progress v-if="model.progress > -1 && model.progress < 100" :value="model.progress" max="100"></progress>
      <inline-message ref="inlineMessage"></inline-message>
      <article>Progress handler invoked {{ model.invocations }} times</article>
      <article class="pico-background-amber-50">
        <p>
          The form will POST to https://httpbin.org/anything.<br />
          🚨 <b>Do not upload anything sensitive.</b><br />
        </p>
        <p>
          Tip: if the upload happens too fast, you can throttle the upload in the browser's
          devtools.
        </p>
      </article>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import InlineMessage from '../common/InlineMessage.vue';
import controller, { Aborter } from './file-upload-controller';
import model from './file-upload-model';

const fileInput = ref<HTMLInputElement | null>(null);

const file = ref<File | null>(null);

const inlineMessage = ref<typeof InlineMessage | null>(null);

let abortUpload : Aborter | null = null;

const onFileChange = () => {
    controller.onFileChange(fileInput.value?.files?.[0]!);
}
const abortUploadAndNotify = () => {
  abortUpload!();
  inlineMessage.value!.show('warn', 'Upload aborted');
  abortUpload = null;
}

const uploadFile = () => {
  abortUpload = controller.uploadFile();
}

</script>
<style>
@import "@/common/styles.scss";
</style>

<template>
  <article class="captcha-request-demo demo pico">
    <form @submit.prevent>
      <h3>Register User</h3>
      <input type="text" v-model="controller.model.user.name" placeholder="Name" />
      <input type="email" v-model="controller.model.user.email" placeholder="Email" />
      <div class="flex-cols">
        <button :disabled="!captchaModel.token" @click="controller.registerUser">Register</button
        ><CaptchaElement />
      </div>
    </form>
    <br />
    <br />
    <InlineMessage ref="userInlineMessage" />
    <transition>
        <pre v-if="controller.model.results.registerUser">PAYLOAD: {{ controller.model.results.registerUser }}</pre>
    </transition>
    <hr />
    <div>
      <h3>Do Something Else</h3>
      <form @submit.prevent>
        <input type="text" v-model="controller.model.somethingElse.foo" placeholder="foo" />

          <button @click="controller.doSomethingElse">Do Something Else</button>
        </form>
    </div>
    <br />
    <br />
    <InlineMessage ref="somethingElseInlineMessage" />
    <transition>
        <pre v-if="controller.model.results.doSomethingElse">PAYLOAD: {{ controller.model.results.doSomethingElse }}</pre>
    </transition>
  </article>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import CaptchaElement from './CaptchaElement.vue';
import captchaModel from './captcha-model';
import controller from './captcha-requests-controller';
import InlineMessage from 'apihive-common-docs-assets/components/InlineMessage.vue';


const userInlineMessage = ref<typeof InlineMessage | null>(null);
const somethingElseInlineMessage = ref<typeof InlineMessage | null>(null);

watch(() => controller.model.results.registerUser, () => {
    if(controller.model.results.registerUser?.captcha) {
        userInlineMessage.value!.show('success', 'Yeyy! Captcha was injected');
    }
})

watch(() => controller.model.results.doSomethingElse, () => {
    if(!controller.model.results.doSomethingElse?.captcha) {
        somethingElseInlineMessage.value!.show('success', 'Yeyy! Captcha NOT injected');
    }
})

</script>

<style lang="scss" scoped>
.captcha-request-demo {
  pre {
    background-color: var(--pico-color-azure-100);
    padding: 1rem;
    &:empty {
      display: none;
    }
  }
  .flex-cols {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    justify-content: space-between;
    @media (max-width: 600px) {
      flex-direction: column;
    }
  }
}
</style>

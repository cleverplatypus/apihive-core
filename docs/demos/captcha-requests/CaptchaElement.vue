<template>
  <vue-hcaptcha 
    sitekey="11aa5322-6cfe-417c-9844-03d8657048ea" 
    @verify="onVerified"
    @expired="onExpired">
  </vue-hcaptcha>
</template>

<script setup lang="ts">
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha';
import captchaModel from './captcha-model';

const onVerified = (token: string) => {
  captchaModel.token = token;
};
const onExpired = () => {
  captchaModel.token = '';
};
</script>

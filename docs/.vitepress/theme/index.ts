// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import 'apihive-common-docs-assets/style/vp-styles.scss';
import syncPicoTheme from 'apihive-common-docs-assets/scripts/pico-vitest-theme-sync';
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { IoCodeDownloadOutline, IoCheckmark, IoClose } from "oh-vue-icons/icons/io";

addIcons(IoCodeDownloadOutline, IoCheckmark, IoClose);

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app }) {
    syncPicoTheme();
    app.component("v-icon", OhVueIcon);

  }
} satisfies Theme

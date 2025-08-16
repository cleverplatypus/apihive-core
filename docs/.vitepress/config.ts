import {
  componentPreview,
  containerPreview,
} from '@vitepress-demo-preview/plugin';
import { resolve } from 'path';
import { defineConfig } from 'vitepress';

const alias = {
  '@': resolve(__dirname, '../demos'),
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "APIHive",
  description: "HTTP APIs made easy",
  vite: {
    resolve: {
      alias,
    },
  },
   markdown: {
    config(md) {
      md.use(containerPreview, { clientOnly: true, alias });
      md.use(componentPreview, { clientOnly: true, alias });
   },
  },
  themeConfig: {
    logo: 'images/logo.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide' }
    ],
    sidebar: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Concepts', link: '/concepts' },
      { text: 'API Docs', link: '/api/globals' },
      {
        text: 'Guide',
        items: [
          { text: 'Conditional Building', link: '/guide/conditional-building' },
          { text: 'API Invocation', link: '/guide/api-invocation' },
          { text: 'API Configuration', link: '/guide/api-configuration' },
          { text: 'Progress Handlers', link: '/guide/progress-handlers' },
          { text: 'Features', link: '/guide/features' },
          { text: 'Request Interceptors', link: '/guide/request-interceptors' },
          { text: 'Response Interceptors', link: '/guide/response-interceptors' },
          { text: 'Response Body Transformers', link: '/guide/response-body-transformers' },
          { text: 'Abort Listeners', link: '/guide/abort-listeners' },
          { text: 'Adapters', link: '/guide/adapters' },
        ]
      }, {
        text: 'Demos',
        collapsed: true,
        items: [
          { text: 'File Upload', link: '/demos/file-upload' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cleverplatypus/apihive-core' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@apihive/core' }
    ]
  }
})

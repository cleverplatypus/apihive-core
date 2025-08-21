import { resolve } from 'path';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const alias = {
  '@': resolve(__dirname, '../demos'),
  // 'apihive-common-docs-assets': resolve(__dirname, '../../../apihive-common-docs-assets')
};
//http://foobar.io:5173
// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: 'APIHive',
    description: 'HTTP APIs made easy',
    base: '/apihive-core/',
    ignoreDeadLinks: true,
    vite: {
      server: {
        host: '0.0.0.0', // or specifically allow your hostname
        allowedHosts: ['foobar.io']
      },
      resolve: {
        alias
      }
    },
    themeConfig: {
      logo: 'images/logo.svg',
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Getting Started', link: '/guide/getting-started' }
      ],
      sidebar: [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Core Concepts', link: '/guide/core-concepts' },
        { text: 'API Docs', link: '/api/globals' },
        { text: 'Optional Features', link: '/guide/optional-features' },
        {
          text: 'Guide',
          collapsed: true,
          items: [
            { text: 'Conditional Building', link: '/guide/conditional-building' },
            { text: 'Just In Time Configuration', link: '/guide/just-in-time-configuration' },
            // { text: '⛔️API Invocation', link: '/guide/api-invocation' },
            // { text: '⛔️ API Configuration', link: '/guide/api-configuration' },
            // { text: '⛔️ Progress Handlers', link: '/guide/progress-handlers' },
            { text: 'Server Side Events', link: '/guide/server-side-events' },
            { text: 'Request Interceptors', link: '/guide/request-interceptors' },
            { text: 'Response Interceptors', link: '/guide/response-interceptors' },
            { text: 'Response Body Transformers', link: '/guide/response-body-transformers' },
            { text: 'Adapters', link: '/guide/adapters' },
            { text: 'Request Hash', link: '/guide/request-hash' },
            { text: 'Logging', link: '/guide/logging' },
            // { text: '⛔️ Abort Listeners', link: '/guide/abort-listeners' },
          ]
        },
        {
          text: 'Demos',
          collapsed: true,
          items: [
            { text: 'File Upload', link: '/demos/file-upload' },
            { text: 'Captcha Integration', link: '/demos/captcha-requests' },
            { text: 'SSE Ticker', link: '/demos/sse-ticker' },
            { text: 'Simple Interceptors Cache', link: '/demos/simple-interceptors-cache' }
          ]
        },
        { text: 'Community', collapsed: true, items: [{ text: 'Adapters', link: '/adapters-community' }] }
      ],

      socialLinks: [
        { icon: 'github', link: 'https://github.com/cleverplatypus/apihive-core' },
        { icon: 'npm', link: 'https://www.npmjs.com/package/@apihive/core' }
      ]
    }
  })
);

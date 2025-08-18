import { resolve } from 'path';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const alias = {
  '@': resolve(__dirname, '../demos')
};
//http://foobar.io:5173
// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: 'APIHive',
    description: 'HTTP APIs made easy',
    base: '/apihive-core/',
    ignoreDeadLinks: true,
    appearance: false,
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
        {
          text: 'Guide',
          collapsed: true,
          items: [
            { text: 'Conditional Building', link: '/guide/conditional-building' },
            { text: 'API Invocation', link: '/guide/api-invocation' },
            { text: 'API Configuration', link: '/guide/api-configuration' },
            { text: 'Progress Handlers', link: '/guide/progress-handlers' },
            { text: 'Server Side Events 🧪', link: '/guide/server-side-events' },
            { text: 'Request Interceptors', link: '/guide/request-interceptors' },
            { text: 'Response Interceptors', link: '/guide/response-interceptors' },
            { text: 'Response Body Transformers', link: '/guide/response-body-transformers' },
            { text: 'Abort Listeners', link: '/guide/abort-listeners' },
            { text: 'Adapters', link: '/guide/adapters' }
          ]
        },
        {
          text: 'Demos',
          collapsed: true,
          items: [
            { text: 'File Upload', link: '/demos/file-upload' },
            { text: 'Captcha Integration', link: '/demos/captcha-requests' }
          ]
        },
        { text: 'Community', collapsed: true, items: [{ text: 'Adapters', link: '/community-adapters' }] }
      ],

      socialLinks: [
        { icon: 'github', link: 'https://github.com/cleverplatypus/apihive-core' },
        { icon: 'npm', link: 'https://www.npmjs.com/package/@apihive/core' }
      ]
    }
  })
);

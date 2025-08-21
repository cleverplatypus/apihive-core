import { APIConfig, HTTPRequestFactory } from '../../../src';
//NOTE: you will import from @apihive/apihive-core in your own code

import captchaModel from './captcha-model';

const myAPI: APIConfig = {
  name: 'default',
  baseURL: 'https://httpbin.org',
  endpoints: {
    'register-user': {
      target: '/post',
      method: 'POST',
      meta: {
        useCaptcha: true
      }
    },
    'some-other-endpoint': {
      target: '/post',
      method: 'POST'
    }
  }
};

export default new HTTPRequestFactory()
  .withAPIConfig(myAPI)
  .when((config) => config.meta.useCaptcha)
  .withRequestInterceptors(({ controls }) => {
    controls.replaceBody((body) =>
      JSON.stringify(
        Object.assign({}, JSON.parse(body), {
          captcha: captchaModel.token //your function to retrieve the local captcha token
        })
      )
    );
  });

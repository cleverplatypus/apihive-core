import { reactive } from 'vue';
import requestFactory from './requestFactory';

type User = {
  name: string;
  email: string;
};

type CaptchaResponseModel = {
  user: User;
  somethingElse: {
    foo: string;
  };
  results: {
    registerUser: (User & { captcha: string }) | null;
    doSomethingElse: { foo: string; captcha?: string } | null;
  };
};

class CaptchaRequestsController {
  private _model = reactive<CaptchaResponseModel>({
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    somethingElse: {
      foo: 'bar'
    },
    results: {
      registerUser: null,
      doSomethingElse: null
    }
  });

  get model() {
    return this._model;
  }

  async registerUser() {
    const response = await requestFactory
        .createAPIRequest('register-user')
        .withJSONBody(this._model.user)
        .execute();
    this._model.results.registerUser = response.json;
  }

  async doSomethingElse() {
    const response = await requestFactory
      .createAPIRequest('some-other-endpoint')
      .withJSONBody(this._model.somethingElse)
      .execute();
    this._model.results.doSomethingElse = response.json;
  }
}

export default new CaptchaRequestsController();

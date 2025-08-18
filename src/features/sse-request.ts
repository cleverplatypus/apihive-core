import { HTTPRequestFactory } from "../HTTPRequestFactory.js";
import { SSERequest } from "../SSERequest.js";
import type { Feature, FeatureFactoryDelegates, FeatureName } from "../types.js";

class SSERequestFeature implements Feature {
  name: FeatureName = 'sse-request';

  getDelegates(_factory: HTTPRequestFactory): { factory?: FeatureFactoryDelegates } {
    return {
      factory: {
        createSSERequest: (url: string, { defaultConfigBuilders, factoryMethods }) => {
          const req = new SSERequest({ url, factoryMethods, defaultConfigBuilders });
          return req;
        }
      }
    }
  }
}

export default new SSERequestFeature();
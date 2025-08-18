import { HTTPRequestFactory } from "../HTTPRequestFactory.js";
import { SSERequest } from "../SSERequest.js";
import type { Feature, FeatureFactoryDelegates, FeatureName } from "../types.js";

class SSERequestFeature implements Feature {
  name: FeatureName = 'sse-request';

  getDelegates(_factory: HTTPRequestFactory): { factory?: FeatureFactoryDelegates } {
    return {
      factory: {
        createSSERequest: (url: string, { defaultConfigBuilders, wrapErrors }) => {
          return new SSERequest({ url, defaultConfigBuilders, wrapErrors });
        }
      }
    }
  }
}

export default new SSERequestFeature();
import { type APIConfig, HTTPRequestFactory, SSESubscription, WrappedSSEResponse } from '../../../src';
import sseFeature from '../../../src/features/sse-request';
import model from './sse-ticker-model';

const api: APIConfig = {
  name: 'default',
  baseURL: 'https://stream.wikimedia.org/v2/stream',
  endpoints: {
    updates: {
      method: 'SSE',
      target: '/recentchange'
    }
  }
};

class SSETickerController {
  private factory: HTTPRequestFactory;
  private subscription: SSESubscription;

  constructor() {
    this.factory = new HTTPRequestFactory()
        .use(sseFeature)
        .withWrappedResponseError()
        .withAPIConfig(api);
  }

  public async start() {
    model.connectionState = 'connecting';
    const {subscription, error} = 
        await this.factory
            .withAPIConfig(api)
            .createSSEAPIRequest('updates')
            .withSSEListeners((data) => {
                model.updates.unshift(data);
                if(model.updates.length > 10)
                    model.updates.splice(10);
            })
            // .withAbortListener(() => model.connectionState = 'disconnected')
            .execute() as WrappedSSEResponse;
    if(error) {
        model.error = error.message;
        return;
    }
    this.subscription = subscription!;
    model.connectionState = 'connected';
  }

  public stop() {
    this.subscription.close();
    model.connectionState = 'disconnected';
  }
}

export default new SSETickerController();

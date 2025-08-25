import { beforeAll, describe, expect, it } from 'vitest';
import { SSERequestFeature } from '../src/features/sse-request.ts';
import { APIConfig, HTTPRequestFactory, WrappedSSEResponse } from '../src/index.ts';

let hasEventSource = typeof (globalThis as any).EventSource === 'function';
async function ensureEventSource() {
  if (hasEventSource) return true;
  try {
    const mod = await import('eventsource');
    (globalThis as any).EventSource = (mod as any).default ?? (mod as any).EventSource;
    hasEventSource = typeof (globalThis as any).EventSource === 'function';
  } catch {}
  return hasEventSource;
}

describe('sse_feature', () => {
  beforeAll(async () => {
    await ensureEventSource();
  });

  it('connects_and_receives_multiple_events_then_closes', async () => {
    if (!hasEventSource) return;

    const factory = new HTTPRequestFactory().use(new SSERequestFeature());

    const received: any[] = [];
    let resolve;
    const enough = new Promise<void>((r) => resolve = r);
    setTimeout(() => resolve(), 5000);

    const sub = await factory
      .createSSERequest(`https://stream.wikimedia.org/v2/stream/recentchange`)
      .withSSEListeners((data) => {
        received.push(data)
        if(received.length >= 2)
          resolve();
      })
      .execute();

    await enough;

    // sub should be an SSESubscription here
    if ('error' in (sub as any)) throw new Error('Unexpected error result during live test');
    (sub as any).close();

    expect(received.length).toBeGreaterThanOrEqual(2);
    for (const ev of received) {
      expect(ev).toHaveProperty('timestamp');
      expect(ev).toHaveProperty('title');
    }
  });

  it('wraps_error_for_failed_connection', async () => {
    if (!hasEventSource) return;

    const factory = new HTTPRequestFactory()
      .use(new SSERequestFeature())
      .withWrappedResponseError();
    const result = await factory
      .createSSERequest(`https://dummy.com`)
      .execute();

    expect('error' in (result as any)).toBe(true);
    expect((result as any).error).toBeDefined();
  });

  it('wraps_response_when_connection_is_established', async () => {
    if (!hasEventSource) return;

    const factory = new HTTPRequestFactory()
      .use(new SSERequestFeature())
      .withWrappedResponseError();
    const { subscription, error } = await factory
      .createSSERequest(`https://stream.wikimedia.org/v2/stream/recentchange`)
      .execute() as WrappedSSEResponse;
    
    
    expect(subscription).toBeDefined();
    expect(error).toBeUndefined();
    expect(subscription).toHaveProperty('close');
  });

  it('applies_body_transformers_to_event_payloads', async () => {
    if (!hasEventSource) return;
    const received: any[] = [];
    let resolve: () => void;

    const api : APIConfig = {
      name: 'default',
      baseURL: 'https://stream.wikimedia.org/v2/stream',
      responseBodyTransformers: (data: any) => {
        const title = typeof data?.title === 'string' ? data.title : '';
        return { ...data, __title_length: title.length };
      },
      SSEListeners: (data: any) => {
        received.push(data);
        if (received.length >= 2) resolve!();
      },
      endpoints: {
        'get-updates' : {
          method: 'SSE',
          target: '/recentchange'
        }
      }
    };

    const factory = new HTTPRequestFactory()
      .use(new SSERequestFeature())
      .withAPIConfig(api);

    const enough = new Promise<void>((r) => (resolve = r));
    setTimeout(() => resolve!(), 5000);

    const sub = await factory
      .createSSEAPIRequest('get-updates')
      .execute();

    await enough;
    if ('error' in (sub as any)) throw new Error('Unexpected error result during live test');
    (sub as any).close();

    expect(received.length).toBeGreaterThanOrEqual(2);
    for (const ev of received) {
      expect(ev).toHaveProperty('title');
      expect(ev).toHaveProperty('__title_length');
      if (typeof ev.title === 'string') {
        expect(ev.__title_length).toBeTypeOf('number');
        expect(ev.__title_length).toBe(ev.title.length);
      }
    }
  });

  it('uses_request_interceptors_to_update_query_params_and_still_receives_events', async () => {
    if (!hasEventSource) return;

    const factory = new HTTPRequestFactory().use(new SSERequestFeature());

    let interceptorRan = false;

    const received: any[] = [];
    let resolve: () => void;
    const enough = new Promise<void>((r) => (resolve = r));
    setTimeout(() => resolve!(), 5000);
    let finalURL: string | undefined;
    const sub = await factory
      .createSSERequest(`https://stream.wikimedia.org/v2/stream/recentchange`)
      .withRequestInterceptors((config, controls) => {
        interceptorRan = true;
        // exercise the interceptor controls without changing endpoint semantics
        controls.getProvisionalURL();
        // append a harmless query param (ignored by endpoint) and finalise
        controls.updateQueryParams({ _test: '1' });
  
        finalURL = controls.finaliseURL();
        return undefined;
      })
      .withSSEListeners((data) => {
        received.push(data);
        if (received.length >= 1) resolve!();
      })
      .execute();

    await enough;
    if ('error' in (sub as any)) throw new Error('Unexpected error result during live test');
    (sub as any).close();
    expect(finalURL).toBeDefined();
    expect(interceptorRan).toBe(true);
    expect(received.length).toBeGreaterThanOrEqual(1);
    for (const ev of received) {
      expect(ev).toHaveProperty('timestamp');
    }
    expect(finalURL).toContain('_test=1');
  });
});

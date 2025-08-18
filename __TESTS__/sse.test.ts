import { beforeAll, describe, expect, it } from 'vitest';
import sseFeature from '../src/features/sse-request.ts';
import { HTTPRequestFactory, WrappedSSEResponse } from '../src/index.ts';

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

    const factory = new HTTPRequestFactory().use(sseFeature);

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
      .use(sseFeature)
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
      .use(sseFeature)
      .withWrappedResponseError();
    const { subscription, error } = await factory
      .createSSERequest(`https://stream.wikimedia.org/v2/stream/recentchange`)
      .execute() as WrappedSSEResponse;
    
    
    expect(subscription).toBeDefined();
    expect(error).toBeUndefined();
    expect(subscription).toHaveProperty('close');
  });
});

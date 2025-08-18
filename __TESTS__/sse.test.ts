import { beforeAll, describe, expect, it } from 'vitest';
import sseFeature from '../src/features/sse-request.ts';
import { HTTPRequestFactory } from '../src/index.ts';

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

    await sub.ready;

    await enough;

    sub.close();

    expect(received.length).toBeGreaterThanOrEqual(2);
    for (const ev of received) {
      expect(ev).toHaveProperty('timestamp');
      expect(ev).toHaveProperty('title');
    }
  });
});

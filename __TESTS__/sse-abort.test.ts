import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import sseFeature from '../src/features/sse-request.ts';
import { HTTPRequestFactory } from '../src/index.ts';

class FakeEventSource {
  url: string;
  listeners: Record<string, Function[]> = {};
  constructor(url: string) {
    this.url = url;
    // do not auto-open; we want to rely on timeout-driven abort
  }
  addEventListener(type: string, fn: Function) {
    (this.listeners[type] ||= []).push(fn);
  }
  removeEventListener(type: string, fn: Function) {
    const arr = this.listeners[type] || [];
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  }
  close() {
    // noop
  }
}

describe('sse_abort_behavior', () => {
  let originalES: any;

  beforeEach(() => {
    originalES = (globalThis as any).EventSource;
    (globalThis as any).EventSource = FakeEventSource as any;
  });

  afterEach(() => {
    (globalThis as any).EventSource = originalES;
  });

  it('aborts_via_timeout_and_triggers_error_interceptor_neg1', async () => {
    const factory = new HTTPRequestFactory().use(sseFeature);

    let intercepted = false;

    const sse = factory
      .createSSERequest('/stream')
      .withTimeout(10)
      .withErrorInterceptors((err) => {
        intercepted = err.code === -1;
        return false;
      });

    const sub = await sse.execute();

    // Wait enough time for timeout to fire and abort listeners to run
    await new Promise((r) => setTimeout(r, 30));

    // Cleanup
    sub.close();

    expect(intercepted).toBe(true);
  });
});

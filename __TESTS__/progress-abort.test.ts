import { describe, it, expect, vi } from 'vitest';
import { HTTPRequestFactory } from '../src/HTTPRequestFactory.js';
import { DownloadProgressFeature } from '../src/features/download-progress.ts';
const downloadProgressFeature = new DownloadProgressFeature();

describe('progress_handlers_download_abort_behavior', () => {
  it('aborts_mid_download_due_to_timeout_and_rejects_with_httperror_neg1', async () => {
    const originalFetch = globalThis.fetch;

    const body = new TextEncoder().encode('x'.repeat(512 * 1024)); // 512KB total
    const chunkSize = 64 * 1024; // 64KB
    const first = body.subarray(0, chunkSize);

    // Create a custom Response-like object with a getReader()
    let cancelCalled = false;
    let resolveWait: (() => void) | null = null;
    const waitForCancel = () =>
      new Promise<void>((resolve) => {
        resolveWait = resolve;
      });

    const reader = {
      firstReadDone: false,
      async read() {
        if (!this.firstReadDone) {
          this.firstReadDone = true;
          return { done: false, value: first };
        }
        // hang until cancel is called
        if (!cancelCalled) {
          await waitForCancel();
        }
        // after cancel, simulate AbortError from the stream
        const err = new Error('Aborted');
        // @ts-ignore
        err.name = 'AbortError';
        throw err;
      },
      cancel() {
        cancelCalled = true;
        if (resolveWait) resolveWait();
      },
    };

    const resp: any = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/octet-stream',
        'content-length': String(body.length),
      }),
      body: { getReader: () => reader },
      blob: async () => new Blob([body], { type: 'application/octet-stream' }),
    };

    // Mock fetch to return the custom response
    globalThis.fetch = vi.fn(async () => resp);

    const factory = new HTTPRequestFactory()
      .use(downloadProgressFeature);

    const calls: Array<{ percent: number; loaded: number; total?: number }> = [];

    const req = factory
      .createGETRequest('https://example.test/slow')
      .withProgressHandlers({
        download: (info) => {
          calls.push({
            percent: info.percentProgress,
            loaded: info.loadedBytes,
            total: info.totalBytes,
          });
          info.fallThrough();
        },
        throttleMs: 0,
      } as any);
    req.withTimeout(2000); // keep long to avoid timeout path; we'll abort via interceptor
    req.withRequestInterceptors(async ({controls : {abort}}) => {
      setTimeout(() => abort(), 20);
      return undefined;
    });

    let intercepted = false;
    req.withErrorInterceptors((err) => {
      intercepted = err.code === -1;
      return false; // don't consume
    });
    try {
      await req.execute();
    } catch {
      // ignore; we assert via interceptor flag below
    } finally {
      globalThis.fetch = originalFetch;
    }

    // Interceptor should have seen HTTPError(-1) from abort
    expect(intercepted).toBe(true);

    // We should have seen at least the initial 0% progress before abort
    expect(calls.length).toBeGreaterThanOrEqual(1);
    // There should be no guaranteed 100% since we aborted
    const reached100 = calls.some((c) => c.percent === 100);
    expect(reached100).toBe(false);
  });

  it('aborts_via_timeout_no_manual_abort_and_triggers_error_interceptor_neg1', async () => {
    const originalFetch = globalThis.fetch;

    const body = new TextEncoder().encode('x'.repeat(512 * 1024)); // 512KB total
    const chunkSize = 64 * 1024; // 64KB
    const first = body.subarray(0, chunkSize);

    // Custom response with getReader(): one chunk then hang until cancel
    let cancelCalled = false;
    let resolveWait: (() => void) | null = null;
    const waitForCancel = () =>
      new Promise<void>((resolve) => {
        resolveWait = resolve;
      });

    const reader = {
      firstReadDone: false,
      async read() {
        if (!this.firstReadDone) {
          this.firstReadDone = true;
          return { done: false, value: first };
        }
        if (!cancelCalled) {
          await waitForCancel();
        }
        const err = new Error('Aborted');
        // @ts-ignore
        err.name = 'AbortError';
        throw err;
      },
      cancel() {
        cancelCalled = true;
        if (resolveWait) resolveWait();
      },
    };

    const resp: any = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/octet-stream',
        'content-length': String(body.length),
      }),
      body: { getReader: () => reader },
      blob: async () => new Blob([body], { type: 'application/octet-stream' }),
    };

    globalThis.fetch = vi.fn(async () => resp);

    const factory = new HTTPRequestFactory()
      .use(downloadProgressFeature);
    const calls: Array<{ percent: number; loaded: number; total?: number }> = [];
    const req = factory
      .createGETRequest('https://example.test/timeout')
      .withProgressHandlers({
        download: (info) => {
          calls.push({
            percent: info.percentProgress,
            loaded: info.loadedBytes,
            total: info.totalBytes,
          });
          info.fallThrough();
        },
        throttleMs: 0,
      } as any);

    // Use a short timeout to trigger abort
    req.withTimeout(50);

    let intercepted = false;
    req.withErrorInterceptors((err) => {
      intercepted = err.code === -1;
      return false;
    });

    try {
      await req.execute();
    } catch {
      // ignored; we assert via interceptor
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(intercepted).toBe(true);
    expect(calls.length).toBeGreaterThanOrEqual(1);
    const reached100 = calls.some((c) => c.percent === 100);
    expect(reached100).toBe(false);
  });
});

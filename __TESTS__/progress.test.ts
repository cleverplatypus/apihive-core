import { describe, expect, it, vi } from 'vitest';
import downloadProgressFeature from '../src/features/download-progress.ts';
import { HTTPRequestFactory } from '../src/index.ts';
import type { FeatureName } from '../src/types.ts';

// Helper to build a ReadableStream of Uint8Array chunks
function makeStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });

describe('progress_handlers', () => {
  it('streams_without_content_length_emits_initial_0_and_final_100_with_total_undefined', async () => {
    const originalFetch = globalThis.fetch;
    try {
      const body = new TextEncoder().encode('x'.repeat(128 * 1024));
      const chunkSize = 32 * 1024;
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < body.length; i += chunkSize) {
        chunks.push(body.subarray(i, Math.min(i + chunkSize, body.length)));
      }
      let idx = 0;
      const reader = {
        async read() {
          if (idx < chunks.length) {
            const v = chunks[idx++];
            return { done: false, value: v };
          }
          return { done: true, value: undefined } as any;
        },
        cancel() {},
      };
      const resp: any = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/octet-stream' }), // no content-length
        body: { getReader: () => reader },
        blob: async () => new Blob([body], { type: 'application/octet-stream' }),
      };
      globalThis.fetch = vi.fn(async () => resp);

      const factory = new HTTPRequestFactory();
      const calls: Array<{ percent: number; loaded: number; total?: number }> = [];
      const result = await factory
        .use(downloadProgressFeature)
        .createGETRequest('https://example.test/noclen')
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
        } as any)
        .execute();

      expect(result).toBeInstanceOf(Blob);
      expect(calls.length).toBeGreaterThanOrEqual(2);
      expect(calls[0].percent).toBe(0);
      expect(calls[calls.length - 1].percent).toBe(100);
      // totalBytes is undefined without content-length
      expect(calls.some(c => c.total === undefined)).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('json_text_responses_do_not_emit_progress_and_parse_correctly', async () => {
    const originalFetch = globalThis.fetch;
    try {
      // JSON
      const jsonResp = new Response(JSON.stringify({ a: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
      // Text
      const textResp = new Response('hello', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });

      const calls: Array<'json' | 'text'> = [];
      let toggle = false;
      globalThis.fetch = vi.fn(async () => {
        toggle = !toggle;
        return toggle ? jsonResp : textResp;
      });

      const factory = new HTTPRequestFactory();
      const progressCalls: any[] = [];

      const r1 = await factory
        .createGETRequest('https://example.test/json')
        .withProgressHandlers({
          download: (info) => {
            progressCalls.push(info);
            info.fallThrough();
          },
        } as any)
        .execute();
      calls.push('json');

      const r2 = await factory
        .createGETRequest('https://example.test/text')
        .withProgressHandlers({
          download: (info) => {
            progressCalls.push(info);
            info.fallThrough();
          },
        } as any)
        .execute();
      calls.push('text');

      expect(r1).toEqual({ a: 1 });
      expect(r2).toEqual('hello');
      // No progress should be reported for json/text paths
      expect(progressCalls.length).toBe(0);
      expect(calls).toEqual(['json', 'text']);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('throttling_reduces_progress_emission_frequency', async () => {
    const originalFetch = globalThis.fetch;
    try {
      const total = 256 * 1024;
      const chunk = new Uint8Array(4 * 1024); // 4KB
      const chunks = Array.from({ length: 64 }, () => chunk);
      let i = 0;
      const reader = {
        async read() {
          if (i < chunks.length) {
            const v = chunks[i++];
            return { done: false, value: v };
          }
          return { done: true, value: undefined } as any;
        },
        cancel() {},
      };
      const resp: any = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/octet-stream',
          'content-length': String(total),
        }),
        body: { getReader: () => reader },
        blob: async () => new Blob([new Uint8Array(total)], { type: 'application/octet-stream' }),
      };
      globalThis.fetch = vi.fn(async () => resp);

      const factory = new HTTPRequestFactory();
      const calls: number[] = [];
      await factory
        .createGETRequest('https://example.test/throttle')
        .withProgressHandlers({
          download: (info) => {
            calls.push(info.loadedBytes);
            info.fallThrough();
          },
          throttleMs: 50,
        } as any)
        .execute();

      // Initial + a few throttled + final
      expect(calls.length).toBeGreaterThanOrEqual(2);
      // Should be far less than chunk count due to throttle
      expect(calls.length).toBeLessThan(chunks.length);
      // Final 100% reached
      // loadedBytes should equal total at the end
      expect(calls[calls.length - 1]).toBe(total);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
}

describe('progress_handlers_download', () => {
  it('dispatches_download_progress_with_fall_through_and_returns_blob', async () => {
    const factory = new HTTPRequestFactory()
      .use(downloadProgressFeature);

    // Prepare chunks totalling a known size
    const chunk1 = new Uint8Array([1, 2, 3, 4, 5]); // 5 bytes
    const chunk2 = new Uint8Array([6, 7, 8]);       // 3 bytes
    const total = chunk1.byteLength + chunk2.byteLength; // 8 bytes

    // Mock fetchImpl to return a streaming octet-stream response
    const mockFetch = async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
      const body = makeStream([chunk1, chunk2]);
      return new Response(body, {
        headers: {
          'content-type': 'application/octet-stream',
          'content-length': String(total),
        },
        status: 200,
      });
    };

    const calls1: Array<{ percent: number; loaded: number; total?: number }> = [];
    const calls2: Array<{ percent: number; loaded: number; total?: number }> = [];

    const h1 = {
      download: (info) => {
        calls1.push({ percent: info.percentProgress, loaded: info.loadedBytes, total: info.totalBytes });
        // allow next handler to run
        info.fallThrough();
      },
      throttleMs: 0,
    };

    const h2 = {
      download: (info) => {
        calls2.push({ percent: info.percentProgress, loaded: info.loadedBytes, total: info.totalBytes });
      },
      throttleMs: 0,
    };

    const result = await factory
      .use({
        name : 'mock-fetch-feature' as FeatureName,
        getDelegates: (_factory : HTTPRequestFactory) => ({
          request : {
            getFetchImpl: () => mockFetch
          }
        })
      })
      .createGETRequest('https://example.com/download.bin')
      .withProgressHandlers(h1, h2)
      .execute();

    // Result should be a Blob with expected size and type
    expect(result).toBeInstanceOf(Blob);
    const blob: Blob = result as Blob;
    expect(blob.size).toBe(total);
    expect(blob.type).toBe('application/octet-stream');

    // Both handlers should have been called (fall-through from h1)
    expect(calls1.length).toBeGreaterThan(0);
    expect(calls2.length).toBeGreaterThan(0);

    // First call should be initial 0%
    expect(calls1[0].percent).toBe(0);
    expect(calls1[0].loaded).toBe(0);
    expect(calls1[0].total).toBe(total);

    // Last call should be 100%
    expect(calls1[calls1.length - 1].percent).toBe(100);
    expect(calls2[calls2.length - 1].percent).toBe(100);

    // Intermediate progress should reach at least after first chunk
    const foundAfterFirst = calls1.some((c) => c.loaded >= chunk1.byteLength && c.loaded < total);
    expect(foundAfterFirst).toBe(true);
  });

  it('actually_downloads_the_public_128kb_jpg_emits_progress_and_returns_a_blob', async () => {
    const factory = new HTTPRequestFactory()
      .use(downloadProgressFeature);

    const url =
      'https://freetestdata.com/wp-content/uploads/2022/02/Free_Test_Data_1MB_JPG.jpg';

    const calls: Array<{ percent: number; loaded: number; total?: number }> = [];

    const result = await factory
      .createGETRequest(url)
      .withProgressHandlers({
        download: (info) => {
          calls.push({ percent: info.percentProgress, loaded: info.loadedBytes, total: info.totalBytes });
          // Let lower-priority handlers (if any) run too
          info.fallThrough();
        },
        throttleMs: 0,
      })
      .execute();

    expect(result).toBeInstanceOf(Blob);
    const blob: Blob = result as Blob;
    // 128KB nominal; allow tolerance for server variations
    expect(blob.size).toBeGreaterThan(100_000);
    // Type often image/jpeg (may be empty if server omits); only assert if present
    if (blob.type) {
      expect(blob.type.includes('image/')).toBe(true);
    }

    // Progress should have been emitted
    expect(calls.length).toBeGreaterThan(0);
    // Should start at 0% (if content-length present) and end at 100%
    expect(calls[calls.length - 1].percent).toBe(100);
  });
});

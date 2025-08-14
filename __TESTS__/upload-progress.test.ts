import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HTTPRequestFactory } from '../src/HTTPRequestFactory';
import uploadProgressFeature from '../src/features/upload-progress';

type ProgressEventInitLite = {
  loaded: number;
  total?: number;
  lengthComputable?: boolean;
};

// A minimal XHR mock that triggers upload onprogress events, then resolves onload
class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = [];
  static progressSequence: ProgressEventInitLite[] = [];
  static responseStatus = 200;
  static responseStatusText = 'OK';
  static responseHeaders: Record<string, string> = { 'content-type': 'text/plain' };
  static responseBody: Uint8Array = new Uint8Array();

  upload: { onprogress: ((e: any) => void) | null } = { onprogress: null };
  response: ArrayBuffer | null = null;
  status = 0;
  statusText = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  _headers: Record<string, string> = {};

  constructor() {
    MockXMLHttpRequest.instances.push(this);
  }

  open(_method: string, _url: string) {}
  setRequestHeader(k: string, v: string) { this._headers[k.toLowerCase()] = v; }
  getAllResponseHeaders() {
    return Object.entries(MockXMLHttpRequest.responseHeaders)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\r\n');
  }
  abort() {}
  send(_body?: any) {
    // Emit configured progress events synchronously
    for (const p of MockXMLHttpRequest.progressSequence) {
      this.upload.onprogress?.({
        loaded: p.loaded,
        total: p.total,
        lengthComputable: p.lengthComputable ?? (p.total != null),
      } as any);
    }
    // Complete
    this.status = MockXMLHttpRequest.responseStatus;
    this.statusText = MockXMLHttpRequest.responseStatusText;
    this.response = MockXMLHttpRequest.responseBody.buffer;
    this.onload?.();
  }
  set responseType(_v: string) {}
}

describe('upload-progress feature', () => {
  const OriginalXHR = (globalThis as any).XMLHttpRequest;

  beforeEach(() => {
    (globalThis as any).XMLHttpRequest = MockXMLHttpRequest as any;
    MockXMLHttpRequest.instances = [];
    MockXMLHttpRequest.progressSequence = [];
    MockXMLHttpRequest.responseStatus = 200;
    MockXMLHttpRequest.responseStatusText = 'OK';
    MockXMLHttpRequest.responseHeaders = { 'content-type': 'text/plain' };
    MockXMLHttpRequest.responseBody = new Uint8Array([1,2,3]);
  });

  afterEach(() => {
    (globalThis as any).XMLHttpRequest = OriginalXHR;
  });

  it('emits upload progress and does not propagate to further handlers when handler does not fallThrough', async () => {
    const calls: any[] = [];
    const factory = new HTTPRequestFactory().use(uploadProgressFeature).withProgressHandlers({
      upload: (info) => {
        calls.push({ percent: info.percentProgress, loaded: info.loadedBytes, total: info.totalBytes });
        // no fallThrough
      }
    });

    MockXMLHttpRequest.progressSequence = [
      { loaded: 10, total: 100 },
      { loaded: 50, total: 100 },
      { loaded: 100, total: 100 },
    ];

    const req = factory.createRequest('https://example.com/upload', 'POST');
    await req.execute();
    // With a single handler, not calling fallThrough only prevents propagation to subsequent handlers,
    // it does NOT stop future progress events for the same handler.
    expect(calls.length).toBe(3);
    expect(calls).toEqual([
      { percent: 10, loaded: 10, total: 100 },
      { percent: 50, loaded: 50, total: 100 },
      { percent: 100, loaded: 100, total: 100 },
    ]);
  });

  it('falls through to next handler when fallThrough() is called', async () => {
    const calls1: number[] = [];
    const calls2: number[] = [];
    const factory = new HTTPRequestFactory()
      .use(uploadProgressFeature)
      .withProgressHandlers(
        {
          upload: (info) => { calls1.push(info.percentProgress); info.fallThrough(); }
        },
        {
          upload: (info) => { calls2.push(info.percentProgress); }
        }
      );

    MockXMLHttpRequest.progressSequence = [
      { loaded: 20, total: 80 }, // 25%
      { loaded: 80, total: 80 }, // 100%
    ];

    const req = factory.createRequest('https://example.com/upload', 'POST');
    await req.execute();

    expect(calls1).toEqual([25, 100]);
    expect(calls2).toEqual([25, 100]);
  });

  it('respects throttleMs on handlers but always emits final 100%', async () => {
    const calls: number[] = [];
    const factory = new HTTPRequestFactory()
      .use(uploadProgressFeature)
      .withProgressHandlers({
        throttleMs: 1000,
        upload: (info) => { calls.push(info.percentProgress); }
      });

    // Multiple quick events should throttle to one emission
    MockXMLHttpRequest.progressSequence = [
      { loaded: 1, total: 4 },
      { loaded: 2, total: 4 },
      { loaded: 3, total: 4 },
      { loaded: 4, total: 4 },
    ];

    const req = factory.createRequest('https://example.com/upload', 'POST');
    await req.execute();

    // Throttling should allow the first emission and the final 100% emission
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe(25);
    expect(calls[1]).toBe(100);
  });
});


import { Feature, FetchLike, RequestConfig } from "../types.js";
import { HTTPRequestFactory } from "../HTTPRequestFactory.js";

function createXhrFetchFacade(config: RequestConfig, factory: HTTPRequestFactory): FetchLike {
  const uploadHandlers = (config.progressHandlers || []).filter(h => h.upload);
  // If no upload handlers, fall back to fetch
  if (uploadHandlers.length === 0) return (url, init) => globalThis.fetch(url, init);

  return function (url: string, init: RequestInit): Promise<Response> {
    if (typeof XMLHttpRequest === "undefined") {
      // Non-browser env: gracefully fall back
      factory.logger.warn("Upload progress feature requires XMLHttpRequest");
      return globalThis.fetch(url, init);
    }

    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open((init?.method as string) || "GET", url, true);
      xhr.responseType = "arraybuffer";

      // Set headers
      if (init?.headers) {
        const headers = init.headers as any;
        if (headers instanceof Headers) {
          headers.forEach((value: string, key: string) => xhr.setRequestHeader(key, value));
        } else if (Array.isArray(headers)) {
          for (const [key, value] of headers) xhr.setRequestHeader(key, String(value));
        } else {
          for (const key of Object.keys(headers)) xhr.setRequestHeader(key, String(headers[key]));
        }
      }

      // Abort wiring
      const signal = init?.signal as AbortSignal | undefined;
      const onAbort = () => {
        try { xhr.abort(); } catch {}
      };
      if (signal) {
        if (signal.aborted) {
          onAbort();
        } else {
          signal.addEventListener("abort", onAbort, { once: true });
        }
      }

      // Upload progress with throttling and fall-through
      const lastEmittedAt = new WeakMap<Function, number>();
      xhr.upload.onprogress = (e: ProgressEvent<EventTarget>) => {
        const anyEvent = e as any;
        const loaded: number = anyEvent.loaded ?? 0;
        const total: number | undefined = anyEvent.total;
        const lengthComputable: boolean = anyEvent.lengthComputable ?? false;
        const percent = lengthComputable && total ? Math.min(100, Math.floor((loaded / total) * 100)) : 0;

        for (const h of uploadHandlers) {
          let pass = false;
          const throttleMs = h.throttleMs ?? 0;
          const now = Date.now();
          const last = lastEmittedAt.get(h.upload!);
          // Always allow the final 100% event to pass through, even if within throttle window
          const isFinal = percent === 100 || (lengthComputable && total != null && loaded >= (total as number));
          if (!(throttleMs > 0 && last && now - last < throttleMs) || isFinal) {
            lastEmittedAt.set(h.upload!, now);
            try {
              h.upload!({
                phase: "upload",
                percentProgress: percent,
                loadedBytes: loaded,
                totalBytes: lengthComputable ? total : undefined,
                requestConfig: config,
                fallThrough: () => { pass = true; },
              });
            } catch {
              factory.logger.warn("Upload progress handler failed");
            }
          }
          if (!pass) break;
        }
      };

      xhr.onload = () => {
        const headers = new Headers();
        const raw = xhr.getAllResponseHeaders();
        if (raw) {
          raw.trim().split(/\r?\n/).forEach(line => {
            const idx = line.indexOf(":");
            if (idx > 0) {
              const key = line.slice(0, idx).trim();
              const val = line.slice(idx + 1).trim();
              headers.append(key, val);
            }
          });
        }
        const body = xhr.response != null ? new Blob([xhr.response]) : null;
        resolve(new Response(body as any, { status: xhr.status, statusText: xhr.statusText, headers }));
      };

      xhr.onerror = () => reject(new TypeError("Network request failed"));
      xhr.ontimeout = () => reject(new TypeError("Network request timed out"));

      try {
        xhr.send(init?.body as any);
      } catch (err) {
        reject(err);
      }
    });
  };
}

export class UploadProgressFeature implements Feature {
    readonly name = "upload-progress" as const;

    getDelegates(factory: HTTPRequestFactory) {
        return {
            request: {
                getFetchImpl: (config: RequestConfig,) => createXhrFetchFacade(config, factory)
            }
        }
    }
}
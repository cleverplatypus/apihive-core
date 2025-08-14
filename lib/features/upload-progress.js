function createXhrFetchFacade(config, factory) {
    const uploadHandlers = (config.progressHandlers || []).filter(h => h.upload);
    // If no upload handlers, fall back to fetch
    if (uploadHandlers.length === 0)
        return (url, init) => globalThis.fetch(url, init);
    return function (url, init) {
        if (typeof XMLHttpRequest === "undefined") {
            // Non-browser env: gracefully fall back
            factory.logger.warn("Upload progress feature requires XMLHttpRequest");
            return globalThis.fetch(url, init);
        }
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open((init === null || init === void 0 ? void 0 : init.method) || "GET", url, true);
            xhr.responseType = "arraybuffer";
            // Set headers
            if (init === null || init === void 0 ? void 0 : init.headers) {
                const headers = init.headers;
                if (headers instanceof Headers) {
                    headers.forEach((value, key) => xhr.setRequestHeader(key, value));
                }
                else if (Array.isArray(headers)) {
                    for (const [key, value] of headers)
                        xhr.setRequestHeader(key, String(value));
                }
                else {
                    for (const key of Object.keys(headers))
                        xhr.setRequestHeader(key, String(headers[key]));
                }
            }
            // Abort wiring
            const signal = init === null || init === void 0 ? void 0 : init.signal;
            const onAbort = () => {
                try {
                    xhr.abort();
                }
                catch (_a) { }
            };
            if (signal) {
                if (signal.aborted) {
                    onAbort();
                }
                else {
                    signal.addEventListener("abort", onAbort, { once: true });
                }
            }
            // Upload progress with throttling and fall-through
            const lastEmittedAt = new WeakMap();
            xhr.upload.onprogress = (e) => {
                var _a, _b, _c;
                const anyEvent = e;
                const loaded = (_a = anyEvent.loaded) !== null && _a !== void 0 ? _a : 0;
                const total = anyEvent.total;
                const lengthComputable = (_b = anyEvent.lengthComputable) !== null && _b !== void 0 ? _b : false;
                const percent = lengthComputable && total ? Math.min(100, Math.floor((loaded / total) * 100)) : 0;
                for (const h of uploadHandlers) {
                    let pass = false;
                    const throttleMs = (_c = h.throttleMs) !== null && _c !== void 0 ? _c : 0;
                    const now = Date.now();
                    const last = lastEmittedAt.get(h.upload);
                    // Always allow the final 100% event to pass through, even if within throttle window
                    const isFinal = percent === 100 || (lengthComputable && total != null && loaded >= total);
                    if (!(throttleMs > 0 && last && now - last < throttleMs) || isFinal) {
                        lastEmittedAt.set(h.upload, now);
                        try {
                            h.upload({
                                phase: "upload",
                                percentProgress: percent,
                                loadedBytes: loaded,
                                totalBytes: lengthComputable ? total : undefined,
                                requestConfig: config,
                                fallThrough: () => { pass = true; },
                            });
                        }
                        catch (_d) {
                            factory.logger.warn("Upload progress handler failed");
                        }
                    }
                    if (!pass)
                        break;
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
                resolve(new Response(body, { status: xhr.status, statusText: xhr.statusText, headers }));
            };
            xhr.onerror = () => reject(new TypeError("Network request failed"));
            xhr.ontimeout = () => reject(new TypeError("Network request timed out"));
            try {
                xhr.send(init === null || init === void 0 ? void 0 : init.body);
            }
            catch (err) {
                reject(err);
            }
        });
    };
}
class UploadProgressFeature {
    constructor() {
        this.name = "upload-progress";
    }
    getDelegates(factory) {
        return {
            request: {
                getFetchImpl: (config) => createXhrFetchFacade(config, factory)
            }
        };
    }
}
export default new UploadProgressFeature();
//# sourceMappingURL=upload-progress.js.map
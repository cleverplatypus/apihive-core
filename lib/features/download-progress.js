class DownloadProgressFeature {
    constructor() {
        this.name = "download-progress";
    }
    getDelegates(_factory) {
        return {
            request: {
                handleDownloadProgress: async ({ response, abortController, config, }) => {
                    var _a, _b;
                    const contentType = (_a = response.headers
                        .get("content-type")) === null || _a === void 0 ? void 0 : _a.split(/;\s?/)[0];
                    const reader = (_b = response.body) === null || _b === void 0 ? void 0 : _b.getReader();
                    if (!reader) {
                        // No readable stream available; fall back
                        return await response.blob();
                    }
                    // Helper to create an AbortError that execute() knows how to handle
                    const makeAbortError = () => {
                        const err = new Error("Request aborted");
                        err.name = "AbortError";
                        return err;
                    };
                    const contentLength = response.headers.get("content-length");
                    const totalSize = contentLength ? parseInt(contentLength) : undefined;
                    let receivedSize = 0;
                    const handlers = (config.progressHandlers || []).filter((h) => !!h.download);
                    // Determine throttling window (ms) across handlers that specify it.
                    const throttleMs = handlers
                        .map((h) => h.throttleMs)
                        .filter((v) => typeof v === "number" && v >= 0);
                    const minThrottle = throttleMs.length
                        ? Math.min(...throttleMs)
                        : undefined;
                    let lastEmit = 0;
                    const now = () => typeof performance !== "undefined" && performance.now
                        ? performance.now()
                        : Date.now();
                    const emitProgress = (loaded, done) => {
                        const percent = totalSize
                            ? Math.max(0, Math.min(100, Math.floor((loaded / totalSize) * 100)))
                            : done
                                ? 100
                                : 0;
                        const readonlyConfig = config;
                        // Dispatch in array order. Handlers can call fallThrough() to pass to the next.
                        for (const h of handlers) {
                            const fn = h.download;
                            let pass = false;
                            fn({
                                phase: "download",
                                percentProgress: percent,
                                loadedBytes: loaded,
                                totalBytes: totalSize,
                                requestConfig: readonlyConfig,
                                fallThrough: () => {
                                    pass = true;
                                },
                            }); // cast to any to satisfy structural typing with inline object
                            if (!pass)
                                break;
                        }
                    };
                    // Emit initial progress
                    emitProgress(0, false);
                    const chunks = [];
                    const signal = abortController.signal;
                    let aborted = signal.aborted;
                    const onAbort = () => {
                        aborted = true;
                        // Cancel the reader to unblock any pending read()
                        try {
                            reader.cancel();
                        }
                        catch (_a) { }
                    };
                    signal.addEventListener("abort", onAbort);
                    try {
                        // Early abort check
                        if (aborted) {
                            throw makeAbortError();
                        }
                        while (true) {
                            const { done, value } = await reader.read();
                            // If abort happened while awaiting read, surface it first
                            if (aborted) {
                                throw makeAbortError();
                            }
                            if (done)
                                break;
                            if (value) {
                                chunks.push(value);
                                receivedSize += value.byteLength;
                                // Throttle if configured
                                const t = now();
                                if (minThrottle === undefined || t - lastEmit >= minThrottle) {
                                    emitProgress(receivedSize, false);
                                    lastEmit = t;
                                }
                            }
                        }
                    }
                    finally {
                        signal.removeEventListener("abort", onAbort);
                    }
                    const blob = new Blob(chunks, {
                        type: contentType || "application/octet-stream",
                    });
                    // Final emit at 100%
                    emitProgress(receivedSize, true);
                    return blob;
                },
            },
        };
    }
}
export default new DownloadProgressFeature();
//# sourceMappingURL=download-progress.js.map
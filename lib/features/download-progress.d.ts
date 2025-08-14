import { HTTPRequestFactory } from "../HTTPRequestFactory.js";
import { Feature, RequestConfig } from "../types.js";
declare class DownloadProgressFeature implements Feature {
    readonly name: "download-progress";
    getDelegates(_factory?: HTTPRequestFactory): {
        request: {
            handleDownloadProgress: ({ response, abortController, config, }: {
                response: Response;
                abortController: AbortController;
                config: RequestConfig;
            }) => Promise<Blob>;
        };
    };
}
declare const _default: DownloadProgressFeature;
export default _default;

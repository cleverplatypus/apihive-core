import { Feature, FetchLike, RequestConfig } from "../types.js";
import { HTTPRequestFactory } from "../HTTPRequestFactory.js";
declare class UploadProgressFeature implements Feature {
    readonly name: "upload-progress";
    getDelegates(factory: HTTPRequestFactory): {
        request: {
            getFetchImpl: (config: RequestConfig) => FetchLike;
        };
    };
}
declare const _default: UploadProgressFeature;
export default _default;

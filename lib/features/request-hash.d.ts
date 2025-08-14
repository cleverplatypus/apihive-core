import { HTTPRequestFactory } from "../HTTPRequestFactory.js";
import { Feature, FeatureRequestDelegates } from "../types.js";
declare class RequestHashFeature implements Feature {
    readonly name: "request-hash";
    private hashes;
    getDelegates(_factory?: HTTPRequestFactory): {
        request: FeatureRequestDelegates;
    };
}
declare const _default: RequestHashFeature;
export default _default;

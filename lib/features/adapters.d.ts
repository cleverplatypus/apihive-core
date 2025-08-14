import type { HTTPRequestFactory } from "../HTTPRequestFactory.js";
import { Feature, FeatureCommands, FeatureFactoryDelegates } from "../types.js";
declare class AdaptersFeature implements Feature {
    readonly name: "adapters";
    private factoriesInstanceInfo;
    private updateAdapterInterceptorApplier;
    private registerAdapterInterceptors;
    private unregisterAdapterInterceptors;
    apply(factory: any, commands: FeatureCommands): void;
    getDelegates(factory: HTTPRequestFactory): {
        factory: FeatureFactoryDelegates;
    };
}
declare const _default: AdaptersFeature;
export default _default;

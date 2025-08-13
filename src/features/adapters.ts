import type { HTTPRequest } from "../HTTPRequest.js";
import type { HTTPRequestFactory } from "../HTTPRequestFactory.js";
import type {
  Adapter,
  AdapterEntry,
  AdapterOptions,
  AdapterPriority,
} from "../adapter-types.js";
import {
  ErrorInterceptor,
  Feature,
  FeatureCommands,
  FeatureFactoryDelegates,
  RequestConfigBuilder,
  RequestInterceptor,
  ResponseInterceptor,
  ResponseInterceptorWithOptions,
} from "../types.js";

type FactoryInstanceInfo = {
  factoryCommands: FeatureCommands;
  adapters: Map<string, AdapterEntry>;
  adapterInterceptorApplier: RequestConfigBuilder | null;
  adapterRequestInterceptors: Array<{
    interceptor: RequestInterceptor;
    priority: number;
  }>;
  adapterResponseInterceptors: Array<{
    entry: ResponseInterceptor | ResponseInterceptorWithOptions;
    priority: number;
  }>;
  adapterErrorInterceptors: Array<{
    interceptor: ErrorInterceptor;
    priority: number;
  }>;
  addedFactoryDefaults: Map<string, RequestConfigBuilder[]>;
};

class AdaptersFeature implements Feature {
  readonly name = 'adapters' as const;

  private factoriesInstanceInfo: WeakMap<
    HTTPRequestFactory,
    FactoryInstanceInfo
  > = new WeakMap();

  private updateAdapterInterceptorApplier(instanceInfo: FactoryInstanceInfo) {
    // Remove existing applier if it exists
    if (instanceInfo.adapterInterceptorApplier) {
      instanceInfo.factoryCommands.removeRequestDefaults(
        instanceInfo.adapterInterceptorApplier
      );
    }

    // Create new applier that applies all current adapter interceptors
    instanceInfo.adapterInterceptorApplier = (request: HTTPRequest) => {
      // Apply request interceptors in priority order
      const sortedRequestInterceptors = instanceInfo.adapterRequestInterceptors
        .map((entry) => entry.interceptor);

      // Apply response interceptors in priority order
      const sortedResponseInterceptors =
        instanceInfo.adapterResponseInterceptors
          .map((entry) => entry.entry);

      // Apply error interceptors in priority order
      const sortedErrorInterceptors = instanceInfo.adapterErrorInterceptors
        .map((entry) => entry.interceptor);

      if (sortedRequestInterceptors.length > 0) {
        request.withRequestInterceptors(...sortedRequestInterceptors);
      }
      if (sortedResponseInterceptors.length > 0) {
        request.withResponseInterceptors(...sortedResponseInterceptors);
      }
      if (sortedErrorInterceptors.length > 0) {
        request.withErrorInterceptors(...sortedErrorInterceptors);
      }
    };
    // Add the new applier to requestDefaults
    if (
      instanceInfo.adapterRequestInterceptors.length > 0 ||
      instanceInfo.adapterResponseInterceptors.length > 0 ||
      instanceInfo.adapterErrorInterceptors.length > 0
    ) {
      instanceInfo.factoryCommands.addRequestDefaults(
        instanceInfo.adapterInterceptorApplier!
      );
    }
  }

  private registerAdapterInterceptors(
    adapter: Adapter,
    priority: AdapterPriority,
    instanceInfo: FactoryInstanceInfo
  ) {
    // Register request interceptors
    const requestInterceptors = adapter.getRequestInterceptors?.() || [];
    for (const interceptor of requestInterceptors) {
      instanceInfo.adapterRequestInterceptors.push({
        interceptor,
        priority: priority.requestInterceptor!,
      });
    }
    instanceInfo.adapterRequestInterceptors.sort(
      (a, b) => a.priority - b.priority
    );

    // Register response interceptors (functions or registrations)
    const responseInterceptors = adapter.getResponseInterceptors?.() || [];
    for (const entry of responseInterceptors) {
      instanceInfo.adapterResponseInterceptors.push({
        entry,
        priority: priority.responseInterceptor!,
      });
    }
    instanceInfo.adapterResponseInterceptors.sort(
      (a, b) => a.priority - b.priority
    );

    // Register error interceptors
    const errorInterceptors = adapter.getErrorInterceptors?.() || [];
    for (const interceptor of errorInterceptors) {
      instanceInfo.adapterErrorInterceptors.push({
        interceptor,
        priority: priority.errorInterceptor!,
      });
    }
    instanceInfo.adapterErrorInterceptors.sort(
      (a, b) => a.priority - b.priority
    );

    // Update the central adapter interceptor applier
    this.updateAdapterInterceptorApplier(instanceInfo);
  }

  private unregisterAdapterInterceptors(
    adapter: Adapter,
    instanceInfo: FactoryInstanceInfo
  ) {
    const requestInterceptors = adapter.getRequestInterceptors?.() || [];
    const responseInterceptors = adapter.getResponseInterceptors?.() || [];
    const errorInterceptors = adapter.getErrorInterceptors?.() || [];

    // Remove from adapter interceptor arrays
    instanceInfo.adapterRequestInterceptors =
      instanceInfo.adapterRequestInterceptors.filter(
        (entry) => !requestInterceptors.includes(entry.interceptor)
      );
    // Build a set of function references for comparison
    const responseFns = new Set(
      responseInterceptors.map((e) =>
        typeof e === "function"
          ? (e as ResponseInterceptor)
          : (e as ResponseInterceptorWithOptions).interceptor
      )
    );
    instanceInfo.adapterResponseInterceptors =
      instanceInfo.adapterResponseInterceptors.filter((stored) => {
        const fn =
          typeof stored.entry === "function"
            ? (stored.entry as ResponseInterceptor)
            : (stored.entry as ResponseInterceptorWithOptions).interceptor;
        return !responseFns.has(fn);
      });
    instanceInfo.adapterErrorInterceptors =
      instanceInfo.adapterErrorInterceptors.filter(
        (entry) => !errorInterceptors.includes(entry.interceptor)
      );

    // Update the central applier
    this.updateAdapterInterceptorApplier(instanceInfo);
  }

  apply(factory, commands: FeatureCommands) {
    const instanceInfo: FactoryInstanceInfo = {
      adapters: new Map<string, AdapterEntry>(),
      factoryCommands: commands,
      adapterInterceptorApplier: null,
      adapterRequestInterceptors: [],
      adapterResponseInterceptors: [],
      adapterErrorInterceptors: [],
      addedFactoryDefaults: new Map<string, RequestConfigBuilder[]>(),
    };
    this.factoriesInstanceInfo.set(factory, instanceInfo);
  }

  getDelegates(factory: HTTPRequestFactory) {
    const delegates: FeatureFactoryDelegates =
      {} as FeatureFactoryDelegates;

    delegates.withAdapter = async (
      adapter: Adapter,
      options?: AdapterOptions
    ) => {
      const instanceInfo = this.factoriesInstanceInfo.get(factory)!;
      if (instanceInfo.adapters.has(adapter.name)) {
        throw new Error(`Adapter '${adapter.name}' is already attached`);
      }

      // Merge priorities with defaults
      const defaultPriority: AdapterPriority = {
        requestInterceptor: 500,
        responseInterceptor: 500,
        errorInterceptor: 500,
      };
      const finalPriority = {
        ...defaultPriority,
        ...adapter.priority,
        ...options?.priority,
      };

      // Create adapter entry
      const entry: AdapterEntry = {
        adapter,
        priority: finalPriority,
        attached: false,
      };

      // Attach the adapter
      await adapter.onAttach?.(factory);

      // Register interceptors with priority
      this.registerAdapterInterceptors(adapter, finalPriority, instanceInfo);

      // Add factory defaults if provided
      const factoryDefaults = adapter.getFactoryDefaults?.() || [];
      instanceInfo.factoryCommands.addRequestDefaults(...factoryDefaults);
      instanceInfo.addedFactoryDefaults.set(adapter.name, factoryDefaults);

      // Mark as attached and store
      entry.attached = true;
      instanceInfo.adapters.set(adapter.name, entry);

      factory.logger
        .withMinimumLevel(factory.logLevel)
        .debug(`Adapter '${adapter.name}' attached successfully`);

      return factory;
    };

    delegates.detachAdapter = async (adapterName: string) => {
      const instanceInfo = this.factoriesInstanceInfo.get(factory)!;
      const entry = instanceInfo.adapters.get(adapterName);
      if (!entry) {
        throw new Error(`Adapter '${adapterName}' is not attached`);
      }

      this.unregisterAdapterInterceptors(entry.adapter, instanceInfo);
      const defaultsForAdapter = instanceInfo.addedFactoryDefaults.get(adapterName) || [];
      if (defaultsForAdapter.length) {
        instanceInfo.factoryCommands.removeRequestDefaults(...defaultsForAdapter);
        instanceInfo.addedFactoryDefaults.delete(adapterName);
      }

      await entry.adapter.onDetach?.(factory);

      instanceInfo.adapters.delete(adapterName);

      factory.logger
        .withMinimumLevel(factory.logLevel)
        .debug(`Adapter '${adapterName}' detached successfully`);

      return factory;
    };

    delegates.hasAdapter = (name: string) => {
      const instanceInfo = this.factoriesInstanceInfo.get(factory)!;
      return instanceInfo.adapters.has(name);
    };

    delegates.getAttachedAdapters = () => {
      const instanceInfo = this.factoriesInstanceInfo.get(factory)!;
      return Array.from(instanceInfo.adapters.keys());
    };

    return { factory: delegates };
  }
}

export default new AdaptersFeature();

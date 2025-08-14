class AdaptersFeature {
    constructor() {
        this.name = 'adapters';
        this.factoriesInstanceInfo = new WeakMap();
    }
    updateAdapterInterceptorApplier(instanceInfo) {
        // Remove existing applier if it exists
        if (instanceInfo.adapterInterceptorApplier) {
            instanceInfo.factoryCommands.removeRequestDefaults(instanceInfo.adapterInterceptorApplier);
        }
        // Create new applier that applies all current adapter interceptors
        instanceInfo.adapterInterceptorApplier = (request) => {
            // Apply request interceptors in priority order
            const sortedRequestInterceptors = instanceInfo.adapterRequestInterceptors
                .map((entry) => entry.interceptor);
            // Apply response interceptors in priority order
            const sortedResponseInterceptors = instanceInfo.adapterResponseInterceptors
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
        if (instanceInfo.adapterRequestInterceptors.length > 0 ||
            instanceInfo.adapterResponseInterceptors.length > 0 ||
            instanceInfo.adapterErrorInterceptors.length > 0) {
            instanceInfo.factoryCommands.addRequestDefaults(instanceInfo.adapterInterceptorApplier);
        }
    }
    registerAdapterInterceptors(adapter, priority, instanceInfo) {
        var _a, _b, _c;
        // Register request interceptors
        const requestInterceptors = ((_a = adapter.getRequestInterceptors) === null || _a === void 0 ? void 0 : _a.call(adapter)) || [];
        for (const interceptor of requestInterceptors) {
            instanceInfo.adapterRequestInterceptors.push({
                interceptor,
                priority: priority.requestInterceptor,
            });
        }
        instanceInfo.adapterRequestInterceptors.sort((a, b) => a.priority - b.priority);
        // Register response interceptors (functions or registrations)
        const responseInterceptors = ((_b = adapter.getResponseInterceptors) === null || _b === void 0 ? void 0 : _b.call(adapter)) || [];
        for (const entry of responseInterceptors) {
            instanceInfo.adapterResponseInterceptors.push({
                entry,
                priority: priority.responseInterceptor,
            });
        }
        instanceInfo.adapterResponseInterceptors.sort((a, b) => a.priority - b.priority);
        // Register error interceptors
        const errorInterceptors = ((_c = adapter.getErrorInterceptors) === null || _c === void 0 ? void 0 : _c.call(adapter)) || [];
        for (const interceptor of errorInterceptors) {
            instanceInfo.adapterErrorInterceptors.push({
                interceptor,
                priority: priority.errorInterceptor,
            });
        }
        instanceInfo.adapterErrorInterceptors.sort((a, b) => a.priority - b.priority);
        // Update the central adapter interceptor applier
        this.updateAdapterInterceptorApplier(instanceInfo);
    }
    unregisterAdapterInterceptors(adapter, instanceInfo) {
        var _a, _b, _c;
        const requestInterceptors = ((_a = adapter.getRequestInterceptors) === null || _a === void 0 ? void 0 : _a.call(adapter)) || [];
        const responseInterceptors = ((_b = adapter.getResponseInterceptors) === null || _b === void 0 ? void 0 : _b.call(adapter)) || [];
        const errorInterceptors = ((_c = adapter.getErrorInterceptors) === null || _c === void 0 ? void 0 : _c.call(adapter)) || [];
        // Remove from adapter interceptor arrays
        instanceInfo.adapterRequestInterceptors =
            instanceInfo.adapterRequestInterceptors.filter((entry) => !requestInterceptors.includes(entry.interceptor));
        // Build a set of function references for comparison
        const responseFns = new Set(responseInterceptors.map((e) => typeof e === "function"
            ? e
            : e.interceptor));
        instanceInfo.adapterResponseInterceptors =
            instanceInfo.adapterResponseInterceptors.filter((stored) => {
                const fn = typeof stored.entry === "function"
                    ? stored.entry
                    : stored.entry.interceptor;
                return !responseFns.has(fn);
            });
        instanceInfo.adapterErrorInterceptors =
            instanceInfo.adapterErrorInterceptors.filter((entry) => !errorInterceptors.includes(entry.interceptor));
        // Update the central applier
        this.updateAdapterInterceptorApplier(instanceInfo);
    }
    apply(factory, commands) {
        const instanceInfo = {
            adapters: new Map(),
            factoryCommands: commands,
            adapterInterceptorApplier: null,
            adapterRequestInterceptors: [],
            adapterResponseInterceptors: [],
            adapterErrorInterceptors: [],
            addedFactoryDefaults: new Map(),
        };
        this.factoriesInstanceInfo.set(factory, instanceInfo);
    }
    getDelegates(factory) {
        const delegates = {};
        delegates.withAdapter = async (adapter, options) => {
            var _a, _b;
            const instanceInfo = this.factoriesInstanceInfo.get(factory);
            if (instanceInfo.adapters.has(adapter.name)) {
                throw new Error(`Adapter '${adapter.name}' is already attached`);
            }
            // Merge priorities with defaults
            const defaultPriority = {
                requestInterceptor: 500,
                responseInterceptor: 500,
                errorInterceptor: 500,
            };
            const finalPriority = {
                ...defaultPriority,
                ...adapter.priority,
                ...options === null || options === void 0 ? void 0 : options.priority,
            };
            // Create adapter entry
            const entry = {
                adapter,
                priority: finalPriority,
                attached: false,
            };
            // Attach the adapter
            await ((_a = adapter.onAttach) === null || _a === void 0 ? void 0 : _a.call(adapter, factory));
            // Register interceptors with priority
            this.registerAdapterInterceptors(adapter, finalPriority, instanceInfo);
            // Add factory defaults if provided
            const factoryDefaults = ((_b = adapter.getFactoryDefaults) === null || _b === void 0 ? void 0 : _b.call(adapter)) || [];
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
        delegates.detachAdapter = async (adapterName) => {
            var _a, _b;
            const instanceInfo = this.factoriesInstanceInfo.get(factory);
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
            await ((_b = (_a = entry.adapter).onDetach) === null || _b === void 0 ? void 0 : _b.call(_a, factory));
            instanceInfo.adapters.delete(adapterName);
            factory.logger
                .withMinimumLevel(factory.logLevel)
                .debug(`Adapter '${adapterName}' detached successfully`);
            return factory;
        };
        delegates.hasAdapter = (name) => {
            const instanceInfo = this.factoriesInstanceInfo.get(factory);
            return instanceInfo.adapters.has(name);
        };
        delegates.getAttachedAdapters = () => {
            const instanceInfo = this.factoriesInstanceInfo.get(factory);
            return Array.from(instanceInfo.adapters.keys());
        };
        return { factory: delegates };
    }
}
export default new AdaptersFeature();
//# sourceMappingURL=adapters.js.map
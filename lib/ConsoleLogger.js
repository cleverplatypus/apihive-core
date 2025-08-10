const levelValues = {
    none: -1,
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5
};
export default class ConsoleLogger {
    constructor() {
        this.level = 'trace';
    }
    withMinimumLevel(level) {
        this.level = level;
        return new Proxy(this, {
            get: (target, property) => {
                if (property === 'withMinimumLevel') {
                    return (level) => target.withMinimumLevel(level);
                }
                if (levelValues[property] >= levelValues[this.level]) {
                    return (...args) => target[property](...args);
                }
                return () => { };
            }
        });
    }
    trace(message, ...args) {
        console.trace(message, ...args);
    }
    debug(message, ...args) {
        console.debug(message, ...args);
    }
    info(message, ...args) {
        console.info(message, ...args);
    }
    warn(message, ...args) {
        console.warn(message, ...args);
    }
    error(message, ...args) {
        console.error(message, ...args);
    }
    fatal(message, ...args) {
        console.error(message, ...args);
    }
}
//# sourceMappingURL=ConsoleLogger.js.map
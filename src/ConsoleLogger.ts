import { LoggerFacade, LogLevel } from './LoggerFacade.ts';

const levelValues = {
    none: -1,
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5
}

export default class ConsoleLogger implements LoggerFacade   {
    private level: LogLevel = 'trace';
    withMinimumLevel(level: LogLevel): LoggerFacade {
        this.level = level;
        return new Proxy(this, {
            get: (target, property : LogLevel | 'withMinimumLevel') => {
                if(property === 'withMinimumLevel') {
                    return (level : LogLevel) => target.withMinimumLevel(level);
                }
                if (levelValues[property] >= levelValues[this.level]) {
                    return (...args : any[]) => target[property](...args);
                }
                return () => {};
            }
        })
    }

    trace(message: string, ...args: any[]): void {
        console.trace(message, ...args);
    }
    debug(message: string, ...args: any[]): void {
        console.debug(message, ...args);
    }
    info(message: string, ...args: any[]): void {
        console.info(message, ...args);
    }
    warn(message: string, ...args: any[]): void {
        console.warn(message, ...args);
    }
    error(message: string, ...args: any[]): void {
        console.error(message, ...args);
    }
    fatal(message: string, ...args: any[]): void {
        console.error(message, ...args);
    }
}


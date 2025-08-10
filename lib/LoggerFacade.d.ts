export type LogLevel = "none" | "trace" | "debug" | "info" | "warn" | "error" | "fatal";
/**
 * @public
 * An interface for logger adapters.
 */
export type LoggerFacade = {
    withMinimumLevel(level: string): LoggerFacade;
    trace(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    fatal(message: string, ...args: any[]): void;
};

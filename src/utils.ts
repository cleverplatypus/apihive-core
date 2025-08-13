import { FeatureName } from "./types.js";

/**
 *
 * @param target either a value or a function to call with the provided args
 * @param args arguments to pass to the function
 * @returns the value of the target or the result of calling the function with the provided args
 */
export function maybeFunction<T>(target: any, ...args: any[]): T {
  if (typeof target === "function") {
    return target(...args) as T;
  }
  return target as T;
}

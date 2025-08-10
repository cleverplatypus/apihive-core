/**
 *
 * @param target either a value or a function to call with the provided args
 * @param args arguments to pass to the function
 * @returns the value of the target or the result of calling the function with the provided args
 */
export function maybeFunction(target, ...args) {
    if (typeof target === 'function') {
        return target(...args);
    }
    return target;
}
//# sourceMappingURL=utils.js.map
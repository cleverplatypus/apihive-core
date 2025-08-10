export default class HTTPError extends Error {
    constructor(code, message, body) {
        super(message);
        this.code = code;
        this.message = message;
        this.body = body;
    }
    isUnauthorized() {
        return this.code === 401;
    }
    isNotFound() {
        return this.code === 404;
    }
    isForbidden() {
        return this.code === 403;
    }
    isMethodNotAllowed() {
        return this.code === 405;
    }
    isConflict() {
        return this.code === 409;
    }
    isTooManyRequests() {
        return this.code === 429;
    }
    isInternalServerError() {
        return this.code === 500;
    }
    isNotImplemented() {
        return this.code === 501;
    }
    isTimedOut() {
        return this.code === 504;
    }
    isAborted() {
        return this.code === -1;
    }
}
//# sourceMappingURL=HTTPError.js.map
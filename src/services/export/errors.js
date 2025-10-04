class ValidationError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
        this.isValidationError = true;
    }
}

class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
        this.isAuthorizationError = true;
    }
}

module.exports = {
    ValidationError,
    AuthorizationError
};

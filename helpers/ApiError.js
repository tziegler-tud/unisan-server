class ApiError extends Error {
    constructor(name, status, message) {
        super();
    }
}

class ApiValidationError extends ApiError {
    constructor(message) {
        super("ValidationError", 400, message);
    }
}

class ApiForbiddenError extends ApiError {
    constructor(message) {
        super("FobiddenError", 401, message);
    }
}
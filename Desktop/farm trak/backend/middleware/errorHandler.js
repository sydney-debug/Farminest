/**
 * Error Handling Middleware for FarmTrak 360
 * Centralized error handling for the API
 */

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    // Handle different types of errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        errorCode = 'VALIDATION_ERROR';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized access';
        errorCode = 'UNAUTHORIZED';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Access forbidden';
        errorCode = 'FORBIDDEN';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Resource not found';
        errorCode = 'NOT_FOUND';
    } else if (err.name === 'ConflictError') {
        statusCode = 409;
        message = 'Resource conflict';
        errorCode = 'CONFLICT';
    } else if (err.code === '23505') { // PostgreSQL unique constraint violation
        statusCode = 409;
        message = 'Resource already exists';
        errorCode = 'DUPLICATE_ENTRY';
    } else if (err.code === '23503') { // PostgreSQL foreign key constraint violation
        statusCode = 400;
        message = 'Referenced resource does not exist';
        errorCode = 'INVALID_REFERENCE';
    }

    // In development, include stack trace
    const isDevelopment = process.env.NODE_ENV === 'development';

    const errorResponse = {
        error: {
            code: errorCode,
            message: message,
            ...(isDevelopment && { stack: err.stack }),
            ...(err.details && { details: err.details }),
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        }
    };

    // Don't expose internal errors in production
    if (!isDevelopment) {
        delete errorResponse.error.stack;
    }

    res.status(statusCode).json(errorResponse);
};

/**
 * Custom error class for validation errors
 */
class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}

/**
 * Custom error class for unauthorized access
 */
class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Custom error class for forbidden access
 */
class ForbiddenError extends Error {
    constructor(message = 'Access forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

/**
 * Custom error class for not found errors
 */
class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

/**
 * Custom error class for conflict errors
 */
class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
    }
}

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};

module.exports = {
    errorHandler,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    asyncHandler,
    notFoundHandler
};

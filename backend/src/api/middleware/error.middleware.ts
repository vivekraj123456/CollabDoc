/**
 * Global error handling middleware
 * Handles all errors and sends appropriate responses
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../utils/errors';
import config from '../../config';

interface IErrorResponse {
    success: false;
    message: string;
    code?: string;
    errors?: Array<{ field: string; message: string }>;
    stack?: string;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('Error:', err);

    // Default error response
    let statusCode = 500;
    let response: IErrorResponse = {
        success: false,
        message: 'Internal Server Error',
    };

    // Handle custom AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        response = {
            success: false,
            message: err.message,
            code: err.code,
        };

        // Include validation errors
        if (err instanceof ValidationError) {
            response.errors = err.errors;
        }
    }

    // Handle MongoDB duplicate key error
    if ((err as any).code === 11000) {
        statusCode = 409;
        const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
        response = {
            success: false,
            message: `Duplicate value for ${field}`,
            code: 'DUPLICATE_KEY',
        };
    }

    // Handle MongoDB validation error
    if (err.name === 'ValidationError') {
        statusCode = 422;
        const mongooseError = err as any;
        const errors = Object.keys(mongooseError.errors || {}).map((key) => ({
            field: key,
            message: mongooseError.errors[key].message,
        }));
        response = {
            success: false,
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors,
        };
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        response = {
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
        };
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        response = {
            success: false,
            message: 'Token expired',
            code: 'TOKEN_EXPIRED',
        };
    }

    // Include stack trace in development
    if (config.nodeEnv === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        code: 'NOT_FOUND',
    });
}

export default { errorHandler, notFoundHandler };

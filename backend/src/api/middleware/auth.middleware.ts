/**
 * Authentication middleware
 * Validates JWT tokens and attaches user to request
 */

import { Request, Response, NextFunction } from 'express';
import { User, IUserDocument } from '../../models';
import { verifyToken, extractToken, UnauthorizedError } from '../../utils';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUserDocument;
            userId?: string;
        }
    }
}

/**
 * Middleware to authenticate JWT tokens
 * Attaches user document to request if valid
 */
export async function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = extractToken(req.headers.authorization);

        if (!token) {
            throw new UnauthorizedError('Access token is required');
        }

        const decoded = verifyToken(token);

        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        req.user = user;
        req.userId = decoded.userId;

        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            next(error);
        } else {
            next(new UnauthorizedError('Invalid or expired token'));
        }
    }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = extractToken(req.headers.authorization);

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId);

            if (user) {
                req.user = user;
                req.userId = decoded.userId;
            }
        }

        next();
    } catch {
        // Ignore token errors for optional auth
        next();
    }
}

export default authenticate;

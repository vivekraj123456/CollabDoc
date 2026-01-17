/**
 * JWT utility functions for token generation and verification
 */

import jwt from 'jsonwebtoken';
import config from '../config';
import { IUserDocument } from '../models/user.model';

export interface ITokenPayload {
    userId: string;
    email: string;
    username: string;
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: IUserDocument): string {
    const payload: ITokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
    };

    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): ITokenPayload {
    return jwt.verify(token, config.jwtSecret) as ITokenPayload;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
}

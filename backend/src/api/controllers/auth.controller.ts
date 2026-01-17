/**
 * Authentication Controller
 * Handles user registration, login, and profile retrieval
 */

import { Request, Response, NextFunction } from 'express';
import { User } from '../../models';
import { generateToken, BadRequestError, UnauthorizedError } from '../../utils';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { username, email, password, displayName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            throw new BadRequestError(
                existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            );
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password,
            displayName: displayName || username,
        });

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    color: user.color,
                    createdAt: user.createdAt,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, password } = req.body;

        // Find user and include password for verification
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    color: user.color,
                    createdAt: user.createdAt,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getMe(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const user = req.user!;

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    color: user.color,
                    createdAt: user.createdAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

export default { register, login, getMe };

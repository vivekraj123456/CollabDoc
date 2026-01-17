/**
 * Environment configuration management
 * Centralizes all environment variables with validation and defaults
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

interface IConfig {
    nodeEnv: string;
    port: number;
    mongodbUri: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    frontendUrl: string;
    maxFileSize: number;
    uploadDir: string;
}

/**
 * Validates required environment variables
 */
function validateEnv(): void {
    const required = ['MONGODB_URI', 'JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

/**
 * Application configuration object
 */
export const config: IConfig = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/collabdoc',
    jwtSecret: process.env.JWT_SECRET || 'development-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
};

// Validate in production mode
if (config.nodeEnv === 'production') {
    validateEnv();
}

export default config;

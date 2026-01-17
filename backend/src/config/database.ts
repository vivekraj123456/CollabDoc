/**
 * Database connection management
 * Handles MongoDB connection with retry logic and event handling
 */

import mongoose from 'mongoose';
import config from './index';

/**
 * Connects to MongoDB with retry logic
 */
export async function connectDatabase(): Promise<void> {
    try {
        mongoose.set('strictQuery', false);

        await mongoose.connect(config.mongodbUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ Connected to MongoDB');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

/**
 * Gracefully closes the database connection
 */
export async function disconnectDatabase(): Promise<void> {
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
    }
}

export default { connectDatabase, disconnectDatabase };

/**
 * CollabDoc Backend - Main Entry Point
 * Collaborative Document Annotation System API Server
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import config from './config';
import { connectDatabase } from './config/database';
import routes from './api/routes';
import { errorHandler, notFoundHandler } from './api/middleware';
import initializeSocket from './socket';

// Create Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: config.frontendUrl,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Ensure uploads directory exists
const uploadsDir = config.uploadDir;
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads directory: ${uploadsDir}`);
}

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Request logging
if (config.nodeEnv !== 'test') {
    app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads (if needed for direct access)
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize Socket.io
initializeSocket(io);

/**
 * Start the server
 */
async function startServer(): Promise<void> {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Start HTTP server
        httpServer.listen(config.port, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 CollabDoc Backend Server                             ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(39)}║
║   Port: ${config.port.toString().padEnd(46)}║
║   API: http://localhost:${config.port}/api${' '.repeat(27)}║
║   Socket.io: Enabled                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            httpServer.close(() => {
                console.log('HTTP server closed');
            });

            io.close(() => {
                console.log('Socket.io server closed');
            });

            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

export { app, httpServer, io };

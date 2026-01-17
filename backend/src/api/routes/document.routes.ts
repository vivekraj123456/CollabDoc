/**
 * Document Routes
 * Defines routes for document management
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    addCollaborator,
} from '../controllers/document.controller';
import { authenticate, validate } from '../middleware';
import config from '../../config';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, config.uploadDir);
    },
    filename: (_req, file, cb) => {
        // Generate unique filename
        const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: config.maxFileSize,
    },
    fileFilter: (_req, file, cb) => {
        // Accept all file types
        cb(null, true);
    },
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/documents/upload
 * @desc    Upload a new document
 * @access  Private
 */
router.post(
    '/upload',
    upload.single('file'),
    validate([
        body('title')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Title cannot exceed 200 characters'),
    ]),
    uploadDocument
);

/**
 * @route   GET /api/documents
 * @desc    Get all documents for current user
 * @access  Private
 */
router.get('/', getDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Get a single document by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate([
        param('id').isMongoId().withMessage('Invalid document ID'),
    ]),
    getDocument
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a document
 * @access  Private (owner only)
 */
router.delete(
    '/:id',
    validate([
        param('id').isMongoId().withMessage('Invalid document ID'),
    ]),
    deleteDocument
);

/**
 * @route   POST /api/documents/:id/collaborators
 * @desc    Add a collaborator to a document
 * @access  Private (owner only)
 */
router.post(
    '/:id/collaborators',
    validate([
        param('id').isMongoId().withMessage('Invalid document ID'),
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please enter a valid email')
            .normalizeEmail(),
    ]),
    addCollaborator
);

export default router;

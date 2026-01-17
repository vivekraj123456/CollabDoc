/**
 * Document Controller
 * Handles document upload, retrieval, and management
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import { DocumentModel, Annotation, User } from '../../models';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils';
import config from '../../config';

/**
 * Extract text from DOCX files
 */
async function extractDocxText(filePath: string): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error('Error extracting DOCX text:', error);
        throw error;
    }
}

/**
 * Extract text from XLSX files
 */
async function extractXlsxText(filePath: string): Promise<string> {
    try {
        const buffer = await fs.readFile(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let allText = '';

        // Extract text from all sheets
        workbook.SheetNames.forEach((sheetName) => {
            allText += `=== Sheet: ${sheetName} ===\n`;
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            allText += csv + '\n\n';
        });

        return allText;
    } catch (error) {
        console.error('Error extracting XLSX text:', error);
        throw error;
    }
}

/**
 * Upload a new document
 * POST /api/documents/upload
 */
export async function uploadDocument(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const file = req.file;
        const { title } = req.body;
        const userId = req.userId!;

        if (!file) {
            throw new BadRequestError('No file uploaded');
        }

        // Determine file type and extract content
        const ext = path.extname(file.originalname).toLowerCase();
        let fileType: 'text' | 'pdf' | 'binary';
        let content: string;

        // List of extensions that should be treated as text files
        const textExtensions = ['.txt', '.md', '.html', '.json', '.xml', '.csv', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.scss', '.yaml', '.yml', '.toml', '.ini', '.conf', '.sh', '.bash', '.log'];
        const isTextFormat = textExtensions.includes(ext);

        console.log(`📂 Processing file: ${file.originalname} (${ext}), Size: ${file.size} bytes, Text format: ${isTextFormat}`);

        try {
            if (ext === '.pdf') {
                fileType = 'pdf';
                try {
                    // Extract text from PDF
                    const pdfBuffer = await fs.readFile(file.path);
                    console.log(`📄 Parsing PDF: ${file.originalname}`);
                    const pdfData = await pdfParse(pdfBuffer);
                    content = pdfData.text;
                    console.log(`✅ PDF extracted: ${content.length} characters`);
                } catch (pdfError) {
                    console.error('❌ PDF parse error:', pdfError);
                    // If PDF parsing fails, read as binary
                    const binaryBuffer = await fs.readFile(file.path);
                    content = binaryBuffer.toString('base64');
                    fileType = 'binary';
                    console.log(`⚠️ Converted PDF to binary: ${content.length} characters`);
                }
            } else if (isTextFormat) {
                // Treat as text file
                try {
                    console.log(`📝 Reading file as text: ${file.originalname}`);
                    content = await fs.readFile(file.path, 'utf-8');
                    fileType = 'text';
                    console.log(`✅ Text file read successfully: ${content.length} characters`);
                } catch (textError) {
                    console.warn(`⚠️ Text read failed, treating as binary: ${textError}`);
                    try {
                        const binaryBuffer = await fs.readFile(file.path);
                        content = binaryBuffer.toString('base64');
                        fileType = 'binary';
                        console.log(`✅ Converted to binary: ${content.length} characters`);
                    } catch (binaryError) {
                        console.error('❌ File read error:', binaryError);
                        throw new BadRequestError('Failed to read file. File may be corrupted.');
                    }
                }
            } else {
                // Handle other file formats - try to extract text if possible
                console.log(`📄 Attempting to extract text from: ${file.originalname}`);
                try {
                    if (ext === '.docx' || ext === '.doc') {
                        // Extract text from Word documents
                        console.log(`📘 Extracting text from DOCX: ${file.originalname}`);
                        content = await extractDocxText(file.path);
                        fileType = 'text';
                        console.log(`✅ DOCX text extracted: ${content.length} characters`);
                    } else if (ext === '.xlsx' || ext === '.xls') {
                        // Extract text from Excel files
                        console.log(`📗 Extracting text from XLSX: ${file.originalname}`);
                        content = await extractXlsxText(file.path);
                        fileType = 'text';
                        console.log(`✅ XLSX text extracted: ${content.length} characters`);
                    } else {
                        // For other formats, try to read as text, fall back to binary
                        console.log(`🔍 Trying to read as text: ${file.originalname}`);
                        try {
                            content = await fs.readFile(file.path, 'utf-8');
                            fileType = 'text';
                            console.log(`✅ File read as text: ${content.length} characters`);
                        } catch (textReadError) {
                            // If text read fails, store as binary (for images, videos, etc.)
                            console.warn(`⚠️ Cannot read as text, storing as binary: ${file.originalname}`);
                            const binaryBuffer = await fs.readFile(file.path);
                            content = binaryBuffer.toString('base64');
                            fileType = 'binary';
                            console.log(`✅ Binary file stored: ${content.length} characters`);
                        }
                    }
                } catch (extractError) {
                    console.error('❌ File extraction error:', extractError);
                    // Fall back to binary
                    try {
                        const binaryBuffer = await fs.readFile(file.path);
                        content = binaryBuffer.toString('base64');
                        fileType = 'binary';
                        console.log(`⚠️ Fallback to binary: ${content.length} characters`);
                    } catch (binaryError) {
                        console.error('❌ Binary fallback failed:', binaryError);
                        throw new BadRequestError('Failed to read file. File may be corrupted.');
                    }
                }
            }
        } catch (error) {
            // Clean up uploaded file
            try {
                await fs.unlink(file.path);
            } catch {
                // Ignore cleanup errors
            }
            if (error instanceof BadRequestError) {
                throw error;
            }
            throw new BadRequestError('Failed to process file. Please try a different file.');
        }

        console.log(`📊 File type determined: ${fileType}, Content length: ${content.length}`);

        // Create document record
        const document = await DocumentModel.create({
            title: title || file.originalname,
            fileName: file.originalname,
            fileType,
            content,
            originalPath: file.path,
            owner: userId,
            collaborators: [],
        });

        res.status(201).json({
            success: true,
            data: {
                document: {
                    _id: document._id,
                    title: document.title,
                    fileName: document.fileName,
                    fileType: document.fileType,
                    owner: document.owner,
                    createdAt: document.createdAt,
                },
            },
        });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch {
                // Ignore cleanup errors
            }
        }
        next(error);
    }
}

/**
 * Get all documents for current user
 * GET /api/documents
 */
export async function getDocuments(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.userId!;

        // Get documents where user is owner or collaborator
        const documents = await DocumentModel.find({
            $or: [{ owner: userId }, { collaborators: userId }],
        })
            .select('-content -originalPath')
            .sort({ updatedAt: -1 })
            .lean();

        // Get annotation counts for each document
        const documentsWithCounts = await Promise.all(
            documents.map(async (doc) => {
                const annotationCount = await Annotation.countDocuments({
                    documentId: doc._id,
                });
                return {
                    ...doc,
                    collaboratorCount: doc.collaborators.length,
                    annotationCount,
                };
            })
        );

        res.json({
            success: true,
            data: { documents: documentsWithCounts },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get a single document by ID
 * GET /api/documents/:id
 */
export async function getDocument(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        console.log(`📖 Fetching document: ${id}`);

        const document = await DocumentModel.findById(id)
            .populate('owner', 'username displayName color')
            .populate('collaborators', 'username displayName color');

        if (!document) {
            throw new NotFoundError('Document not found');
        }

        // Check access
        const hasAccess =
            document.owner._id.toString() === userId ||
            document.collaborators.some((c: any) => c._id.toString() === userId);

        if (!hasAccess) {
            throw new ForbiddenError('You do not have access to this document');
        }

        console.log(`✅ Document retrieved: ${document.fileName} (${document.fileType}), Content size: ${document.content.length} bytes`);

        res.json({
            success: true,
            data: { document },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
export async function deleteDocument(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const document = await DocumentModel.findById(id);

        if (!document) {
            throw new NotFoundError('Document not found');
        }

        // Only owner can delete
        if (document.owner.toString() !== userId) {
            throw new ForbiddenError('Only the owner can delete this document');
        }

        // Delete associated annotations
        await Annotation.deleteMany({ documentId: id });

        // Delete the original file
        try {
            await fs.unlink(document.originalPath);
        } catch {
            // Ignore file deletion errors
        }

        // Delete document
        await document.deleteOne();

        res.json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Add a collaborator to a document
 * POST /api/documents/:id/collaborators
 */
export async function addCollaborator(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const { email } = req.body;
        const userId = req.userId!;

        const document = await DocumentModel.findById(id);

        if (!document) {
            throw new NotFoundError('Document not found');
        }

        // Only owner can add collaborators
        if (document.owner.toString() !== userId) {
            throw new ForbiddenError('Only the owner can add collaborators');
        }

        // Find the user to add
        const userToAdd = await User.findOne({ email });

        if (!userToAdd) {
            throw new NotFoundError('User not found with this email');
        }

        // Check if already a collaborator
        if (document.collaborators.includes(userToAdd._id)) {
            throw new BadRequestError('User is already a collaborator');
        }

        // Can't add owner as collaborator
        if (userToAdd._id.toString() === userId) {
            throw new BadRequestError('Cannot add yourself as collaborator');
        }

        // Add collaborator
        document.collaborators.push(userToAdd._id);
        await document.save();

        res.json({
            success: true,
            data: {
                collaborator: {
                    _id: userToAdd._id,
                    username: userToAdd.username,
                    displayName: userToAdd.displayName,
                    color: userToAdd.color,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

export default {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    addCollaborator,
};

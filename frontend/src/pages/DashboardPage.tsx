/**
 * Dashboard Page Component
 * Lists user's documents with upload functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentsApi } from '../services';
import type { Document } from '../types';
import { Loading } from '../components/common';
import './DashboardPage.css';

export function DashboardPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const docs = await documentsApi.getAll();
            setDocuments(docs);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setError('');
            const doc = await documentsApi.upload(file);
            navigate(`/document/${doc._id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload document');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await documentsApi.delete(id);
            setDocuments((prev) => prev.filter((d) => d._id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete document');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return <Loading fullScreen message="Loading documents..." />;
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div>
                        <h1>My Documents</h1>
                        <p>Upload and annotate documents collaboratively</p>
                    </div>

                    <div className="dashboard-actions">
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            hidden
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <span className="spinner spinner-sm" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <span>+</span>
                                    Upload Document
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="dashboard-error">
                        {error}
                        <button onClick={() => setError('')}>✕</button>
                    </div>
                )}

                {documents.length === 0 ? (
                    <div className="dashboard-empty">
                        <div className="empty-icon">📄</div>
                        <h3>No documents yet</h3>
                        <p>Upload your first document to start annotating</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Upload Document
                        </button>
                    </div>
                ) : (
                    <div className="documents-grid">
                        {documents.map((doc) => (
                            <article key={doc._id} className="document-card">
                                <Link to={`/document/${doc._id}`} className="document-card-link">
                                    <div className="document-icon">
                                        {doc.fileType === 'pdf' ? '📕' : '📄'}
                                    </div>
                                    <h3 className="document-title">{doc.title}</h3>
                                    <p className="document-filename">{doc.fileName}</p>
                                </Link>

                                <div className="document-meta">
                                    <span className="document-stat">
                                        💬 {doc.annotationCount || 0} annotations
                                    </span>
                                    <span className="document-stat">
                                        👥 {(doc.collaboratorCount || 0) + 1} users
                                    </span>
                                </div>

                                <div className="document-footer">
                                    <span className="document-date">
                                        {formatDate(doc.createdAt)}
                                    </span>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(doc._id);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;

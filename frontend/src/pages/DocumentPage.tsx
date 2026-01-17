/**
 * Document Page Component
 * Main document viewing and annotation page
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsApi } from '../services';
import type { Document, Annotation, TextSelection } from '../types';
import { useAnnotations, useToast } from '../hooks';
import { Loading, ToastContainer } from '../components/common';
import { DocumentViewer } from '../components/document';
import { AnnotationSidebar } from '../components/annotation';
import './DocumentPage.css';

export function DocumentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [document, setDocument] = useState<Document | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
    const [collaboratorEmail, setCollaboratorEmail] = useState('');
    const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
    const [showCollaboratorForm, setShowCollaboratorForm] = useState(false);

    const {
        annotations,
        activeUsers,
        isLoading: isLoadingAnnotations,
        createAnnotation,
        updateAnnotation,
        deleteAnnotation,
    } = useAnnotations({ documentId: id || null });

    // Load document
    useEffect(() => {
        const loadDocument = async () => {
            if (!id) {
                navigate('/');
                return;
            }

            try {
                setIsLoading(true);
                const doc = await documentsApi.getById(id);
                setDocument(doc);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load document');
            } finally {
                setIsLoading(false);
            }
        };

        loadDocument();
    }, [id, navigate]);

    const handleSelection = useCallback((selection: TextSelection | null) => {
        setCurrentSelection(selection);
        if (selection) {
            setSelectedAnnotationId(null);
        }
    }, []);

    const handleAnnotationClick = useCallback((annotation: Annotation) => {
        setSelectedAnnotationId(annotation._id);
        setCurrentSelection(null);
    }, []);

    const handleCreateAnnotation = useCallback(async (comment: string) => {
        if (!currentSelection) return;

        try {
            await createAnnotation({
                startOffset: currentSelection.startOffset,
                endOffset: currentSelection.endOffset,
                selectedText: currentSelection.selectedText,
                comment,
            });
            setCurrentSelection(null);
            toast.success('Annotation added!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add annotation');
        }
    }, [currentSelection, createAnnotation, toast]);

    const handleUpdateAnnotation = useCallback(async (
        annotationId: string,
        data: { comment?: string; isResolved?: boolean }
    ) => {
        try {
            await updateAnnotation(annotationId, data);
            toast.success('Annotation updated!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update annotation');
        }
    }, [updateAnnotation, toast]);

    const handleDeleteAnnotation = useCallback(async (annotationId: string) => {
        try {
            await deleteAnnotation(annotationId);
            setSelectedAnnotationId(null);
            toast.success('Annotation deleted!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete annotation');
        }
    }, [deleteAnnotation, toast]);

    const handleClearSelection = useCallback(() => {
        setCurrentSelection(null);
        window.getSelection()?.removeAllRanges();
    }, []);

    const handleAddCollaborator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !collaboratorEmail.trim()) return;

        try {
            setIsAddingCollaborator(true);
            await documentsApi.addCollaborator(id, collaboratorEmail.trim());
            toast.success('Collaborator added!');
            setCollaboratorEmail('');
            setShowCollaboratorForm(false);

            // Reload document to get updated collaborators
            const doc = await documentsApi.getById(id);
            setDocument(doc);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add collaborator');
        } finally {
            setIsAddingCollaborator(false);
        }
    };

    if (isLoading) {
        return <Loading fullScreen message="Loading document..." />;
    }

    if (error || !document) {
        return (
            <div className="document-error">
                <h2>Error</h2>
                <p>{error || 'Document not found'}</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="document-page">
            <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

            {/* Document Header */}
            <header className="document-header">
                <div className="document-header-left">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
                        ← Back
                    </button>
                    <div className="document-info">
                        <h1>{document.title}</h1>
                        <span className="document-type">
                            {document.fileType.toUpperCase()} • {document.fileName}
                        </span>
                    </div>
                </div>

                <div className="document-header-right">
                    {/* Collaborators */}
                    <div className="collaborators">
                        {Array.isArray(document.collaborators) &&
                            document.collaborators.map((collab: any) => (
                                <span
                                    key={collab._id}
                                    className="collaborator-avatar"
                                    style={{ backgroundColor: collab.color }}
                                    title={collab.displayName}
                                >
                                    {collab.displayName?.charAt(0).toUpperCase()}
                                </span>
                            ))}
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowCollaboratorForm(!showCollaboratorForm)}
                        >
                            + Invite
                        </button>
                    </div>
                </div>
            </header>

            {/* Add Collaborator Form */}
            {showCollaboratorForm && (
                <div className="collaborator-form-container">
                    <form onSubmit={handleAddCollaborator} className="collaborator-form">
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Enter email address"
                            value={collaboratorEmail}
                            onChange={(e) => setCollaboratorEmail(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={isAddingCollaborator}
                        >
                            {isAddingCollaborator ? 'Adding...' : 'Add'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowCollaboratorForm(false)}
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {/* Main Content */}
            <div className="document-content-wrapper">
                {/* Check if file type is binary */}
                {document.fileType === 'binary' ? (
                    <div className="document-binary-notice">
                        <div className="binary-notice-content">
                            <h3>📁 Binary File</h3>
                            <p>This is a binary file ({document.fileName}) and cannot be displayed as text.</p>
                            <p>However, you can still add annotations using the comment system below.</p>
                            <small>File type: {document.fileType.toUpperCase()}</small>
                        </div>
                    </div>
                ) : (
                    <DocumentViewer
                        content={document.content || ''}
                        annotations={annotations}
                        selectedAnnotationId={selectedAnnotationId}
                        onSelection={handleSelection}
                        onAnnotationClick={handleAnnotationClick}
                    />
                )}

                {/* Annotation Sidebar */}
                <AnnotationSidebar
                    annotations={annotations}
                    activeUsers={activeUsers}
                    selectedAnnotationId={selectedAnnotationId}
                    currentSelection={currentSelection}
                    onAnnotationClick={handleAnnotationClick}
                    onAnnotationCreate={handleCreateAnnotation}
                    onAnnotationUpdate={handleUpdateAnnotation}
                    onAnnotationDelete={handleDeleteAnnotation}
                    onClearSelection={handleClearSelection}
                />
            </div>

            {/* Selection Tooltip */}
            {currentSelection && !showCollaboratorForm && (
                <div className="selection-tooltip">
                    <span>Text selected!</span>
                    <span className="selection-hint">Add a comment in the sidebar →</span>
                </div>
            )}
        </div>
    );
}

export default DocumentPage;

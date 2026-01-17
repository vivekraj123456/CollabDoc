/**
 * Loading Spinner Component
 */

import React from 'react';
import './Loading.css';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    fullScreen?: boolean;
}

export function Loading({ size = 'md', message, fullScreen = false }: LoadingProps) {
    const content = (
        <div className="loading-content">
            <div className={`spinner spinner-${size}`} />
            {message && <p className="loading-message">{message}</p>}
        </div>
    );

    if (fullScreen) {
        return <div className="loading-overlay">{content}</div>;
    }

    return <div className="loading-container">{content}</div>;
}

export default Loading;

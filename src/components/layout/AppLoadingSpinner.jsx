import React from 'react';

export default function AppLoadingSpinner() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
}
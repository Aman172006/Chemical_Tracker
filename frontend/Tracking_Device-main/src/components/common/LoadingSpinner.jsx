import React from 'react';

export function LoadingSpinner({ size = 'md', className = '' }) {
    const sizeMap = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`${sizeMap[size]} border-olive-200 border-t-olive-500 rounded-full animate-spin`}
            />
        </div>
    );
}

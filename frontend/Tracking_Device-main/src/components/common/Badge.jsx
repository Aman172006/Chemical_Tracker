import React from 'react';
import { THREAT_INFO } from '../../utils/constants';

export function Badge({ level, text, size = 'sm', className = '' }) {
    const info = THREAT_INFO[level] || THREAT_INFO[0];
    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[10px]',
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm'
    };

    return (
        <span
            className={`inline-flex items-center font-semibold rounded-full uppercase tracking-wider ${sizeClasses[size]} ${className}`}
            style={{
                backgroundColor: info.bg,
                color: info.text,
                border: `1px solid ${info.border}`
            }}
        >
            {text || info.label}
        </span>
    );
}

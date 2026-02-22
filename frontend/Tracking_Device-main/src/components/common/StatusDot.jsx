import React from 'react';

/**
 * StatusDot — pulsing connection status indicator
 * status: "live" | "delayed" | "lost"
 */
export function StatusDot({ status = 'live', size = 'md' }) {
    const sizeMap = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
    const dotSize = sizeMap[size] || sizeMap.md;

    const colorMap = {
        live: {
            dot: 'bg-green-500',
            ring: 'bg-green-400',
            animate: true
        },
        delayed: {
            dot: 'bg-amber-500',
            ring: 'bg-amber-400',
            animate: false
        },
        lost: {
            dot: 'bg-red-500',
            ring: 'bg-red-400',
            animate: false
        }
    };

    const config = colorMap[status] || colorMap.live;

    return (
        <span className="relative inline-flex">
            {config.animate && (
                <span
                    className={`absolute inline-flex h-full w-full rounded-full ${config.ring} opacity-75 animate-ping`}
                />
            )}
            <span className={`relative inline-flex rounded-full ${dotSize} ${config.dot}`} />
        </span>
    );
}

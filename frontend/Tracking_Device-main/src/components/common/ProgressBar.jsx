import React from 'react';
import { motion } from 'framer-motion';

/**
 * ProgressBar — animated fill with label
 */
export function ProgressBar({ value = 0, max = 100, color = 'olive', showLabel = true, height = 8 }) {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));

    const colorMap = {
        olive: 'bg-olive-500',
        amber: 'bg-amber-500',
        orange: 'bg-orange-500',
        red: 'bg-red-500',
        green: 'bg-green-500'
    };

    return (
        <div className="w-full">
            <div
                className="w-full bg-mist rounded-full overflow-hidden"
                style={{ height: `${height}px` }}
            >
                <motion.div
                    className={`h-full rounded-full ${colorMap[color] || colorMap.olive}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-badge-300 mt-1">
                    {percent.toFixed(1)}% of original
                </p>
            )}
        </div>
    );
}

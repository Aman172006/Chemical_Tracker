import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import { formatWeight } from '../../utils/formatters';
import { WEIGHT_CHANGE_THRESHOLD } from '../../utils/constants';

export function LiveWeightCard({ current, original }) {
    const [displayWeight, setDisplayWeight] = useState(current || 0);

    // Smooth number animation
    useEffect(() => {
        if (current == null) return;
        const start = displayWeight;
        const end = current;
        const duration = 600;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setDisplayWeight(start + (end - start) * eased);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [current]);

    const safeOriginal = original || 50;
    const delta = (current || 0) - safeOriginal;
    const deltaPercent = Math.abs(delta) / safeOriginal;
    const isAnomaly = deltaPercent > WEIGHT_CHANGE_THRESHOLD;
    const fillPercent = Math.min(100, Math.max(0, ((current || 0) / safeOriginal) * 100));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-mist rounded-2xl p-5 shadow-sm"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Scale className="w-4 h-4 text-olive-500" />
                <span className="text-xs font-bold text-badge uppercase tracking-wider">Live Weight</span>
            </div>

            {/* Big Number */}
            <div className="text-center mb-4">
                <span className="text-[28px] font-mono font-bold text-badge leading-none">
                    {displayWeight.toFixed(2)}
                </span>
                <span className="text-sm text-badge-300 ml-1">kg</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="w-full h-2 bg-mist rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${isAnomaly ? 'bg-orange-500' : 'bg-olive-500'}`}
                        animate={{ width: `${fillPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                </div>
                <p className="text-xs text-badge-300 mt-1">{fillPercent.toFixed(1)}% of original</p>
            </div>

            {/* Details */}
            <div className="space-y-1.5">
                <div className="flex justify-between">
                    <span className="text-xs text-badge-300">Original</span>
                    <span className="text-xs font-mono text-badge-500">{formatWeight(safeOriginal)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-xs text-badge-300">Current</span>
                    <span className="text-xs font-mono text-badge-500">{formatWeight(current)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-xs text-badge-300">Δ Change</span>
                    <span className={`text-xs font-mono font-medium ${isAnomaly ? 'text-orange-600' : 'text-olive-500'}`}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(2)} kg ({(deltaPercent * 100).toFixed(1)}%)
                    </span>
                </div>
                {isAnomaly && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-semibold text-orange-600 text-center mt-2 py-1 rounded-lg"
                        style={{ backgroundColor: 'var(--alert-orange-bg)' }}
                    >
                        ⚠️ ANOMALY DETECTED
                    </motion.p>
                )}
            </div>
        </motion.div>
    );
}

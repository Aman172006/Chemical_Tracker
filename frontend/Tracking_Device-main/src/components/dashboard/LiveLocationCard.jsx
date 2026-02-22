import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Gauge, Clock } from 'lucide-react';
import { StatusDot } from '../common/StatusDot';
import { formatTimestamp, formatTimeAgo, formatCoordinate, formatSpeed } from '../../utils/formatters';

export function LiveLocationCard({ data, lastUpdatedAgo, connectionStatus }) {
    const agoColor = lastUpdatedAgo < 10
        ? 'text-olive-500'
        : lastUpdatedAgo < 30
            ? 'text-amber-500'
            : 'text-red-500';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-mist rounded-2xl p-5 shadow-sm"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-olive-500" />
                    <span className="text-xs font-bold text-badge uppercase tracking-wider">Live Location</span>
                </div>
                <StatusDot status={connectionStatus} />
            </div>

            {/* Data Grid */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-badge-300">Latitude</span>
                    <span className="font-mono text-sm text-badge font-medium">
                        {formatCoordinate(data?.lat, 'lat')}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-badge-300">Longitude</span>
                    <span className="font-mono text-sm text-badge font-medium">
                        {formatCoordinate(data?.lng, 'lng')}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-badge-300 flex items-center gap-1">
                        <Gauge className="w-3 h-3" /> Speed
                    </span>
                    <span className="font-mono text-sm text-olive-500 font-medium">
                        {formatSpeed(data?.speed)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-badge-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Timestamp
                    </span>
                    <span className="text-xs text-badge-500">
                        {formatTimestamp(data?.timestamp)}
                    </span>
                </div>

                {/* Last Updated */}
                <div className="pt-2 border-t border-mist">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-badge-300">Last Updated</span>
                        <span className={`text-xs font-mono font-medium ${agoColor}`}>
                            {formatTimeAgo(lastUpdatedAgo)}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

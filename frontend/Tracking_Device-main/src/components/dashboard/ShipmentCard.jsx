import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatCoordinate } from '../../utils/formatters';

/**
 * Maps backend trip.status → UI threat level for visual styling.
 * Backend severity-based alerts update the trip status.
 */
function tripStatusToThreatLevel(status) {
    switch (status) {
        case 'alert': return 2;
        case 'cancelled': return 3;
        default: return 0;
    }
}

export function ShipmentCard({ shipment, isSelected, onClick }) {
    // Use trip-level totalAlerts to decide threat level, or derive from status
    const threatLevel = shipment.totalAlerts > 0
        ? Math.min(shipment.totalAlerts, 3)
        : tripStatusToThreatLevel(shipment.status);

    const statusColors = {
        'created': 'bg-badge-100 text-badge-500',
        'active': 'bg-blue-50 text-blue-600',
        'completed': 'bg-green-50 text-green-600',
        'alert': 'bg-red-50 text-red-600',
        'cancelled': 'bg-badge-100 text-badge-400',
    };

    const borderColor = threatLevel === 3
        ? 'border-red-500 border-2'
        : threatLevel === 2
            ? 'border-orange-500 border-2'
            : threatLevel === 1
                ? 'border-amber-500 border-2'
                : isSelected
                    ? 'border-olive-500 border-2'
                    : 'border-mist';

    // Determine what to show for the "Origin" side of the route
    const isLive = shipment.status === 'active' && shipment.live?.currentLocation;
    const originDisplay = isLive
        ? `${formatCoordinate(shipment.live.currentLocation.lat, 'lat')}, ${formatCoordinate(shipment.live.currentLocation.lng, 'lng')}`
        : shipment.startLocation?.lat && shipment.startLocation?.lng
            ? `${formatCoordinate(shipment.startLocation.lat, 'lat')}, ${formatCoordinate(shipment.startLocation.lng, 'lng')}`
            : (shipment.startLocation?.address || 'Origin');

    // Determine what to show for the "Destination" side of the route
    const destDisplay = shipment.endLocation?.lat && shipment.endLocation?.lng
        ? `${formatCoordinate(shipment.endLocation.lat, 'lat')}, ${formatCoordinate(shipment.endLocation.lng, 'lng')}`
        : (shipment.endLocation?.address || 'Destination');

    return (
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            className={`w-full text-left p-3.5 rounded-xl border transition-all ${borderColor} ${isSelected ? 'bg-olive-50/50 shadow-sm' : 'bg-white hover:bg-cream/50'
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div>
                    <span className="font-mono text-xs font-bold text-badge">
                        {shipment.tripId}
                    </span>
                    {shipment.chemicalName && (
                        <p className="text-xs text-badge-500 mt-0.5">{shipment.chemicalName}</p>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <Badge level={threatLevel} size="xs" />
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColors[shipment.status] || statusColors['created']
                        }`}>
                        {(shipment.status || 'created').toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Route */}
            <div className="flex items-center gap-1.5 text-[11px] text-badge-300">
                <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="truncate" title={originDisplay}>{originDisplay}</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                <span className="truncate" title={shipment.endLocation?.address || destDisplay}>{destDisplay}</span>
            </div>

            {/* Chemical quantity */}
            {shipment.chemicalQuantity && (
                <p className="text-[10px] text-badge-300 mt-1.5 font-mono">
                    {shipment.chemicalQuantity}
                </p>
            )}
        </motion.button>
    );
}

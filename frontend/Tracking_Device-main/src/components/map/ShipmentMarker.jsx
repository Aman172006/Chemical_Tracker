import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '../common/Badge';

export function ShipmentMarker({ position, threatLevel, batchId, status }) {
    if (!position || position[0] === 0) return null;

    const getMarkerHtml = () => {
        let innerHtml = '<div class="marker-normal"></div>';
        if (threatLevel === 1) innerHtml = '<div class="marker-l1 animate-pulse-amber"></div>';
        if (threatLevel === 2) innerHtml = '<div class="marker-l2 animate-pulse-orange"></div>';
        if (threatLevel === 3) innerHtml = '<div class="relative"><div class="ripple-circle"></div><div class="marker-l3"></div></div>';

        return innerHtml;
    };

    const icon = L.divIcon({
        html: getMarkerHtml(),
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    return (
        <Marker position={position} icon={icon}>
            <Popup className="custom-popup">
                <div className="p-1 min-w-[120px]">
                    <p className="text-[10px] font-bold text-badge-300 uppercase tracking-widest mb-1">Live Host</p>
                    <p className="text-sm font-[800] text-badge-700 font-mono">{batchId}</p>
                    <div className="mt-2 pt-2 border-t border-mist/50">
                        <Badge variant={threatLevel > 0 ? 'red' : 'olive'}>{status}</Badge>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

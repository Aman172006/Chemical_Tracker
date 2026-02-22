import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

/**
 * SpeedBadge — floating speed label near the current position
 */
export function SpeedBadge({ position, speed }) {
    if (!position || (position[0] === 0 && position[1] === 0) || speed == null) return null;

    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
      padding: 2px 6px;
      background: white;
      border: 1px solid #E4E9DF;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      color: #525252;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      pointer-events: none;
    ">${Number(speed).toFixed(1)} km/h</div>`,
        iconSize: [0, 0],
        iconAnchor: [-20, 8]
    });

    return (
        <Marker
            position={position}
            icon={icon}
            interactive={false}
        />
    );
}

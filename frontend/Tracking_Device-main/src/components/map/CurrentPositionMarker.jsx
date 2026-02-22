import React, { useMemo, useRef, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * CurrentPositionMarker — truck/vehicle icon that moves along the route.
 * Rotates based on heading direction. Map auto-follows the vehicle.
 */
export function CurrentPositionMarker({ position, previousPosition, threatLevel = 0, speed, shipmentId }) {
  if (!position || (position[0] === 0 && position[1] === 0)) return null;

  // Calculate heading from previous to current position
  const heading = useMemo(() => {
    if (!previousPosition || (previousPosition[0] === 0 && previousPosition[1] === 0)) return 0;
    const dLat = position[0] - previousPosition[0];
    const dLng = position[1] - previousPosition[1];
    if (Math.abs(dLat) < 0.000001 && Math.abs(dLng) < 0.000001) return 0;
    // atan2 gives angle from east, we need angle from north
    const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
    return angle;
  }, [position, previousPosition]);

  const colors = {
    0: '#6B8C3E',  // olive — normal
    1: '#D97706',  // amber — warning
    2: '#EA580C',  // orange — high
    3: '#DC2626'   // red — critical
  };
  const color = colors[threatLevel] || colors[0];

  // Truck SVG icon that rotates
  const icon = useMemo(() => L.divIcon({
    className: 'vehicle-marker',
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <!-- Pulse ring -->
        <div style="
          position:absolute;top:50%;left:50%;
          width:44px;height:44px;
          margin:-22px 0 0 -22px;
          border-radius:50%;
          background:${color};
          opacity:0.12;
          animation:vehicle-pulse 2s infinite ease-out;
        "></div>
        <!-- Vehicle container (rotatable) -->
        <div style="
          position:absolute;top:50%;left:50%;
          width:32px;height:32px;
          margin:-16px 0 0 -16px;
          transform:rotate(${heading}deg);
          transition:transform 0.8s ease;
        ">
          <!-- Truck SVG -->
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Shadow -->
            <ellipse cx="12" cy="22" rx="8" ry="2" fill="rgba(0,0,0,0.1)"/>
            <!-- Truck body -->
            <rect x="5" y="4" width="14" height="14" rx="3" fill="${color}" stroke="white" stroke-width="1.5"/>
            <!-- Cab window -->
            <rect x="7" y="5" width="10" height="5" rx="1.5" fill="white" opacity="0.35"/>
            <!-- Direction arrow -->
            <path d="M12 3L15 7H9L12 3Z" fill="white" opacity="0.9"/>
            <!-- Wheels -->
            <circle cx="8" cy="18" r="1.8" fill="#333" stroke="white" stroke-width="0.8"/>
            <circle cx="16" cy="18" r="1.8" fill="#333" stroke="white" stroke-width="0.8"/>
          </svg>
        </div>
        ${threatLevel === 3 ? `
          <div style="
            position:absolute;top:-4px;right:-4px;
            font-size:9px;font-weight:bold;
            color:white;background:#DC2626;
            width:16px;height:16px;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 1px 3px rgba(0,0,0,0.3);
            border:1.5px solid white;
          ">!</div>
        ` : ''}
      </div>
      <style>
        @keyframes vehicle-pulse {
          0% { transform: scale(1); opacity: 0.15; }
          100% { transform: scale(2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24]
  }), [color, heading, threatLevel]);

  return (
    <Marker position={position} icon={icon} zIndexOffset={1000}>
      <Popup>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', padding: '4px 0' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px', color: '#1E1E1E', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>🚛</span>
            {shipmentId || 'Vehicle'}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#525252' }}>
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </div>
          {speed != null && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6B8C3E', marginTop: '2px' }}>
              🏎️ {Number(speed).toFixed(1)} km/h
            </div>
          )}
          {heading !== 0 && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
              🧭 {heading.toFixed(0)}°
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

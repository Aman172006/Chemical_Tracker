import React, { useEffect, useRef } from 'react';
import { Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * DeviationPopup — auto-opens at current position when deviation detected
 */
export function DeviationPopup({ position, isDeviated, deviationDistance, toleranceMeters = 20, shipmentId, onAcknowledge }) {
    const map = useMap();
    const popupRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (!isDeviated || !position || (position[0] === 0 && position[1] === 0)) {
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            return;
        }

        // Create or update popup marker
        if (markerRef.current) {
            markerRef.current.setLatLng(position);
        } else {
            const popupContent = `
        <div style="
          font-family: 'Inter', sans-serif;
          padding: 12px;
          min-width: 220px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: 700;
            color: #D97706;
          ">
            ⚠️ ROUTE DEVIATION
          </div>
          <div style="
            font-family: 'JetBrains Mono', monospace;
            font-size: 20px;
            font-weight: 700;
            color: #92400E;
            margin-bottom: 4px;
          ">
            ${deviationDistance}m
          </div>
          <div style="font-size: 11px; color: #8A8A8A; margin-bottom: 10px;">
            from assigned route (tolerance: ${toleranceMeters}m)
          </div>
          <div style="font-size: 12px; color: #525252; margin-bottom: 12px; line-height: 1.5;">
            The shipment has left the assigned transport corridor.
          </div>
          <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #8A8A8A; margin-bottom: 8px;">
            ${shipmentId || ''}
          </div>
          <button
            onclick="document.dispatchEvent(new CustomEvent('ack-deviation'))"
            style="
              width: 100%;
              padding: 8px 16px;
              background: #D97706;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              font-family: 'Inter', sans-serif;
            "
          >
            Acknowledge
          </button>
        </div>
      `;

            const invisibleIcon = L.divIcon({
                className: 'custom-div-icon',
                html: '<div style="width:1px;height:1px;"></div>',
                iconSize: [1, 1],
                iconAnchor: [0, 0]
            });

            const marker = L.marker(position, { icon: invisibleIcon })
                .addTo(map)
                .bindPopup(popupContent, {
                    className: 'deviation-popup',
                    closeButton: false,
                    autoClose: false,
                    closeOnClick: false,
                    maxWidth: 280
                })
                .openPopup();

            markerRef.current = marker;
        }

        return () => {
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
        };
    }, [isDeviated, position?.[0], position?.[1], deviationDistance]);

    // Listen for acknowledge button click
    useEffect(() => {
        const handler = () => {
            if (onAcknowledge) onAcknowledge();
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
        };
        document.addEventListener('ack-deviation', handler);
        return () => document.removeEventListener('ack-deviation', handler);
    }, [onAcknowledge]);

    return null;
}

import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

/**
 * CheckpointMarkers — numbered markers showing crossed/pending status
 * Blue (pending), green (crossed)
 */
export function CheckpointMarkers({ checkpoints = [], crossedOrders = [] }) {
    if (!checkpoints || checkpoints.length === 0) return null;

    return (
        <>
            {checkpoints.map((cp) => {
                const isCrossed = crossedOrders.includes(cp.order);

                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="
                        width:24px;height:24px;
                        background:${isCrossed ? '#16A34A' : '#3B82F6'};
                        border:2px solid white;
                        border-radius:9999px;
                        box-shadow:0 2px 6px rgba(0,0,0,0.25);
                        display:flex;align-items:center;justify-content:center;
                        font-size:10px;font-weight:700;color:white;
                    ">${isCrossed ? '✓' : cp.order}</div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                return (
                    <Marker
                        key={`cp-${cp.order}`}
                        position={[cp.lat, cp.lng]}
                        icon={icon}
                    >
                        <Tooltip permanent={false} direction="right" offset={[12, 0]}>
                            <div style={{ fontFamily: 'Inter, sans-serif' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700 }}>
                                    {cp.label || `Checkpoint ${cp.order}`}
                                </div>
                                <div style={{ fontSize: '10px', color: isCrossed ? '#16A34A' : '#6B7280' }}>
                                    {isCrossed ? '✓ Crossed' : '⏳ Pending'}
                                </div>
                            </div>
                        </Tooltip>
                    </Marker>
                );
            })}
        </>
    );
}

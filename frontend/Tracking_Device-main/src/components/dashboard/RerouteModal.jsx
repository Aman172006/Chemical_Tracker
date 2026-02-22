import React, { useState, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { RouteBuilderMap } from './RouteBuilderMap';
import { AlertTriangle, Route, MapPin } from 'lucide-react';
import api from '../../services/api';

/**
 * RerouteModal — Owner sets a new route when road is blocked.
 * Generates OSRM route from current device position to new destination.
 * Old route is preserved in rerouteHistory (permanent audit log).
 */
export function RerouteModal({ isOpen, onClose, tripId, currentPosition, onRerouted }) {
    const [route, setRoute] = useState([]);
    const [checkpoints, setCheckpoints] = useState([]);
    const [reason, setReason] = useState('Road blocked');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = useCallback(async () => {
        if (route.length < 2) {
            setError('Please set the new route path first.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const res = await api.put(`/trip/${tripId}/reroute`, {
                newRoute: route.map(p => ({ lat: p.lat, lng: p.lng })),
                newCheckpoints: checkpoints,
                reason,
            });

            if (res.data?.status === 'success') {
                onRerouted?.(res.data.data);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reroute trip');
        } finally {
            setSaving(false);
        }
    }, [route, checkpoints, reason, tripId, onClose, onRerouted]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reroute Trip">
            <div className="space-y-4">
                {/* Warning */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                        <p className="font-semibold">Road blocked reroute</p>
                        <p className="mt-0.5 opacity-80">
                            This will replace the current route. The old route and reason are stored
                            permanently in the audit log. Add checkpoints for the new route.
                        </p>
                    </div>
                </div>

                {/* Current Position */}
                {currentPosition && (
                    <div className="flex items-center gap-2 text-xs text-badge-400 bg-cream rounded-xl px-3 py-2 border border-mist">
                        <MapPin className="w-3.5 h-3.5 text-olive-500" />
                        <span className="font-semibold">Device at:</span>
                        <span className="font-mono">{currentPosition[0]?.toFixed(4)}, {currentPosition[1]?.toFixed(4)}</span>
                    </div>
                )}

                {/* Reason */}
                <div>
                    <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1">Reason for reroute</label>
                    <input
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Road blocked, accident, etc."
                        className="w-full px-3 py-2 bg-cream border border-mist rounded-xl text-sm text-badge placeholder:text-badge-200 focus:ring-2 focus:ring-olive-300 outline-none"
                    />
                </div>

                {/* New Route Builder */}
                <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-2">
                        <Route className="w-3.5 h-3.5" /> New Route
                    </label>
                    <RouteBuilderMap
                        waypoints={route}
                        checkpoints={checkpoints}
                        onWaypointsChange={setRoute}
                        onCheckpointsChange={setCheckpoints}
                    />
                </div>

                {error && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-badge-400 bg-cream rounded-xl border border-mist hover:bg-mist transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || route.length < 2}
                        className="px-5 py-2 text-xs font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-all disabled:opacity-40"
                    >
                        {saving ? 'Rerouting...' : 'Apply New Route'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default RerouteModal;

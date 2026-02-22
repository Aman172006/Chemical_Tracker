import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Package, Lock, KeyRound, AlertTriangle } from 'lucide-react';
import { tripService } from '../services/tripService';
import { socketService } from '../services/socketService';
import { useRealtimeTracking } from '../hooks/useRealtimeTracking';
import { useLocationHistory } from '../hooks/useLocationHistory';
import { TrackingMap } from '../components/map/TrackingMap';
import { LiveLocationCard } from '../components/dashboard/LiveLocationCard';
import { DeviceStatusCard } from '../components/dashboard/DeviceStatusCard';
import { SealStatusCard } from '../components/dashboard/SealStatusCard';
import { LiveWeightCard } from '../components/dashboard/LiveWeightCard';

export function ClientTrackingPage() {
    const { secretId: urlSecretId } = useParams();
    const navigate = useNavigate();

    const [secretId, setSecretId] = useState(urlSecretId || '');
    const [inputId, setInputId] = useState('');
    const [tripId, setTripId] = useState(null);
    const [tripInfo, setTripInfo] = useState(null);
    const [validated, setValidated] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [expired, setExpired] = useState(false);

    const tracking = useRealtimeTracking(tripId);
    const { pathPoints } = useLocationHistory(tripId);

    // Validate secretId on mount or when secretId changes
    useEffect(() => {
        if (secretId) {
            validateSecret(secretId);
        }
    }, []);

    const validateSecret = async (id) => {
        setLoading(true);
        setError('');
        try {
            const res = await tripService.validateSecretId(id);
            const data = res.data.data;
            setTripId(data.tripId);
            setTripInfo(data);
            setValidated(true);
            setExpired(false);

            // Connect socket and join trip room
            socketService.connect();
            socketService.joinTrip(data.tripId);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired Secret ID');
            setValidated(false);
        } finally {
            setLoading(false);
        }
    };

    // Listen for secret-id-rotated → block screen
    useEffect(() => {
        if (!tripId) return;

        const handleRotated = (data) => {
            if (data.tripId === tripId) {
                setExpired(true);
                setValidated(false);
            }
        };

        const handleStatusChanged = (data) => {
            if (data.tripId === tripId && data.status === 'completed') {
                setTripInfo(prev => prev ? { ...prev, status: 'completed' } : prev);
            }
        };

        socketService.onSecretIdRotated(handleRotated);
        socketService.onTripStatusChanged(handleStatusChanged);

        return () => {
            socketService.offSecretIdRotated(handleRotated);
            socketService.offTripStatusChanged(handleStatusChanged);
            socketService.leaveTrip(tripId);
        };
    }, [tripId]);

    // Cleanup socket on unmount
    useEffect(() => {
        return () => {
            socketService.removeAllListeners();
            socketService.disconnect();
        };
    }, []);

    const handleSecretSubmit = (e) => {
        e.preventDefault();
        if (!inputId.trim()) return;
        setSecretId(inputId.trim());
        validateSecret(inputId.trim());
    };

    // ─── SECRET ID ENTRY / EXPIRED MODAL ─────────────────────
    if (!validated) {
        return (
            <div className="min-h-screen bg-off-white flex flex-col items-center justify-center p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-olive-500 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-badge tracking-wider uppercase">CHEMTRACK</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm"
                >
                    <div className="bg-white border border-mist rounded-2xl p-8 shadow-sm">
                        {expired ? (
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <Lock className="w-5 h-5 text-red-500" />
                                    <h2 className="text-lg font-bold text-badge">Secret ID Expired</h2>
                                </div>
                                <p className="text-xs text-badge-300 mb-6 leading-relaxed">
                                    Your access has been revoked. The Secret ID has been rotated.
                                    Contact the shipment owner for a new Secret ID.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <KeyRound className="w-5 h-5 text-olive-500" />
                                    <h2 className="text-lg font-bold text-badge">Track Shipment</h2>
                                </div>
                                <p className="text-xs text-badge-300 mb-6">
                                    Enter the Secret ID provided by the shipment owner.
                                </p>
                            </>
                        )}

                        <form onSubmit={handleSecretSubmit} className="space-y-4">
                            <input
                                type="text"
                                value={inputId}
                                onChange={e => setInputId(e.target.value.toUpperCase())}
                                placeholder="e.g. A3F7B2E9D1C4"
                                maxLength={12}
                                className="w-full px-3.5 py-3 bg-cream border border-mist rounded-xl text-sm text-badge font-mono tracking-widest text-center placeholder:text-badge-200 focus:ring-2 focus:ring-olive-300 focus:border-olive-400 outline-none transition-all"
                            />

                            {error && (
                                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !inputId.trim()}
                                className="w-full py-3 bg-olive-500 text-white text-sm font-semibold rounded-xl hover:bg-olive-600 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Validating...' : 'Access Tracking'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── TRACKING VIEW (validated) ────────────────────────────
    return (
        <div className="min-h-screen bg-off-white flex flex-col font-sans text-badge">
            {/* Header */}
            <header className="bg-white border-b border-mist px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-olive-500 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-badge tracking-wider uppercase">CHEMTRACK</h1>
                        <p className="text-[10px] text-badge-300 font-mono tracking-widest">RECEIVER VIEW</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {tripInfo?.chemicalName && (
                        <span className="text-xs text-badge-400 font-medium">{tripInfo.chemicalName}</span>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-cream rounded-lg border border-mist">
                        <Package className="w-3.5 h-3.5 text-olive-500" />
                        <span className="text-xs font-mono font-bold text-badge-500">{tripId}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-[1400px] mx-auto w-full">
                {/* Map */}
                <div className="lg:w-[65%] flex flex-col min-h-[500px]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 bg-white border border-mist rounded-[24px] overflow-hidden shadow-sm relative"
                    >
                        <TrackingMap
                            trackingData={tracking}
                            pathPoints={pathPoints}
                            shipment={{
                                startLocation: tripInfo?.startLocation,
                                endLocation: tripInfo?.endLocation,
                                // No plannedRoute for receiver view
                            }}
                        />
                    </motion.div>
                </div>

                {/* Info Cards */}
                <div className="lg:w-[35%] flex flex-col gap-4">
                    <LiveLocationCard
                        data={tracking}
                        lastUpdatedAgo={tracking.lastUpdatedAgo}
                        connectionStatus={tracking.connectionStatus}
                    />
                    <DeviceStatusCard
                        attached={tracking.deviceAttached}
                        secretId={secretId}
                        lastUpdatedAgo={tracking.lastUpdatedAgo}
                    />
                    <SealStatusCard intact={tracking.sealIntact} />
                    <LiveWeightCard
                        current={tracking.weightKg}
                        original={tripInfo?.liveData?.weight || 50}
                    />
                </div>
            </main>

            {/* Expired Overlay */}
            <AnimatePresence>
                {expired && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
                        >
                            <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-badge mb-2">Secret ID Expired</h2>
                            <p className="text-sm text-badge-300 mb-6">
                                Your Secret ID has been rotated. Contact the shipment owner for a new ID to continue tracking.
                            </p>
                            <form onSubmit={handleSecretSubmit} className="space-y-3">
                                <input
                                    type="text"
                                    value={inputId}
                                    onChange={e => setInputId(e.target.value.toUpperCase())}
                                    placeholder="Enter new Secret ID"
                                    className="w-full px-4 py-3 bg-cream border border-mist rounded-xl text-sm font-mono tracking-widest text-center outline-none focus:ring-2 focus:ring-olive-300"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !inputId.trim()}
                                    className="w-full py-3 bg-olive-500 text-white text-sm font-semibold rounded-xl hover:bg-olive-600 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Validating...' : 'Re-authenticate'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ClientTrackingPage;

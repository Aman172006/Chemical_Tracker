import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAlertContext } from '../context/AlertContext';
import { useShipments } from '../hooks/useShipments';
import { useRealtimeTracking } from '../hooks/useRealtimeTracking';
import { useLocationHistory } from '../hooks/useLocationHistory';
import { socketService } from '../services/socketService';

import { TopBar } from '../components/layout/TopBar';
import { StatsRow } from '../components/dashboard/StatsRow';
import { TrackingMap } from '../components/map/TrackingMap';
import { LiveLocationCard } from '../components/dashboard/LiveLocationCard';
import { DeviceStatusCard } from '../components/dashboard/DeviceStatusCard';
import { SealStatusCard } from '../components/dashboard/SealStatusCard';
import { LiveWeightCard } from '../components/dashboard/LiveWeightCard';
import { ShipmentList } from '../components/dashboard/ShipmentList';
import { ShipmentDetail } from '../components/dashboard/ShipmentDetail';
import { EventTimeline } from '../components/dashboard/EventTimeline';
import { CreateShipmentModal } from '../components/dashboard/CreateShipmentModal';
import { AssignClientModal } from '../components/dashboard/AssignClientModal';
import { AlertBanner } from '../components/alerts/AlertBanner';
import { CriticalAlertModal } from '../components/alerts/CriticalAlertModal';
import { RerouteModal } from '../components/dashboard/RerouteModal';


export function DashboardPage() {
    const { user } = useAuth();
    const { alerts, level1Alerts, level2Alerts, level3Alerts, loadAlerts, acknowledgeAlert } = useAlertContext();
    const {
        shipments, loading, selectedId, setSelectedId, selectedShipment,
        createShipment, startTrip, completeTrip, refreshTrips
    } = useShipments();

    const tracking = useRealtimeTracking(selectedId);
    const { pathPoints } = useLocationHistory(selectedId);

    // UI state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showAssignClient, setShowAssignClient] = useState(false);
    const [showRerouteModal, setShowRerouteModal] = useState(false);
    const [newSecretNotification, setNewSecretNotification] = useState(null);

    // Connect socket and join rooms on mount
    useEffect(() => {
        socketService.connect();
        if (user?.userId) socketService.joinOwnerRoom(user.userId);
        if (user?.role === 'admin') socketService.joinAdminRoom();

        return () => {
            socketService.removeAllListeners();
            socketService.disconnect();
        };
    }, [user]);

    // Join selected trip room for live tracking
    useEffect(() => {
        if (!selectedId) return;
        socketService.joinTrip(selectedId);
        loadAlerts(selectedId);

        return () => {
            socketService.leaveTrip(selectedId);
        };
    }, [selectedId, loadAlerts]);

    // Listen for new-secret-id events (owner only)
    useEffect(() => {
        const handleNewSecret = (data) => {
            setNewSecretNotification(data);
            refreshTrips();
            // Auto-dismiss after 10s
            setTimeout(() => setNewSecretNotification(null), 10000);
        };

        socketService.onNewSecretId(handleNewSecret);
        return () => socketService.offNewSecretId(handleNewSecret);
    }, [refreshTrips]);

    // Listen for trip-status-changed
    useEffect(() => {
        const handleStatusChange = () => refreshTrips();
        socketService.onTripStatusChanged(handleStatusChange);
        return () => socketService.offTripStatusChanged(handleStatusChange);
    }, [refreshTrips]);

    // Stats
    const dashboardStats = useMemo(() => ({
        active: shipments.filter(s => s.status !== 'completed' && s.status !== 'cancelled').length,
        transit: shipments.filter(s => s.status === 'active').length,
        alerts: [...level1Alerts, ...level2Alerts, ...level3Alerts].length,
        delivered: shipments.filter(s => s.status === 'completed').length
    }), [shipments, level1Alerts, level2Alerts, level3Alerts]);

    // Active L3 alert for critical modal
    const activeL3 = useMemo(() => {
        return level3Alerts.find(a => !a.acknowledged) || null;
    }, [level3Alerts]);

    const handleCreateShipment = async (data) => {
        const result = await createShipment(data);
        setShowCreateModal(false);
        return result;
    };

    return (
        <div className="min-h-screen bg-off-white flex flex-col font-sans text-badge">
            <TopBar title="Protocol Command" />

            <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full gap-6">
                {/* New Secret ID Notification */}
                <AnimatePresence>
                    {newSecretNotification && (
                        <div className="bg-olive-50 border border-olive-200 rounded-2xl p-4 flex items-center justify-between animate-slide-down">
                            <div>
                                <p className="text-xs font-semibold text-olive-700">🔐 New Secret ID Generated</p>
                                <p className="text-sm font-mono font-bold text-olive-600 mt-1">{newSecretNotification.secretId}</p>
                                <p className="text-[10px] text-olive-500 mt-0.5">Trip: {newSecretNotification.tripId} — Share this with receiver manually.</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(newSecretNotification.secretId);
                                }}
                                className="px-3 py-1.5 bg-olive-500 text-white text-xs font-semibold rounded-lg hover:bg-olive-600 transition-colors"
                            >
                                Copy ID
                            </button>
                        </div>
                    )}
                </AnimatePresence>

                {/* Alert Banners */}
                <AlertBanner
                    alerts={[...level1Alerts, ...level2Alerts].slice(0, 3)}
                    onAcknowledge={acknowledgeAlert}
                />

                {/* Stats Row */}
                <StatsRow stats={dashboardStats} />

                {/* Main Content: Map + Data */}
                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                    {/* Map Column */}
                    <div className="lg:w-[60%] flex flex-col min-h-[500px]">
                        <div className="flex-1 bg-white border border-mist rounded-[24px] overflow-hidden shadow-sm relative">
                            <TrackingMap
                                shipment={selectedShipment}
                                trackingData={tracking}
                                pathPoints={pathPoints}
                                onRequestReroute={() => setShowRerouteModal(true)}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:w-[40%] flex flex-col gap-4">
                        {/* Telemetry Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                            <LiveLocationCard
                                data={tracking}
                                lastUpdatedAgo={tracking.lastUpdatedAgo}
                                connectionStatus={tracking.connectionStatus}
                            />
                            <DeviceStatusCard
                                attached={tracking.deviceAttached}
                                secretId={selectedShipment?.currentSecretId}
                                lastUpdatedAgo={tracking.lastUpdatedAgo}
                            />
                            <SealStatusCard intact={tracking.sealIntact} />
                            <LiveWeightCard
                                current={tracking.weightKg}
                                original={selectedShipment?.baseWeight || 50}
                            />
                        </div>

                        {/* Shipment List */}
                        <ShipmentList
                            shipments={shipments}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onCreateNew={() => setShowCreateModal(true)}
                        />

                        {/* Event Timeline */}
                        <div className="bg-white border border-mist rounded-2xl p-5 shadow-sm">
                            <EventTimeline alerts={alerts} />
                        </div>
                    </div>
                </div>


            </main>

            {/* Modals */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateShipmentModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onSave={handleCreateShipment}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDetail && selectedShipment && (
                    <ShipmentDetail
                        shipment={selectedShipment}
                        onClose={() => setShowDetail(false)}
                        onAssignClient={() => {
                            setShowDetail(false);
                            setShowAssignClient(true);
                        }}
                        onStart={() => startTrip(selectedId)}
                        onComplete={() => completeTrip(selectedId)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAssignClient && selectedShipment && (
                    <AssignClientModal
                        isOpen={showAssignClient}
                        onClose={() => setShowAssignClient(false)}
                        shipment={selectedShipment}
                    />
                )}
            </AnimatePresence>

            {/* Level 3 Critical Modal */}
            {activeL3 && (
                <CriticalAlertModal
                    alert={activeL3}
                    onAcknowledge={acknowledgeAlert}
                />
            )}

            {/* Reroute Modal */}
            <AnimatePresence>
                {showRerouteModal && selectedShipment && (
                    <RerouteModal
                        isOpen={showRerouteModal}
                        onClose={() => setShowRerouteModal(false)}
                        tripId={selectedId}
                        currentPosition={[tracking?.lat || 0, tracking?.lng || 0]}
                        onRerouted={() => {
                            refreshTrips();
                            setShowRerouteModal(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default DashboardPage;

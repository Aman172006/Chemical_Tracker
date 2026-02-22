import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Package, FlaskConical, User2, Phone, FileText, Navigation, CheckCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { RouteBuilderMap } from './RouteBuilderMap';

/**
 * CreateShipmentModal — Set Path → Add Checkpoints → Activate Tracking
 * Sends: startLocation, endLocation, plannedRoute, checkpoints,
 * chemicalName, chemicalQuantity, receiverEmail, receiverPhone, notes
 */
export function CreateShipmentModal({ isOpen, onClose, onSave }) {
    const [form, setForm] = useState({
        chemicalName: '',
        chemicalQuantity: '',
        receiverEmail: '',
        receiverPhone: '',
        notes: '',
    });
    const [route, setRoute] = useState([]);
    const [checkpoints, setCheckpoints] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const update = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async () => {
        if (route.length < 2) {
            setError('Please set the route path first (Enter From/To addresses and click Set Path).');
            return;
        }
        if (checkpoints.length < 1) {
            setError('Please add at least 1 checkpoint on the map before activating tracking.');
            return;
        }

        setError('');
        setSaving(true);

        const payload = {
            startLocation: {
                lat: route[0].lat,
                lng: route[0].lng,
                address: 'Origin',
            },
            endLocation: {
                lat: route[route.length - 1].lat,
                lng: route[route.length - 1].lng,
                address: 'Destination',
            },
            plannedRoute: route.map(p => ({ lat: p.lat, lng: p.lng })),
            checkpoints: checkpoints,
            chemicalName: form.chemicalName || undefined,
            chemicalQuantity: form.chemicalQuantity || undefined,
            receiverEmail: form.receiverEmail || undefined,
            receiverPhone: form.receiverPhone || undefined,
            notes: form.notes || undefined,
        };

        try {
            await onSave(payload);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create trip');
            setSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-2 bg-cream border border-mist rounded-xl text-sm text-badge placeholder:text-badge-200 focus:ring-2 focus:ring-olive-300 focus:border-olive-400 outline-none transition-all";

    const isReady = route.length >= 2 && checkpoints.length >= 1;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Shipment">
            <div className="space-y-5">
                {/* Route Builder with address inputs + checkpoints */}
                <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-2">
                        <MapPin className="w-3.5 h-3.5" /> Route Planning
                    </label>
                    <RouteBuilderMap
                        waypoints={route}
                        checkpoints={checkpoints}
                        onWaypointsChange={setRoute}
                        onCheckpointsChange={setCheckpoints}
                    />
                </div>

                {/* Status Bar */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-cream border border-mist rounded-xl">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${route.length >= 2 ? 'text-olive-600' : 'text-badge-300'}`}>
                        <Navigation className="w-3.5 h-3.5" />
                        {route.length >= 2 ? '✓ Route set' : 'Route needed'}
                    </div>
                    <div className="w-px h-4 bg-mist" />
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${checkpoints.length >= 1 ? 'text-blue-600' : 'text-badge-300'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {checkpoints.length >= 1 ? `✓ ${checkpoints.length} checkpoint${checkpoints.length > 1 ? 's' : ''}` : 'Add checkpoints'}
                    </div>
                </div>

                {/* Chemical Info */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1">
                            <FlaskConical className="w-3 h-3" /> Chemical Name
                        </label>
                        <input value={form.chemicalName} onChange={update('chemicalName')} placeholder="Acetic Anhydride" className={inputClass} />
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1">
                            <Package className="w-3 h-3" /> Quantity
                        </label>
                        <input value={form.chemicalQuantity} onChange={update('chemicalQuantity')} placeholder="500 kg" className={inputClass} />
                    </div>
                </div>

                {/* Receiver Info */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1">
                            <User2 className="w-3 h-3" /> Receiver Email
                        </label>
                        <input type="email" value={form.receiverEmail} onChange={update('receiverEmail')} placeholder="receiver@test.com" className={inputClass} />
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1">
                            <Phone className="w-3 h-3" /> Receiver Phone
                        </label>
                        <input type="tel" value={form.receiverPhone} onChange={update('receiverPhone')} placeholder="+919876543211" className={inputClass} />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1">
                        <FileText className="w-3 h-3" /> Notes
                    </label>
                    <textarea
                        value={form.notes}
                        onChange={update('notes')}
                        placeholder="Handle with care..."
                        rows={2}
                        className={`${inputClass} resize-none`}
                    />
                </div>

                {error && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-badge-400 bg-cream rounded-xl border border-mist hover:bg-mist transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !isReady}
                        className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-40 ${isReady ? 'bg-olive-500 hover:bg-olive-600' : 'bg-badge-300'}`}
                    >
                        {saving ? 'Activating...' : '🚀 Activate Tracking'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default CreateShipmentModal;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ClientLoginPage — Receivers enter a Secret ID to track a shipment.
 * No auth needed — just redirects to /track after validating format.
 * Actual validation happens on the ClientTrackingPage.
 */
export function ClientLoginPage() {
    const navigate = useNavigate();
    const [secretId, setSecretId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const id = secretId.trim().toUpperCase();
        if (!id || id.length < 6) {
            setError('Please enter a valid Secret ID (at least 6 characters)');
            return;
        }
        navigate(`/track/${id}`);
    };

    return (
        <div className="min-h-screen bg-off-white flex flex-col items-center justify-center p-6">
            {/* Logo */}
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
                    <div className="flex items-center gap-2 mb-4">
                        <KeyRound className="w-5 h-5 text-olive-500" />
                        <h2 className="text-lg font-bold text-badge">Track Shipment</h2>
                    </div>
                    <p className="text-xs text-badge-300 mb-6">
                        Enter the Secret ID provided by the shipment owner to view real-time tracking.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            value={secretId}
                            onChange={e => setSecretId(e.target.value.toUpperCase())}
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
                            disabled={!secretId.trim()}
                            className="w-full py-3 bg-olive-500 text-white text-sm font-semibold rounded-xl hover:bg-olive-600 transition-all disabled:opacity-50"
                        >
                            Access Tracking
                        </button>
                    </form>
                </div>

                <div className="mt-4 text-center">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-badge-300 hover:text-badge-400 transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Back to home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default ClientLoginPage;

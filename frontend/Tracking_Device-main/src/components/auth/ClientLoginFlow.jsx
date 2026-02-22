import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Search, Package } from 'lucide-react';

export function ClientLoginFlow({ onLogin }) {
    const [secretId, setSecretId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!secretId.trim()) {
            setError('Please enter a tracking ID');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onLogin(secretId.trim());
        } catch {
            setError('Invalid tracking ID');
        }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
        >
            <div className="bg-white rounded-2xl border border-mist shadow-lg p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-olive-50 mb-4">
                        <Package className="w-8 h-8 text-olive-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-badge mb-2">Track Shipment</h2>
                    <p className="text-badge-300 text-sm">Enter your secret tracking ID to view shipment status</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-badge-500 uppercase tracking-wider mb-2">
                            Secret Tracking ID
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-badge-300" />
                            <input
                                type="text"
                                value={secretId}
                                onChange={(e) => setSecretId(e.target.value.toUpperCase())}
                                placeholder="CTK-XXXXXX"
                                className="w-full pl-10 pr-4 py-3 bg-cream border border-mist rounded-xl text-badge placeholder:text-badge-300 focus:outline-none focus:ring-2 focus:ring-olive-500/30 focus:border-olive-500 transition-all font-mono text-sm uppercase tracking-wider"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-center"
                            style={{ color: 'var(--alert-red)' }}
                        >
                            {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-olive-500 text-white font-semibold rounded-xl hover:bg-olive-600 transition-all disabled:opacity-50 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Search className="w-4 h-4" /> Track Package
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-badge-300">
                    Your tracking ID was provided by the shipment owner
                </p>
            </div>
        </motion.div>
    );
}

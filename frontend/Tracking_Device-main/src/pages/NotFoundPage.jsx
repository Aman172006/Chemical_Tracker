import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-off-white flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md"
            >
                <div className="w-20 h-20 bg-white border-2 border-mist rounded-[32px] flex items-center justify-center text-badge-100 mx-auto mb-8 shadow-sm">
                    <ShieldX size={40} />
                </div>
                <h1 className="text-4xl font-[900] text-badge tracking-tight mb-4 uppercase tracking-[0.1em]">Protocol Error</h1>
                <p className="text-sm font-semibold text-badge-300 leading-relaxed mb-10">
                    The requested protocol node does not exist or has been decommissioned from the central registry.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="h-14 px-10 bg-badge hover:bg-badge-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex items-center gap-3 mx-auto"
                >
                    <ArrowLeft size={18} />
                    Return to Registry
                </button>
            </motion.div>
        </div>
    );
};

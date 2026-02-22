import React from 'react';
import { Database, Link, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export function BlockchainLog({ proofs }) {
    if (!proofs || proofs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 bg-off-white border-2 border-dashed border-mist rounded-xl text-badge-200">
                <Database size={24} className="mb-2 opacity-50" />
                <p className="text-xs font-bold uppercase tracking-widest">Awaiting First Consensus</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {proofs.map((proof, idx) => (
                <motion.div
                    key={idx}
                    whileHover={{ scale: 1.01 }}
                    className="p-3 bg-white border border-mist rounded-xl hover:border-olive-300 transition-all cursor-pointer group shadow-xs"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-white border border-mist flex items-center justify-center group-hover:bg-olive-50 transition-colors">
                                <Link size={12} className="text-badge-300 group-hover:text-olive-600" />
                            </div>
                            <span className="text-[10px] font-bold text-badge-300 uppercase tracking-widest">Consensus Achieved</span>
                        </div>
                        <div className="flex items-center gap-1 text-olive-600">
                            <ShieldCheck size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="font-mono text-[11px] text-badge-500 font-bold truncate max-w-[240px]">
                            {proof.hash || '0x4f2a7b8e9c1d0a...'}
                        </p>
                        <ExternalLink size={12} className="text-mist group-hover:text-olive-400" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

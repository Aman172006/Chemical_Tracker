import React from 'react';
import { Shield, ArrowRight, Zap, Database, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
    const navigate = useNavigate();

    return (
        <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-off-white">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #6B8C3E 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white border border-olive-100 rounded-full mb-8 shadow-sm"
                    >
                        <Zap size={14} className="text-olive-500 fill-current" />
                        <span className="text-[10px] font-black text-olive-700 uppercase tracking-[0.2em]">Next-Gen Protocol Active</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-[900] text-badge tracking-tight leading-[1.1] mb-8"
                    >
                        End-to-End <br />
                        <span className="text-olive-600">Chemical Protocol</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-2xl text-lg md:text-xl font-medium text-badge-300 leading-relaxed mb-12"
                    >
                        Industrial-grade tracking with real-time telemetry, tamper-proof blockchain anchoring, and automated threat mitigation.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center gap-4"
                    >
                        <button
                            onClick={() => navigate('/owner-login')}
                            className="h-14 px-10 bg-olive-500 hover:bg-olive-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-olive-500/20 active:scale-[0.98] transition-all flex items-center gap-3 group"
                        >
                            Initialize Dashboard <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/client-login')}
                            className="h-14 px-10 bg-white border-2 border-mist text-badge-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:border-olive-500 hover:text-olive-600 transition-all active:scale-[0.98]"
                        >
                            Access Public Node
                        </button>
                    </motion.div>
                </div>

                {/* Floating Technical Elements */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: Map, label: 'Real-time GPS', sub: '5s update latency' },
                        { icon: Database, label: 'Chain of Custody', sub: 'Zero-knowledge proofs' },
                        { icon: Shield, label: 'Threat Protocol', sub: 'Automated lockdowns' }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (idx * 0.1) }}
                            className="bg-white/50 backdrop-blur-md border border-mist p-6 rounded-2xl flex items-center gap-4 shadow-sm"
                        >
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-mist flex items-center justify-center text-olive-500">
                                <item.icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-badge-700 uppercase tracking-tight">{item.label}</p>
                                <p className="text-[11px] font-bold text-badge-200 uppercase tracking-widest mt-0.5">{item.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

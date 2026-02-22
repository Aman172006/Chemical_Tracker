import React from 'react';
import { Package, Truck, ShieldCheck, Database, Sliders, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function FeaturesSection() {
    const features = [
        {
            title: 'Precision Telemetry',
            desc: 'Dual-band GPS combined with inertial sensors for sub-meter accuracy even in dense industrial environments.',
            icon: MapPin,
            color: 'olive'
        },
        {
            title: 'Blockchain Persistence',
            desc: 'Every checkpoint, variance, or alert is cryptographically anchored to an immutable ledger for audit compliance.',
            icon: Database,
            color: 'olive'
        },
        {
            title: 'Dynamic Threat Grid',
            desc: 'Automatic escalation protocols for route deviation, seal tampering, and unauthorized tracker removal.',
            icon: ShieldCheck,
            color: 'olive'
        }
    ];

    return (
        <section className="py-24 px-6 bg-white border-y border-mist">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                    <div className="max-w-2xl">
                        <h2 className="text-[10px] font-black text-olive-600 uppercase tracking-[0.3em] mb-4">Core Infrastructure</h2>
                        <h3 className="text-4xl font-[900] text-badge tracking-tight leading-tight">
                            Designed for Zero-Tolerance <br /> Logistic Operations.
                        </h3>
                    </div>
                    <p className="max-w-sm text-sm font-semibold text-badge-300 leading-relaxed mb-1">
                        The CHEMTRACK platform provides industrial entities with a unified command center for high-risk assets.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className="p-8 bg-off-white border border-mist rounded-[32px] transition-all hover:bg-white hover:shadow-xl group"
                        >
                            <div className="w-14 h-14 bg-white border border-mist rounded-2xl flex items-center justify-center text-olive-500 mb-8 group-hover:bg-olive-50 group-hover:border-olive-100 transition-colors shadow-sm">
                                <f.icon size={28} />
                            </div>
                            <h4 className="text-xl font-[900] text-badge-700 tracking-tight mb-4 uppercase tracking-wider">{f.title}</h4>
                            <p className="text-sm font-medium text-badge-400 leading-relaxed">
                                {f.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

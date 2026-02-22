import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThreatLevelExplainer() {
    const levels = [
        {
            level: 'Protocol 01',
            title: 'Route Deviation',
            desc: 'Triggered when asset movements exceed 500m variance from the assigned manifest routing.',
            color: 'amber',
            icon: AlertTriangle
        },
        {
            level: 'Protocol 02',
            title: 'Seal Compromise',
            desc: 'Real-time alert for seal integrity failure or weight variances exceeding 2% tolerance.',
            color: 'orange',
            icon: AlertCircle
        },
        {
            level: 'Protocol 03',
            title: 'Tracker Removal',
            desc: 'Critical hardware detachment or complete signal loss detected. Full system lockdown initiated.',
            color: 'red',
            icon: ShieldAlert
        }
    ];

    return (
        <section className="py-24 px-6 bg-cream border-b border-mist">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h3 className="text-[10px] font-black text-badge-200 uppercase tracking-[0.3em] mb-4">Threat Detection</h3>
                    <h2 className="text-4xl font-[900] text-badge tracking-tight">Security Escalation Framework</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {levels.map((l, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className={`
                p-10 rounded-[40px] border-2 bg-white flex flex-col items-center text-center shadow-lg transition-all hover:-translate-y-1
                ${l.color === 'amber' ? 'border-alert-amber/20 hover:border-alert-amber' :
                                    l.color === 'orange' ? 'border-alert-orange/20 hover:border-alert-orange' :
                                        'border-alert-red/20 hover:border-alert-red'}
              `}
                        >
                            <div className={`
                w-16 h-16 rounded-3xl flex items-center justify-center mb-10 shadow-lg
                ${l.color === 'amber' ? 'bg-alert-amber-bg text-alert-amber shadow-alert-amber/10' :
                                    l.color === 'orange' ? 'bg-alert-orange-bg text-alert-orange shadow-alert-orange/10' :
                                        'bg-alert-red-bg text-alert-red shadow-alert-red-glow'}
              `}>
                                <l.icon size={32} />
                            </div>
                            <p className={`text-[11px] font-[900] uppercase tracking-[0.2em] mb-3 ${l.color === 'amber' ? 'text-alert-amber' : l.color === 'orange' ? 'text-alert-orange' : 'text-alert-red'
                                }`}>
                                {l.level}
                            </p>
                            <h4 className="text-2xl font-[900] text-badge-700 tracking-tight mb-4 uppercase tracking-wider">{l.title}</h4>
                            <p className="text-sm font-semibold text-badge-300 leading-relaxed">
                                {l.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

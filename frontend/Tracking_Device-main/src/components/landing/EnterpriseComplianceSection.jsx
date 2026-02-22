import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileBadge, HardDrive, Route, ShieldAlert } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
    {
        icon: FileBadge,
        title: 'Immutable Audit Trails',
        desc: 'Every coordinate, temperature reading, and seal state change is cryptographically hashed and logged to an unalterable ledger. Perfect for DOT and DEA compliance.'
    },
    {
        icon: Route,
        title: 'Geofence Deviation Engine',
        desc: 'Upload standard delivery routes. If the shipment deviates beyond a 20-meter tolerance zone, it triggers immediate multi-channel alerts.'
    },
    {
        icon: ShieldAlert,
        title: 'Weight Anomalies (Skimming)',
        desc: 'High-precision load cells track continuous cargo weight. If mass decreases before the destination without authorization, the system locks down.'
    },
    {
        icon: HardDrive,
        title: 'Offline Redundancy',
        desc: 'If cellular signal is lost in remote areas, the node switches to encrypted local storage, force-syncing the buffer instantly upon reconnection.'
    }
];

export function EnterpriseComplianceSection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.feature-box',
                { opacity: 0, scale: 0.9, y: 30 },
                {
                    opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' }
                }
            );
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-32 bg-slate-900 border-t border-slate-800 relative z-10 overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-olive-900/20 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 lg:sticky lg:top-32 self-start space-y-6">
                    <div className="w-16 h-1 bg-olive-500 rounded-full" />
                    <h2 className="text-4xl font-extrabold leading-tight">
                        Built For Strict Industrial Compliance.
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Chemical transportation requires oversight that consumer tracking simply can't provide. ChemTrack replaces paperwork and trust with cryptographic proof.
                    </p>
                </div>

                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {FEATURES.map((feat, i) => (
                        <div key={i} className="feature-box group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-olive-500/50 p-8 rounded-2xl transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-slate-700/50 group-hover:bg-olive-500/20 flex items-center justify-center mb-6 transition-colors">
                                <feat.icon className="w-6 h-6 text-slate-300 group-hover:text-olive-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                {feat.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

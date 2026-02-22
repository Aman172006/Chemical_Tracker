import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function ProblemSolutionSection() {
    const sectionRef = useRef(null);
    const leftRef = useRef(null);
    const rightRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(leftRef.current,
                { opacity: 0, x: -50 },
                {
                    opacity: 1, x: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' }
                }
            );
            gsap.fromTo(rightRef.current,
                { opacity: 0, x: 50 },
                {
                    opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.2,
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' }
                }
            );

            // Floating pulse on icon
            gsap.to('.hero-alert-icon', {
                scale: 1.1, opacity: 0.8, duration: 1.5, repeat: -1, yoyo: true, ease: 'sine.inOut'
            });
            gsap.to('.hero-shield-icon', {
                y: -10, duration: 2, repeat: -1, yoyo: true, ease: 'power1.inOut'
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 bg-slate-900 text-white relative overflow-hidden border-t border-white/5 pb-32">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.05),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                {/* The Problem */}
                <div ref={leftRef} className="space-y-6">
                    <div className="flex items-center gap-3 text-red-400 font-mono tracking-widest text-sm uppercase font-bold">
                        <AlertTriangle className="w-5 h-5 hero-alert-icon" />
                        The Dual-Use Challenge
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                        Regulated Chemicals Are <span className="text-red-500 bg-red-500/10 px-2 rounded-lg border border-red-500/20">VULNERABLE</span> In Transit.
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Precursor chemicals like Acetic Anhydride are essential for industry, but highly sought after for illicit manufacturing. Traditional GPS tracking isn't enough when bad actors intercept cargo without breaking schedule.
                    </p>
                    <ul className="space-y-4 pt-4">
                        {[
                            'Blind spots between regional checkpoints',
                            'Undetected weight siphoning (skimming)',
                            'GPS spoofing and signal jamming',
                            'Lack of legal chain-of-custody audits'
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-300">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* The Solution */}
                <div ref={rightRef} className="glass-panel p-8 md:p-10 rounded-3xl border border-olive-500/20 bg-gradient-to-br from-olive-900/40 to-slate-900 shadow-[0_0_50px_rgba(132,204,22,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-olive-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="flex items-center gap-3 text-olive-400 font-mono tracking-widest text-sm uppercase font-bold mb-6">
                        <ShieldCheck className="w-6 h-6 hero-shield-icon" />
                        The ChemTrack Protocol
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6 text-white">
                        Absolute Chain of Custody.
                    </h2>
                    <p className="text-slate-300 text-lg leading-relaxed mb-8">
                        Our platform merges custom IoT hardware with an immutable cloud backend, establishing a continuous digital tether to your high-risk cargo from origin to destination.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { title: 'Continuous Telemetry', desc: '1Hz updates via ESP32 GSM/WiFi modules.' },
                            { title: 'Cryptographic Seals', desc: 'AES-256 encrypted tamper-evident sensors.' },
                            { title: 'Dynamic Geofencing', desc: '20m-radius automated path compliance.' },
                            { title: 'Payload Weight Auth', desc: 'Real-time load cell monitoring to detect skimming.' }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="text-olive-400 font-bold mb-1 text-sm">{feature.title}</div>
                                <div className="text-slate-400 text-xs leading-relaxed">{feature.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

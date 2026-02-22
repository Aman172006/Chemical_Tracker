import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Map, MapPin } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function InteractiveDashboardSection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.dash-preview-card',
                { y: 100, opacity: 0, rotateX: 20 },
                {
                    y: 0, opacity: 1, rotateX: 0, duration: 1.2, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' }
                }
            );

            // Animate simulated truck on map
            gsap.to('.sim-truck', {
                x: '200px', y: '100px', duration: 8,
                repeat: -1, yoyo: true, ease: 'sine.inOut'
            });

            // Pulse the active stats
            gsap.to('.sim-pulse', {
                opacity: 0.2, scale: 1.5, duration: 1.2, repeat: -1, ease: 'power1.out'
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/50 pattern-grid-lg opacity-40 mix-blend-multiply" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-slate-900 text-3xl md:text-5xl font-black tracking-tight mb-4">
                        Command Center Visibility
                    </h2>
                    <p className="text-slate-500 text-lg">
                        Every vital metric, instantly accessible. Our React-based dashboard syncs directly with the blockchain and RTDB for zero-latency monitoring.
                    </p>
                </div>

                <div className="dash-preview-card max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200" style={{ perspective: 1000 }}>
                    {/* Simulated Top Bar */}
                    <div className="h-12 bg-slate-900 flex items-center px-4 justify-between">
                        <div className="flex items-center gap-2 text-white font-bold text-sm tracking-widest">
                            <Activity className="w-4 h-4 text-olive-400" /> CHEMTRACK
                        </div>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                    </div>

                    {/* Simulated Dashboard Content */}
                    <div className="flex h-[400px] md:h-[500px]">
                        {/* Sidebar */}
                        <div className="flex-none w-64 border-r border-slate-100 p-4 hidden md:block bg-slate-50">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Active Shipments</div>

                            {[1, 2, 3].map(i => (
                                <div key={i} className={`p-3 rounded-xl border mb-3 ${i === 1 ? 'bg-olive-50 border-olive-200' : 'bg-white border-slate-200'}`}>
                                    <div className="text-xs font-mono font-bold text-slate-700">TRK-9824-A{i}X</div>
                                    <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                        <span>Nitric Acid</span>
                                        <span className={i === 1 ? 'text-olive-600 font-bold' : ''}>{i === 1 ? 'Live' : 'Completed'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Main Map View */}
                        <div className="flex-1 bg-blue-50/30 relative overflow-hidden">
                            {/* Abstract Map Background */}
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                            <svg className="absolute inset-0 w-full h-full stroke-slate-200" style={{ strokeWidth: 2 }}>
                                <path d="M 0,100 Q 150,150 200,300 T 500,200" fill="none" />
                            </svg>

                            {/* Simulated active tracking widget */}
                            <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-48">
                                <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-2 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Telemetry
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Speed</span>
                                        <span className="font-mono font-bold">65 km/h</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Weight</span>
                                        <span className="font-mono font-bold text-olive-600">500.0 kg</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Seal</span>
                                        <span className="font-mono font-bold text-green-600">Intact</span>
                                    </div>
                                </div>
                            </div>

                            {/* Simulated moving truck */}
                            <div className="sim-truck absolute top-[100px] left-[0px] w-8 h-8 bg-olive-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <MapPin className="w-4 h-4 text-white" />
                                <div className="sim-pulse absolute inset-0 bg-olive-500 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

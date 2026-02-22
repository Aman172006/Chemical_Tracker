import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PackageOpen, Navigation, AlertOctagon, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const PIPELINE_STEPS = [
    {
        icon: PackageOpen,
        title: 'Disptach & Sealing',
        desc: 'Cargo is loaded, precise weight is recorded, and electronic cryptographic seals are initialized globally.',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
        icon: Navigation,
        title: 'Active Telemetry',
        desc: 'The ESP32 tracking node broadcasts location, internal temperature, and seal integrity at 1-second intervals.',
        color: 'text-olive-400',
        bg: 'bg-olive-500/10 border-olive-500/20'
    },
    {
        icon: AlertOctagon,
        title: 'Anomaly Detection',
        desc: 'If the vehicle deviates >20m from the planned OSMR route, an immediate Level-3 alert is triggered autonomously.',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10 border-orange-500/20'
    },
    {
        icon: CheckCircle2,
        title: 'Secure Handover',
        desc: 'Receiver inputs a randomized ECDSA-signed Secret ID to finalize the trip and unlock the digital manifest.',
        color: 'text-green-400',
        bg: 'bg-green-500/10 border-green-500/20'
    }
];

export function MonitoringPipelineSection() {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.pipeline-card');

            // Staggered reveal of pipeline steps
            gsap.fromTo(cards,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.2,
                    ease: 'back.out(1.2)',
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 75%'
                    }
                }
            );

            // Animate the connecting line
            gsap.fromTo('.pipeline-connector-fill',
                { width: '0%' },
                {
                    width: '100%',
                    duration: 1.5,
                    ease: 'power2.inOut',
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 60%'
                    }
                }
            );

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <h2 className="text-slate-900 text-3xl md:text-5xl font-black tracking-tight mb-4">
                        The Zero-Trust Pipeline
                    </h2>
                    <p className="text-slate-500 text-lg">
                        Human verification fails. Our autonomous, hardware-enforced protocol ensures your shipments remain secure without manual intervention.
                    </p>
                </div>

                <div className="relative">
                    {/* Background connector line */}
                    <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-1 bg-slate-100 rounded-full z-0 overflow-hidden">
                        <div className="pipeline-connector-fill h-full bg-gradient-to-r from-blue-500 via-olive-500 to-green-500 w-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10">
                        {PIPELINE_STEPS.map((step, idx) => (
                            <div key={idx} className="pipeline-card bg-white border border-slate-200 p-6 rounded-2xl shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${step.bg}`}>
                                    <step.icon className={`w-6 h-6 ${step.color}`} />
                                </div>
                                <div className="text-xs font-mono font-bold text-slate-400 mb-2 uppercase tracking-widest">
                                    Phase 0{idx + 1}
                                </div>
                                <h3 className="text-slate-900 text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

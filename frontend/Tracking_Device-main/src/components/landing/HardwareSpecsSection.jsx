import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Cpu, Wifi, BatteryCharging, Scale, Thermometer, ShieldAlert } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const SPECS = [
    { icon: Cpu, label: 'Microcontroller', val: 'ESP32 / Dual-Core' },
    { icon: Wifi, label: 'Connectivity', val: 'GSM (SIM800L) & Wi-Fi' },
    { icon: BatteryCharging, label: 'Power Matrix', val: '5000mAh + Solar Option' },
    { icon: Scale, label: 'Load Cell API', val: '±0.5% Accuracy Weight Sensors' },
    { icon: Thermometer, label: 'Environment', val: 'DHT11 Temp/Humidity Probes' },
    { icon: ShieldAlert, label: 'Tamper Detection', val: 'Contact Switches & Accelerometer' }
];

export function HardwareSpecsSection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Blueprint scanline effect
            gsap.fromTo('.blueprint-scanline',
                { top: '-10%' },
                { top: '110%', duration: 3, ease: 'none', repeat: -1 }
            );

            // Hardware nodes pop-in
            gsap.fromTo('.hw-spec-card',
                { scale: 0.8, opacity: 0, rotationY: 15 },
                {
                    scale: 1, opacity: 1, rotationY: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.5)',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 60%' }
                }
            );

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 bg-slate-950 text-white relative overflow-hidden border-t-4 border-olive-500">
            {/* Blueprint Grid Background */}
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    linear-gradient(to right, rgba(132, 204, 22, 0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(132, 204, 22, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
            }} />
            <div className="blueprint-scanline absolute left-0 right-0 h-[2px] bg-olive-500/50 shadow-[0_0_20px_rgba(132,204,22,0.8)] z-0" />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 items-center">

                {/* Text Content */}
                <div className="space-y-6 lg:pr-12">
                    <div className="inline-block px-3 py-1 bg-olive-500/10 border border-olive-500/30 text-olive-400 font-mono tracking-widest text-xs uppercase font-bold rounded-full mb-2">
                        Hardware Infrastructure
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                        The EDGE-1 Node
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Software is meaningless without robust external data generation. Our custom ESP32-based EDGE-1 tracking modules are installed directly on transport vessels. They serialize real-world anomalies into cryptographic logs before transmission.
                    </p>

                    <div className="pt-6 grid grid-cols-2 gap-x-6 gap-y-8">
                        {SPECS.map((spec, i) => (
                            <div key={i} className="hw-spec-card flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-olive-400">
                                    <spec.icon className="w-4 h-4" />
                                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest">{spec.label}</span>
                                </div>
                                <div className="text-slate-200 text-sm font-semibold pl-6 border-l-2 border-slate-800">{spec.val}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3D Blueprint Visualization */}
                <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square bg-slate-900/50 rounded-3xl border border-olive-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center backdrop-blur-sm group">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-olive-500/10 to-transparent pointer-events-none" />

                    {/* Simulated ESP32 Board */}
                    <div className="relative w-64 h-80 bg-slate-900 border-2 border-olive-500/40 rounded-lg shadow-2xl flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-700">
                        <div className="w-16 h-16 bg-slate-800 border-2 border-slate-700 rounded-sm mb-8 relative">
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-[pulse_1s_infinite]" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full px-8">
                            <div className="h-6 bg-slate-800 rounded border border-slate-700" />
                            <div className="h-6 bg-slate-800 rounded border border-slate-700" />
                            <div className="h-6 bg-slate-800 rounded border border-slate-700" />
                            <div className="h-6 bg-slate-800 rounded border border-slate-700" />
                        </div>

                        {/* Connection lines to labels */}
                        <div className="absolute -left-16 top-1/4 h-px w-16 bg-olive-500/50" />
                        <div className="absolute -right-16 top-1/2 h-px w-16 bg-olive-500/50" />
                    </div>

                    {/* Floating Labels */}
                    <div className="absolute top-[20%] left-[5%] px-3 py-1 bg-slate-900 border border-olive-500/30 text-[10px] font-mono text-olive-400 rounded-lg shadow-lg">
                        Dual-Core CPU
                    </div>
                    <div className="absolute border border-olive-500/30 top-[45%] right-[5%] px-3 py-1 bg-slate-900 text-[10px] font-mono text-olive-400 rounded-lg shadow-lg">
                        SIM800L Module
                    </div>
                </div>

            </div>
        </section>
    );
}

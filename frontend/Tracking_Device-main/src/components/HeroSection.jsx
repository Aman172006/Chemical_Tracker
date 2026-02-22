import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Shield, Truck, MapPin, CheckCircle2, ArrowRight, ThermometerSnowflake, Lock, Activity, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fixed particles for subtle tech background
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${(i * 37 + 13) % 100}%`,
    top: `${(i * 53 + 7) % 100}%`,
    delay: (i * 0.7) % 6,
    duration: 6 + (i % 5) * 1.5,
    size: Math.random() > 0.8 ? 3 : 1.5,
    opacity: Math.random() * 0.5 + 0.1,
}));

// Live Activity Log Data
const LOGS = [
    { time: '08:15:22', msg: 'Transport seal verified secure.' },
    { time: '09:02:14', msg: 'Telemetry sync established.' },
    { time: '10:42:05', msg: 'Checkpoint Alpha cleared.' },
    { time: '11:18:44', msg: 'Route deviation baseline calculated.' },
    { time: 'Live', msg: 'Monitoring payload temperature...' }
];

export default function HeroSection() {
    const heroRef = useRef(null);
    const tlRef = useRef(null);
    const [activeLogIndex, setActiveLogIndex] = useState(0);

    // Simulate incoming logs
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveLogIndex((prev) => (prev < LOGS.length - 1 ? prev + 1 : prev));
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Master Timeline with cinematic easing
            const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
            tlRef.current = tl;

            // 1. Reveal Background Atmosphere
            tl.fromTo('.hero-grid-overlay', { opacity: 0 }, { opacity: 1, duration: 1.5 });
            tl.fromTo('.hero-scanline', { y: '-100%' }, { y: '100%', duration: 4, repeat: -1, ease: 'none', opacity: 0.4 }, 0);
            tl.fromTo('.hero-radar-sweep', { rotation: 0 }, { rotation: 360, duration: 8, repeat: -1, ease: 'none' }, 0);

            // 2. Animate Left Content (Cinematic 3D Entrance)
            gsap.set('.hero-text-col > *', { perspective: 1000 });
            tl.fromTo('.hero-badge',
                { opacity: 0, y: 30, rotationX: -30, z: -50 },
                { opacity: 1, y: 0, rotationX: 0, z: 0, duration: 1 }, 0.2);

            tl.fromTo('.hero-title-line',
                { opacity: 0, y: 40, rotationX: -40, z: -100, transformOrigin: "50% 100% -50" },
                { opacity: 1, y: 0, rotationX: 0, z: 0, duration: 1.2, stagger: 0.15 }, 0.4);

            tl.fromTo('.hero-desc',
                { opacity: 0, y: 30, rotationX: -20 },
                { opacity: 1, y: 0, rotationX: 0, duration: 1 }, 0.8);

            tl.fromTo('.hero-cta-group',
                { opacity: 0, y: 30, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.8 }, 1.0);

            // 3. Reveal Tracking Widget with Deep 3D Transform
            tl.fromTo('.hero-widget-perspective',
                { opacity: 0, x: 100, rotationY: -15, rotationX: 10, scale: 0.85, z: -200 },
                { opacity: 1, x: 0, rotationY: -5, rotationX: 2, scale: 1, z: 0, duration: 1.5, ease: 'expo.out' }, 0.5);

            // Draw abstract background route map
            const abstractPaths = gsap.utils.toArray('.abstract-route-path');
            abstractPaths.forEach(path => {
                const len = path.getTotalLength();
                gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
                tl.to(path, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, 1.0);
            });

            // 4. Tracking Pipeline Animation Sequence
            tl.to('.tracking-progress-fill', { width: '75%', duration: 2.5, ease: 'power3.inOut' }, 1.5);

            // Nodes sequential firing
            const staggerBase = 1.5;
            // Node 1
            tl.to('.node-1', { scale: 1.1, autoAlpha: 1, duration: 0.4 }, staggerBase);
            tl.to('.node-1 .node-icon', { color: '#84cc16', filter: 'drop-shadow(0 0 10px rgba(132, 204, 22, 0.8))', duration: 0.3 }, staggerBase);
            tl.fromTo('.node-1 .node-label', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, staggerBase + 0.1);

            // Node 2
            tl.to('.node-2', { scale: 1.1, autoAlpha: 1, duration: 0.4 }, staggerBase + 0.8);
            tl.to('.node-2 .node-icon', { color: '#84cc16', filter: 'drop-shadow(0 0 10px rgba(132, 204, 22, 0.8))', duration: 0.3 }, staggerBase + 0.8);
            tl.fromTo('.node-2 .node-label', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, staggerBase + 0.9);

            // Node 3 (Active)
            tl.to('.node-3', { scale: 1.25, autoAlpha: 1, duration: 0.6, ease: 'back.out(2.5)' }, staggerBase + 1.6);
            tl.to('.node-3 .node-icon', { color: '#a3e635', filter: 'drop-shadow(0 0 12px rgba(163, 230, 53, 0.8))', duration: 0.4 }, staggerBase + 1.6);
            tl.fromTo('.node-3 .node-label', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, staggerBase + 1.7);

            // Active Node Continuous Pulse
            gsap.to('.node-3 .pulse-ring-inner', { scale: 1.8, opacity: 0, duration: 1.2, repeat: -1, ease: 'power1.out', delay: staggerBase + 2.0 });
            gsap.to('.node-3 .pulse-ring-outer', { scale: 2.8, opacity: 0, duration: 2, repeat: -1, ease: 'power2.out', delay: staggerBase + 2.0 });

            // 5. Floating Glassmorphic Badges
            tl.fromTo('.floating-badge',
                { opacity: 0, scale: 0.5, y: 50 },
                { opacity: 1, scale: 1, y: 0, duration: 1, stagger: 0.2, ease: 'back.out(1.5)' }, 2.0);

            // Endless hover animation for badges
            gsap.to('.floating-badge-1', { y: -15, rotationX: 5, rotationY: -5, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 3.0 });
            gsap.to('.floating-badge-2', { y: 15, x: 10, rotationX: -5, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 3.2 });
            gsap.to('.floating-badge-3', { y: -10, rotationY: 10, duration: 3.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 3.4 });

        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section className="hero-section" ref={heroRef}>
            {/* Ultra-Premium Background Atmosphere */}
            <div className="hero-grid-overlay" />
            <div className="hero-scanline" />
            <div className="hero-glow hero-glow-left" />
            <div className="hero-glow hero-glow-right" />
            <div className="hero-glow hero-glow-center" />

            {/* Global Radar Sweep behind right section */}
            <div className="hero-radar-container absolute inset-0 pointer-events-none opacity-20" style={{ zIndex: 0 }}>
                <div className="hero-radar-sweep absolute right-[0%] top-[-10%] w-[1000px] h-[1000px] rounded-full border border-olive-500/10"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent 0deg, rgba(132, 204, 22, 0.05) 90deg, transparent 90deg)'
                    }}
                />
            </div>

            <div className="hero-particles">
                {PARTICLES.map((p) => (
                    <span
                        key={p.id}
                        className="hero-particle"
                        style={{
                            left: p.left,
                            top: p.top,
                            animationDelay: `${p.delay}s`,
                            animationDuration: `${p.duration}s`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            opacity: p.opacity,
                        }}
                    />
                ))}
            </div>

            <div className="hero-content-modern relative z-10 w-full max-w-[1400px] mx-auto flex items-center justify-between gap-12 px-8">
                {/* LEFT: Cinematic Value Proposition */}
                <div className="hero-text-col max-w-[550px]">
                    <div className="hero-badge">
                        <Shield className="w-4 h-4 text-olive-400" />
                        <span className="text-olive-300 font-bold">
                            Military-Grade Chemical Security
                        </span>
                    </div>

                    <h1 className="hero-title">
                        <div className="hero-title-line">Track Your</div>
                        <div className="hero-title-line highlight">Chemical Shipments</div>
                        <div className="hero-title-line">With Precision.</div>
                    </h1>

                    <p className="hero-desc text-white/70">
                        Industrial-grade tracking architecture delivering real-time route monitoring, predictive deviation alerts, and tamper-evident logging for critical payload security.
                    </p>

                    <div className="hero-cta-group">
                        <Link to="/owner-login" className="hero-btn-primary btn-glare-effect relative overflow-hidden group">
                            <span className="relative z-10 flex items-center font-bold">
                                Owner Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                        <Link to="/client-login" className="hero-btn-secondary">
                            Track Shipment
                        </Link>
                    </div>

                    {/* Live Activity Stream (Sleek text feed) */}
                    <div className="live-activity-stream mt-12 bg-black/40 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-2 text-olive-400 text-xs font-bold tracking-widest uppercase">
                                <Activity className="w-4 h-4 animate-pulse" />
                                Live Telemetry Feed
                            </div>
                            <span className="text-[10px] text-badge-500 font-mono">STREAM: ACTIVE</span>
                        </div>
                        <div className="stream-logs h-[72px] relative z-10">
                            {LOGS.map((log, idx) => (
                                <div
                                    key={idx}
                                    className={`stream-log-item tracking-mono text-sm flex gap-4 transition-all duration-500 absolute w-full`}
                                    style={{
                                        opacity: idx <= activeLogIndex ? (idx === activeLogIndex ? 1 : 0.4) : 0,
                                        transform: `translateY(${(idx - activeLogIndex) * 28}px)`,
                                        visibility: idx > activeLogIndex + 2 || idx < activeLogIndex - 2 ? 'hidden' : 'visible'
                                    }}
                                >
                                    <span className={idx === activeLogIndex ? "text-olive-400 font-bold" : "text-badge-500"}>[{log.time}]</span>
                                    <span className={idx === activeLogIndex ? "text-white font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-badge-300"}>{log.msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Ultra-Premium Tracking Widget & Surroundings */}
                <div className="hero-widget-col hero-widget-perspective relative w-full max-w-[700px]">

                    {/* Abstract SVG Route Map Background */}
                    <svg className="abstract-route-svg absolute inset-0 w-[140%] h-[140%] top-[-20%] left-[-20%] pointer-events-none z-0" viewBox="0 0 400 300">
                        <path className="abstract-route-path" fill="none" stroke="rgba(132, 204, 22, 0.2)" strokeWidth="2" strokeDasharray="4,6" d="M 40,260 C 100,260 120,180 180,180 C 240,180 260,220 320,220 C 380,220 380,100 450,100" />
                        <circle cx="40" cy="260" r="4" fill="rgba(132, 204, 22, 0.3)" />
                        <circle cx="180" cy="180" r="4" fill="rgba(132, 204, 22, 0.3)" />
                        <circle cx="320" cy="220" r="4" fill="rgba(132, 204, 22, 0.3)" />
                        <circle cx="450" cy="100" r="6" fill="rgba(163, 230, 53, 0.6)" className="animate-pulse" />
                    </svg>

                    {/* Floating Glassmorphic Badges */}
                    <div className="floating-badge floating-badge-1 absolute top-[-40px] left-[-60px] z-20 glass-panel px-5 py-4 rounded-2xl flex items-center gap-4 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] bg-slate-900/60 backdrop-blur-xl">
                        <div className="badge-icon-bg bg-blue-500/20 border border-blue-500/40 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                            <ThermometerSnowflake className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="badge-data flex flex-col gap-0.5">
                            <span className="badge-label text-[10px] text-badge-300 uppercase tracking-[0.2em] font-bold">Internal Temp</span>
                            <span className="badge-val text-blue-300 font-bold tracking-mono text-xl drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]">-4.2°C</span>
                        </div>
                    </div>

                    <div className="floating-badge floating-badge-2 absolute bottom-[100px] right-[-50px] z-20 glass-panel px-5 py-4 rounded-2xl flex items-center gap-4 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] bg-slate-900/60 backdrop-blur-xl">
                        <div className="badge-icon-bg bg-olive-500/20 border border-olive-500/40 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(132,204,22,0.3)]">
                            <Lock className="w-6 h-6 text-olive-400" />
                        </div>
                        <div className="badge-data flex flex-col gap-0.5">
                            <span className="badge-label text-[10px] text-badge-300 uppercase tracking-[0.2em] font-bold">Seal Integrity</span>
                            <span className="badge-val text-olive-400 text-sm font-bold tracking-widest mt-1 drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]">AES-SECURED</span>
                        </div>
                    </div>

                    <div className="floating-badge floating-badge-3 absolute top-[140px] right-[-70px] z-20 glass-panel px-5 py-4 rounded-2xl flex items-center gap-4 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] bg-slate-900/60 backdrop-blur-xl">
                        <div className="badge-icon-bg bg-purple-500/20 border border-purple-500/40 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                            <Radio className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="badge-data flex flex-col gap-0.5">
                            <span className="badge-label text-[10px] text-badge-300 uppercase tracking-[0.2em] font-bold">Signal</span>
                            <span className="badge-val text-purple-300 tracking-mono font-bold text-xl drop-shadow-[0_0_8px_rgba(216,180,254,0.5)]">98% TX</span>
                        </div>
                    </div>

                    {/* Main Widget */}
                    <div className="tracking-widget glass-panel premium-border relative z-10 bg-slate-900/70 border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none"></div>

                        {/* Widget Header */}
                        <div className="widget-header border-b border-dashed border-white/10 pb-6 mb-8 relative z-10">
                            <div className="widget-header-left">
                                <span className="tracking-id tracking-mono bg-clip-text text-transparent bg-gradient-to-r from-white to-badge-300 text-2xl font-black block mb-2 drop-shadow-md">TRK-9824-A1X</span>
                                <span className="tracking-status-badge glow-badge border-olive-500/50 bg-olive-500/10 text-olive-400 px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase inline-flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-olive-400 animate-pulse"></span>
                                    Live Tracking
                                </span>
                            </div>
                            <div className="widget-header-right text-right">
                                <span className="eta-label block text-[10px] text-badge-400 uppercase tracking-[0.2em] font-bold mb-2">Estimated Arrival</span>
                                <span className="eta-time text-white text-xl font-bold font-mono tracking-tight drop-shadow-md">14:30 EST</span>
                            </div>
                        </div>

                        {/* Visual Pipeline */}
                        <div className="widget-pipeline-container relative py-4 mb-8 z-10">
                            <div className="tracking-progress-bg absolute top-[28px] left-6 right-6 h-1.5 bg-white/5 rounded-full z-0 shadow-inner">
                                <div className="tracking-progress-fill absolute top-0 left-0 h-full bg-gradient-to-r from-olive-600 to-olive-400 rounded-full shadow-[0_0_20px_rgba(132,204,22,0.8)]" style={{ width: '0%' }}>
                                    {/* Glowing leading edge */}
                                    <div className="progress-fill-head absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_25px_#fff]"></div>
                                </div>
                            </div>

                            <div className="tracking-nodes flex justify-between relative z-10 px-2">
                                {/* Node 1 */}
                                <div className="tracking-node node-1 opacity-50 flex flex-col items-center w-24 text-center">
                                    <div className="node-icon-wrapper w-12 h-12 bg-slate-800/80 border-2 border-white/10 rounded-full flex items-center justify-center mb-4 transition-all duration-300 backdrop-blur-md">
                                        <CheckCircle2 className="w-6 h-6 node-icon text-badge-500" />
                                    </div>
                                    <div className="node-label flex flex-col gap-1">
                                        <div className="node-title text-sm font-bold text-badge-200">Dispatched</div>
                                        <div className="node-time tracking-mono text-[11px] text-badge-400">08:15 AM</div>
                                    </div>
                                </div>

                                {/* Node 2 */}
                                <div className="tracking-node node-2 opacity-50 flex flex-col items-center w-24 text-center">
                                    <div className="node-icon-wrapper w-12 h-12 bg-slate-800/80 border-2 border-white/10 rounded-full flex items-center justify-center mb-4 transition-all duration-300 backdrop-blur-md">
                                        <CheckCircle2 className="w-6 h-6 node-icon text-badge-500" />
                                    </div>
                                    <div className="node-label flex flex-col gap-1">
                                        <div className="node-title text-sm font-bold text-badge-200">Checkpoint</div>
                                        <div className="node-time tracking-mono text-[11px] text-badge-400">10:42 AM</div>
                                    </div>
                                </div>

                                {/* Node 3 (Active) */}
                                <div className="tracking-node node-3 opacity-50 flex flex-col items-center w-24 text-center">
                                    <div className="node-icon-wrapper active w-14 h-14 bg-olive-900 border-2 border-olive-400 rounded-full flex items-center justify-center mb-3 relative shadow-[0_0_25px_rgba(132,204,22,0.4)]">
                                        <div className="pulse-ring-inner absolute inset-0 border-2 border-olive-400 rounded-full"></div>
                                        <div className="pulse-ring-outer absolute inset-0 border border-olive-500/50 rounded-full"></div>
                                        <Truck className="w-7 h-7 node-icon text-white relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                                    </div>
                                    <div className="node-label active flex flex-col gap-1 mt-1">
                                        <div className="node-title text-olive-400 font-bold tracking-widest uppercase text-xs drop-shadow-[0_0_8px_rgba(132,204,22,0.4)]">In Transit</div>
                                        <div className="node-time text-olive-300 tracking-mono font-bold text-xs">Zone 4 (Live)</div>
                                    </div>
                                </div>

                                {/* Node 4 (Pending) */}
                                <div className="tracking-node node-4 opacity-50 flex flex-col items-center w-24 text-center">
                                    <div className="node-icon-wrapper w-12 h-12 bg-slate-800/40 border-2 border-dashed border-badge-600 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                                        <MapPin className="w-6 h-6 node-icon text-badge-500" />
                                    </div>
                                    <div className="node-label flex flex-col gap-1">
                                        <div className="node-title text-sm font-bold text-badge-400">Delivered</div>
                                        <div className="node-time tracking-mono text-[11px] text-badge-500">Pending</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Update Message */}
                        <div className="widget-footer tracking-status-msg glass-footer flex items-center gap-3 bg-black/40 p-5 rounded-xl border border-white/5 relative z-10">
                            <span className="live-dot-ultra w-2.5 h-2.5 bg-alert-green rounded-full shadow-[0_0_12px_var(--alert-green)] animate-[pulse-green_2s_infinite]"></span>
                            <span className="live-text font-medium text-sm text-badge-200">
                                Velocity stable at 65 km/h. Route deviation: <span className="text-olive-400 font-bold tracking-mono text-base">0m</span>.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

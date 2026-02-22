import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CTASection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.cta-content',
                { opacity: 0, scale: 0.95, y: 40 },
                {
                    opacity: 1, scale: 1, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%'
                    }
                }
            );

            // Subtle gradient shift
            gsap.to('.cta-bg-gradient', {
                backgroundPosition: '200% center',
                duration: 20,
                repeat: -1,
                ease: 'linear'
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="relative py-32 overflow-hidden bg-slate-950 flex items-center justify-center border-t border-olive-500/20">
            {/* Animated Gradient Background */}
            <div className="cta-bg-gradient absolute inset-0 opacity-20" style={{
                backgroundImage: 'linear-gradient(90deg, #1e293b, #0f172a, #3f6212, #0f172a, #1e293b)',
                backgroundSize: '200% auto'
            }} />

            {/* Ambient glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-olive-500/20 blur-[150px] rounded-full pointer-events-none" />

            <div className="cta-content relative z-10 w-full max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-olive-400 to-olive-600 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(132,204,22,0.4)]">
                    <Shield className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
                    Secure Your Chemical <br className="hidden md:block" /> Supply Chain Today.
                </h2>

                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                    Stop relying on manual verification. Deploy autonomous, cryptographically-secured tracking nodes and attain absolute visibility over your shipments.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                    <Link to="/owner-login" className="w-full sm:w-auto px-8 py-4 bg-olive-500 rounded-xl text-white font-bold tracking-wide hover:bg-olive-400 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] group">
                        Access Owner Dashboard
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/client-login" className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white border border-slate-700 font-bold tracking-wide rounded-xl hover:bg-slate-700 hover:border-slate-600 transition-all text-center">
                        Track Existing Shipment
                    </Link>
                </div>

                <div className="mt-12 text-slate-500 text-sm font-mono uppercase tracking-widest flex items-center gap-2 justify-center">
                    <span className="w-2 h-2 rounded-full bg-olive-500 animate-pulse" />
                    System Online • API Operational
                </div>
            </div>
        </section>
    );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import HeroSection from '../components/HeroSection';
import { ProblemSolutionSection } from '../components/landing/ProblemSolutionSection';
import { MonitoringPipelineSection } from '../components/landing/MonitoringPipelineSection';
import { HardwareSpecsSection } from '../components/landing/HardwareSpecsSection';
import { InteractiveDashboardSection } from '../components/landing/InteractiveDashboardSection';
import { EnterpriseComplianceSection } from '../components/landing/EnterpriseComplianceSection';
import { CTASection } from '../components/landing/CTASection';

export function LandingPage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-off-white flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-mist bg-white shadow-sm relative z-50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-olive-500 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-badge tracking-wider uppercase">CHEMTRACK</span>
                </div>
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 bg-olive-500 text-white text-xs font-semibold rounded-lg hover:bg-olive-600 transition-colors"
                        >
                            Go to Dashboard →
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/client-login"
                                className="px-4 py-2 text-xs font-semibold text-badge-500 hover:text-badge transition-colors"
                            >
                                Track Shipment
                            </Link>
                            <Link
                                to="/owner-login"
                                className="px-4 py-2 bg-olive-500 text-white text-xs font-semibold rounded-lg hover:bg-olive-600 transition-colors"
                            >
                                Owner Login
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* Hero — Animated TRACK YOUR PRODUCT */}
            <HeroSection />

            {/* Industrial Grade Sections */}
            <ProblemSolutionSection />
            <MonitoringPipelineSection />
            <HardwareSpecsSection />
            <InteractiveDashboardSection />
            <EnterpriseComplianceSection />
            <CTASection />

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center">
                <p className="text-xs text-slate-500 font-mono">
                    CHEMTRACK © {new Date().getFullYear()} — Secure Chemical Transport Protocol
                </p>
            </footer>
        </div>
    );
}

export default LandingPage;

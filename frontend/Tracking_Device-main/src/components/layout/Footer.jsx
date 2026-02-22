import React from 'react';
import { Shield } from 'lucide-react';

export const Footer = () => {
    return (
        <footer style={{
            background: 'var(--bg-primary)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '80px 24px 40px 24px'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '48px' }}>
                        <div style={{ maxWidth: '320px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <Shield size={20} style={{ color: 'var(--accent-primary)' }} />
                                <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>CHEMTRACK</span>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', lineHeight: 1.6, margin: 0 }}>
                                Hardware-anchored, blockchain-verified tracking for dual-use precursor chemicals.
                                Defeating diversion through immutable audit trails and real-time telemetry.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '64px' }} className="footer-links">
                            <style>{`@media(max-width:640px){.footer-links{grid-template-columns:1fr; gap:32px}}`}</style>
                            <div>
                                <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Infrastructure</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {['Hardware Nodes', 'Polygon Mainnet', 'API Runtime', 'Security Protocol'].map(link => (
                                        <li key={link} style={{ fontSize: '13px', color: 'var(--text-tertiary)', cursor: 'not-allowed' }}>{link}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Compliance</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {['Regulatory Audit', 'Data Privacy', 'Terms of Usage', 'SLA'].map(link => (
                                        <li key={link} style={{ fontSize: '13px', color: 'var(--text-tertiary)', cursor: 'not-allowed' }}>{link}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Monitoring</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <li style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                                        Network Status: OK
                                    </li>
                                    {['Operational Log', 'Audit History'].map(link => (
                                        <li key={link} style={{ fontSize: '13px', color: 'var(--text-tertiary)', cursor: 'not-allowed' }}>{link}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        paddingTop: '32px', borderTop: '1px solid var(--border-subtle)',
                        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px'
                    }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                            © 2024 CHEMTRACK SYSTEMS INC. SECURED ARCHITECTURE.
                        </p>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)',
                            fontFamily: '"JetBrains Mono", monospace'
                        }}>
                            <span>AUTH_VERSION: 1.0.4r</span>
                            <span style={{ color: 'var(--accent-primary)' }}>[MAINNET_LIVE]</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

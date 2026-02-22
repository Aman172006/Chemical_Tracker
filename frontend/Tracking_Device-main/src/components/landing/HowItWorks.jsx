import React from 'react';
import { motion } from 'framer-motion';

const Step = ({ number, title, description, isLast }) => (
    <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #3B6BFB 0%, #7B5BF2 100%)',
                color: '#fff', fontSize: '20px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '24px', position: 'relative', zIndex: 10,
                boxShadow: '0 8px 24px rgba(59, 107, 251, 0.3)'
            }}>
                {number}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '200px', margin: 0, lineHeight: 1.5 }}>{description}</p>
        </div>
        {!isLast && (
            <div style={{
                position: 'absolute', top: '24px', left: 'calc(50% + 24px)',
                width: 'calc(100% - 48px)', height: '1px',
                borderBottom: '1px dashed var(--border-default)',
                opacity: 0.5
            }} className="hidden md:block" />
        )}
    </div>
);

export const HowItWorks = () => {
    const steps = [
        { title: "Anchor", description: "Hardware tags are initialized at origin and anchored to a unique blockchain ID." },
        { title: "Transmit", description: "Consignment emits encrypted telemetry pulses across verified GPS corridors." },
        { title: "Surveil", description: "Real-time AI monitors for spatial deviation or physical seal anomalies." },
        { title: "Finalize", description: "Recipient verifies immutable ledger state before cryptographic handover." }
    ];

    return (
        <section style={{ py: '100px', px: '24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }} className="py-24">
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <span style={{
                        display: 'inline-block', padding: '4px 12px', background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-default)', borderRadius: '9999px',
                        color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px'
                    }}>Internal Protocol</span>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)' }}>Standard Operational Procedure</h2>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px' }} className="how-it-works-grid">
                    <style>{`@media(max-width:768px){.how-it-works-grid{flex-direction:column; gap:64px}}`}</style>
                    {steps.map((step, idx) => (
                        <Step
                            key={idx}
                            number={idx + 1}
                            title={step.title}
                            description={step.description}
                            isLast={idx === steps.length - 1}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

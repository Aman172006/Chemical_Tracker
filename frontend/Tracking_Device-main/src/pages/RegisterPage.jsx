import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowLeft, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export function RegisterPage() {
    const navigate = useNavigate();
    const { register, sendPhoneOtp, verifyPhoneOtp } = useAuth();

    // Auth mode
    const [authMode, setAuthMode] = useState('email'); // 'email' | 'phone'

    // Email form
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'owner' });

    // Phone form
    const [phoneForm, setPhoneForm] = useState({ phone: '', name: '', role: 'owner' });
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
    const updatePhone = (key) => (e) => setPhoneForm(prev => ({ ...prev, [key]: e.target.value }));

    // ── EMAIL REGISTER ──────────────────────────────
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password || !form.name || !form.phone) {
            setError('All fields are required');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/dashboard');
        } catch (err) {
            const code = err.code;
            if (code === 'auth/email-already-in-use') setError('Email already registered. Try logging in.');
            else if (code === 'auth/weak-password') setError('Password must be at least 6 characters');
            else if (code === 'auth/invalid-email') setError('Invalid email address');
            else setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // ── PHONE REGISTER — SEND OTP ───────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!phoneForm.phone || phoneForm.phone.length < 10) {
            setError('Enter a valid phone number with country code');
            return;
        }
        if (!phoneForm.name || phoneForm.name.length < 2) {
            setError('Name is required');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await sendPhoneOtp(phoneForm.phone, 'recaptcha-container');
            setOtpSent(true);
        } catch (err) {
            if (err.code === 'auth/billing-not-enabled') setError('Phone auth requires Firebase Blaze plan. Please use Email registration instead, or upgrade your Firebase billing.');
            else if (err.code === 'auth/invalid-phone-number') setError('Invalid phone number. Include country code (e.g. +919876543210)');
            else setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // ── PHONE REGISTER — VERIFY OTP ─────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length < 6) {
            setError('Enter the 6-digit OTP');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await verifyPhoneOtp(otp, { name: phoneForm.name, role: phoneForm.role });
            navigate('/dashboard');
        } catch (err) {
            if (err.code === 'auth/invalid-verification-code') setError('Incorrect OTP');
            else setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3.5 py-2.5 bg-cream border border-mist rounded-xl text-sm text-badge placeholder:text-badge-200 focus:ring-2 focus:ring-olive-300 focus:border-olive-400 outline-none transition-all";

    return (
        <div className="min-h-screen bg-off-white flex flex-col items-center justify-center p-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-olive-500 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-badge tracking-wider uppercase">CHEMTRACK</span>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="bg-white border border-mist rounded-2xl p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-badge mb-1">Create Account</h2>
                    <p className="text-xs text-badge-300 mb-5">Register to start managing chemical shipments.</p>

                    {/* Auth Mode Tabs */}
                    <div className="flex gap-1 bg-cream border border-mist rounded-xl p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => { setAuthMode('email'); setError(''); setOtpSent(false); }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${authMode === 'email' ? 'bg-olive-500 text-white shadow-sm' : 'text-badge-400 hover:text-badge'}`}
                        >
                            <Mail className="w-3.5 h-3.5" /> Email
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('phone'); setError(''); }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${authMode === 'phone' ? 'bg-olive-500 text-white shadow-sm' : 'text-badge-400 hover:text-badge'}`}
                        >
                            <Phone className="w-3.5 h-3.5" /> Phone
                        </button>
                    </div>

                    {/* EMAIL FORM */}
                    {authMode === 'email' && (
                        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Full Name</label>
                                <input type="text" value={form.name} onChange={update('name')} placeholder="John Doe" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Email</label>
                                <input type="email" value={form.email} onChange={update('email')} placeholder="owner@chemtrack.com" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Password</label>
                                <input type="password" value={form.password} onChange={update('password')} placeholder="Min 6 characters" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Phone</label>
                                <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+919876543210" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Role</label>
                                <select value={form.role} onChange={update('role')} className={inputClass}>
                                    <option value="owner">Owner</option>
                                    <option value="receiver">Receiver</option>
                                </select>
                            </div>

                            {error && (
                                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
                            )}

                            <button type="submit" disabled={loading} className="w-full py-3 bg-olive-500 text-white text-sm font-semibold rounded-xl hover:bg-olive-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    {/* PHONE FORM */}
                    {authMode === 'phone' && (
                        <>
                            {!otpSent ? (
                                <form onSubmit={handleSendOtp} className="space-y-3.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Full Name</label>
                                        <input type="text" value={phoneForm.name} onChange={updatePhone('name')} placeholder="John Doe" className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                                        <input type="tel" value={phoneForm.phone} onChange={updatePhone('phone')} placeholder="+919876543210" className={inputClass} />
                                        <p className="text-[10px] text-badge-300 mt-1">Include country code (e.g. +91)</p>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Role</label>
                                        <select value={phoneForm.role} onChange={updatePhone('role')} className={inputClass}>
                                            <option value="owner">Owner</option>
                                            <option value="receiver">Receiver</option>
                                        </select>
                                    </div>

                                    {error && (
                                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
                                    )}

                                    <button type="submit" disabled={loading} className="w-full py-3 bg-olive-500 text-white text-sm font-semibold rounded-xl hover:bg-olive-600 transition-all disabled:opacity-50">
                                        {loading ? 'Sending OTP...' : 'Send OTP'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Enter OTP</label>
                                        <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" maxLength={6} className={`${inputClass} text-center tracking-[0.5em] font-mono text-lg`} />
                                        <p className="text-[10px] text-badge-300 mt-1">Sent to {phoneForm.phone}</p>
                                    </div>

                                    {error && (
                                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
                                    )}

                                    <button type="submit" disabled={loading} className="w-full py-3 bg-olive-500 text-white text-sm font-semibold rounded-xl hover:bg-olive-600 transition-all disabled:opacity-50">
                                        {loading ? 'Verifying...' : 'Verify & Register'}
                                    </button>

                                    <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setError(''); }} className="w-full py-2 text-xs text-badge-400 hover:text-badge transition-colors">
                                        ← Change number
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    <div className="mt-4 text-center">
                        <Link to="/owner-login" className="text-xs text-olive-500 hover:text-olive-600 font-medium">
                            Already have an account? Sign In
                        </Link>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-badge-300 hover:text-badge-400 transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Back to home
                    </Link>
                </div>

                {/* Invisible reCAPTCHA container for phone auth */}
                <div id="recaptcha-container"></div>
            </motion.div>
        </div>
    );
}

export default RegisterPage;

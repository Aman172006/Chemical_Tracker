import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowLeft, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export function OwnerLoginPage() {
    const navigate = useNavigate();
    const { login, sendPhoneOtp, verifyPhoneOtp } = useAuth();

    // Auth mode
    const [authMode, setAuthMode] = useState('email'); // 'email' | 'phone'

    // Email state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Phone state
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Common state
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ── EMAIL LOGIN ─────────────────────────────────
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Email and password are required');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            const code = err.code;
            if (code === 'auth/user-not-found') setError('No account found with this email');
            else if (code === 'auth/wrong-password') setError('Incorrect password');
            else if (code === 'auth/invalid-credential') setError('Invalid email or password');
            else if (code === 'auth/too-many-requests') setError('Too many attempts. Try again later.');
            else setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    // ── PHONE LOGIN — SEND OTP ──────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!phone || phone.length < 10) {
            setError('Enter a valid phone number with country code (e.g. +919876543210)');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await sendPhoneOtp(phone, 'recaptcha-container');
            setOtpSent(true);
        } catch (err) {
            if (err.code === 'auth/billing-not-enabled') setError('Phone auth requires Firebase Blaze plan. Please use Email login instead, or upgrade your Firebase billing.');
            else if (err.code === 'auth/invalid-phone-number') setError('Invalid phone number format. Include country code (e.g. +919876543210)');
            else if (err.code === 'auth/too-many-requests') setError('Too many OTP requests. Try again later.');
            else setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // ── PHONE LOGIN — VERIFY OTP ────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length < 6) {
            setError('Enter the 6-digit OTP');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await verifyPhoneOtp(otp);
            navigate('/dashboard');
        } catch (err) {
            if (err.code === 'auth/invalid-verification-code') setError('Incorrect OTP. Try again.');
            else setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3.5 py-2.5 bg-cream border border-mist rounded-xl text-sm text-badge placeholder:text-badge-200 focus:ring-2 focus:ring-olive-300 focus:border-olive-400 outline-none transition-all";

    return (
        <div className="min-h-screen bg-off-white flex flex-col items-center justify-center p-6">
            {/* Logo */}
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
                    <h2 className="text-lg font-bold text-badge mb-1">Owner Login</h2>
                    <p className="text-xs text-badge-300 mb-5">Sign in to access the command dashboard.</p>

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
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="owner@chemtrack.com" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                            </div>

                            {error && (
                                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
                            )}

                            <button type="submit" disabled={loading} className="w-full py-3 bg-olive-500 text-white text-sm font-semibold rounded-xl hover:bg-olive-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    )}

                    {/* PHONE FORM */}
                    {authMode === 'phone' && (
                        <>
                            {!otpSent ? (
                                <form onSubmit={handleSendOtp} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-badge-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+919876543210" className={inputClass} />
                                        <p className="text-[10px] text-badge-300 mt-1">Include country code (e.g. +91)</p>
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
                                        <p className="text-[10px] text-badge-300 mt-1">Sent to {phone}</p>
                                    </div>

                                    {error && (
                                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
                                    )}

                                    <button type="submit" disabled={loading} className="w-full py-3 bg-olive-500 text-white text-sm font-semibold rounded-xl hover:bg-olive-600 transition-all disabled:opacity-50">
                                        {loading ? 'Verifying...' : 'Verify & Sign In'}
                                    </button>

                                    <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setError(''); }} className="w-full py-2 text-xs text-badge-400 hover:text-badge transition-colors">
                                        ← Change number
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    <div className="mt-4 text-center">
                        <Link to="/register" className="text-xs text-olive-500 hover:text-olive-600 font-medium">
                            Don't have an account? Register
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

export default OwnerLoginPage;

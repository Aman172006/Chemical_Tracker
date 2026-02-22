import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPhoneNumber,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth, setupRecaptcha } from '../config/firebase';
import api from '../services/api';
import { socketService } from '../services/socketService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                // Get ID token and sync with backend
                try {
                    const idToken = await fbUser.getIdToken();
                    const res = await api.post('/auth/login', {}, {
                        headers: { Authorization: `Bearer ${idToken}` },
                    });
                    const u = res.data.data.user;
                    setUser(u);
                    localStorage.setItem('user', JSON.stringify(u));
                    localStorage.setItem('firebaseToken', idToken);
                } catch (err) {
                    // User exists in Firebase but not in Firestore — first-time login check
                    const saved = localStorage.getItem('user');
                    if (saved) setUser(JSON.parse(saved));
                }
            } else {
                setUser(null);
                localStorage.removeItem('user');
                localStorage.removeItem('firebaseToken');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Set up axios interceptor to always use fresh Firebase token
    useEffect(() => {
        const interceptorId = api.interceptors.request.use(async (config) => {
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        return () => api.interceptors.request.eject(interceptorId);
    }, []);

    // ── EMAIL/PASSWORD REGISTER ──────────────────────
    const register = useCallback(async ({ email, password, name, phone, role }) => {
        // 1. Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        // 2. Sync profile to backend/Firestore
        const res = await api.post('/auth/register',
            { name, phone, role },
            { headers: { Authorization: `Bearer ${idToken}` } }
        );

        const u = res.data.data.user;
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
        localStorage.setItem('firebaseToken', idToken);

        // Connect socket
        socketService.connect();
        if (u.role === 'owner') socketService.joinOwnerRoom(u.userId);
        if (u.role === 'admin') socketService.joinAdminRoom();

        return u;
    }, []);

    // ── EMAIL/PASSWORD LOGIN ─────────────────────────
    const login = useCallback(async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        // Sync with backend
        const res = await api.post('/auth/login', {}, {
            headers: { Authorization: `Bearer ${idToken}` },
        });

        const u = res.data.data.user;
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
        localStorage.setItem('firebaseToken', idToken);

        // Connect socket
        socketService.connect();
        if (u.role === 'owner') socketService.joinOwnerRoom(u.userId);
        if (u.role === 'admin') socketService.joinAdminRoom();

        return u;
    }, []);

    // ── PHONE AUTH — SEND OTP ────────────────────────
    const sendPhoneOtp = useCallback(async (phoneNumber, recaptchaContainerId = 'recaptcha-container') => {
        const appVerifier = setupRecaptcha(recaptchaContainerId);
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        // Store confirmation result so we can verify later
        window.confirmationResult = confirmationResult;
        return confirmationResult;
    }, []);

    // ── PHONE AUTH — VERIFY OTP ──────────────────────
    const verifyPhoneOtp = useCallback(async (otp, { name, role } = {}) => {
        if (!window.confirmationResult) {
            throw new Error('No OTP request found. Please request OTP first.');
        }

        const userCredential = await window.confirmationResult.confirm(otp);
        const idToken = await userCredential.user.getIdToken();
        const phoneNumber = userCredential.user.phoneNumber;

        // Try login first (existing user)
        try {
            const res = await api.post('/auth/login', {}, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            const u = res.data.data.user;
            setUser(u);
            localStorage.setItem('user', JSON.stringify(u));
            localStorage.setItem('firebaseToken', idToken);

            socketService.connect();
            if (u.role === 'owner') socketService.joinOwnerRoom(u.userId);
            if (u.role === 'admin') socketService.joinAdminRoom();

            return u;
        } catch {
            // New user — register
            const res = await api.post('/auth/register',
                { name: name || phoneNumber, phone: phoneNumber, role: role || 'owner' },
                { headers: { Authorization: `Bearer ${idToken}` } }
            );
            const u = res.data.data.user;
            setUser(u);
            localStorage.setItem('user', JSON.stringify(u));
            localStorage.setItem('firebaseToken', idToken);

            socketService.connect();
            if (u.role === 'owner') socketService.joinOwnerRoom(u.userId);

            return u;
        }
    }, []);

    // ── LOGOUT ───────────────────────────────────────
    const logout = useCallback(async () => {
        socketService.removeAllListeners();
        socketService.disconnect();
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('firebaseToken');
    }, []);

    const value = {
        user,
        firebaseUser,
        loading,
        login,
        register,
        sendPhoneOtp,
        verifyPhoneOtp,
        logout,
        isAuthenticated: !!user,
        isOwner: user?.role === 'owner',
        isAdmin: user?.role === 'admin',
        isReceiver: user?.role === 'receiver',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export default AuthContext;

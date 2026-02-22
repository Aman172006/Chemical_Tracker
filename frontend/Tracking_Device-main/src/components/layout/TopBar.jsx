import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Bell, Settings, LogOut, Shield } from 'lucide-react';

export function TopBar({ title = 'CHEMTRACK' }) {
    const { user, logout, isAuthenticated } = useAuth();

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border-b border-mist px-6 py-3 flex items-center justify-between sticky top-0 z-[5000]"
            style={{ boxShadow: 'var(--shadow-xs)' }}
        >
            {/* Left: Logo + Title */}
            <Link to="/" className="flex items-center gap-3 no-underline">
                <div className="w-9 h-9 rounded-xl bg-olive-500 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-badge tracking-wider uppercase">
                        {title}
                    </h1>
                    <p className="text-[10px] text-badge-300 font-mono tracking-widest">
                        CHEMICAL TRACKING PROTOCOL
                    </p>
                </div>
            </Link>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
                {user && (
                    <div className="hidden sm:flex items-center gap-2 mr-3 px-3 py-1.5 bg-cream rounded-lg border border-mist">
                        <div className="w-2 h-2 rounded-full bg-olive-500" />
                        <span className="text-xs font-mono text-badge-500">
                            {user.name || user.email}
                        </span>
                    </div>
                )}

                <button className="p-2 rounded-lg hover:bg-cream transition-colors text-badge-400 hover:text-badge relative">
                    <Bell className="w-5 h-5" />
                </button>

                <button className="p-2 rounded-lg hover:bg-cream transition-colors text-badge-400 hover:text-badge">
                    <Settings className="w-5 h-5" />
                </button>

                {user && (
                    <button
                        onClick={logout}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-badge-400 hover:text-red-500"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
        </motion.header>
    );
}

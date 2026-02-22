import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, AlertTriangle, CheckCircle } from 'lucide-react';

export function StatsRow({ stats }) {
    const items = [
        {
            label: 'Active',
            value: stats?.active || 0,
            icon: Package,
            color: 'text-olive-500',
            bg: 'bg-olive-50'
        },
        {
            label: 'In Transit',
            value: stats?.transit || 0,
            icon: Truck,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        },
        {
            label: 'Alerts',
            value: stats?.alerts || 0,
            icon: AlertTriangle,
            color: stats?.alerts > 0 ? 'text-amber-500' : 'text-badge-300',
            bg: stats?.alerts > 0 ? 'bg-amber-50' : 'bg-gray-50'
        },
        {
            label: 'Delivered',
            value: stats?.delivered || 0,
            icon: CheckCircle,
            color: 'text-green-500',
            bg: 'bg-green-50'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, i) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-mist rounded-2xl p-4 shadow-sm flex items-center gap-4"
                >
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold font-mono text-badge">{item.value}</p>
                        <p className="text-xs text-badge-300 font-medium">{item.label}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

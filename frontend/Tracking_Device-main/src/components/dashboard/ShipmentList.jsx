import React from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Package } from 'lucide-react';
import { ShipmentCard } from './ShipmentCard';

export function ShipmentList({ shipments, selectedId, onSelect, onCreateNew }) {
    const [search, setSearch] = React.useState('');

    const filtered = shipments.filter(s => {
        const q = search.toLowerCase();
        return (
            (s.tripId || '').toLowerCase().includes(q) ||
            (s.chemicalName || '').toLowerCase().includes(q) ||
            (s.startLocation?.address || '').toLowerCase().includes(q) ||
            (s.endLocation?.address || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="bg-white border border-mist rounded-2xl shadow-sm flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-mist">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-olive-500" />
                        <span className="text-xs font-bold text-badge uppercase tracking-wider">Shipments</span>
                        <span className="text-[10px] bg-olive-50 text-olive-600 px-1.5 py-0.5 rounded-full font-mono font-bold">
                            {shipments.length}
                        </span>
                    </div>
                    {onCreateNew && (
                        <button
                            onClick={onCreateNew}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-olive-500 text-white text-xs font-semibold rounded-lg hover:bg-olive-600 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> New
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-badge-300" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search shipments..."
                        className="w-full pl-9 pr-3 py-2 bg-cream border border-mist rounded-xl text-sm text-badge placeholder:text-badge-300 focus:outline-none focus:ring-2 focus:ring-olive-500/20 focus:border-olive-400 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {filtered.length === 0 ? (
                    <div className="text-center py-8">
                        <Package className="w-8 h-8 text-badge-200 mx-auto mb-2" />
                        <p className="text-sm text-badge-300">No shipments found</p>
                    </div>
                ) : (
                    filtered.map(shipment => (
                        <ShipmentCard
                            key={shipment.tripId}
                            shipment={shipment}
                            isSelected={shipment.tripId === selectedId}
                            onClick={() => onSelect(shipment.tripId)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

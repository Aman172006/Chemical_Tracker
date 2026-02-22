import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_TILES, MAP_ATTRIBUTION, DEFAULT_CENTER } from '../../utils/constants';
import { Trash2, Search, MapPin, Flag, CheckCircle, Navigation, Crosshair } from 'lucide-react';

// ── ICONS ────────────────────────────────────────
function createIcon(color, size = 12, label = '') {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid white;
      border-radius:9999px;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;
      font-size:8px;font-weight:700;color:white;
    ">${label}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

const originIcon = createIcon('#16A34A', 18);
const destIcon = createIcon('#DC2626', 18);
const checkpointIcon = (num) => createIcon('#3B82F6', 22, num);

// ── GEOCODE (Nominatim free API) ─────────────────
async function geocode(address) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        return data.map(r => ({
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
            display: r.display_name,
        }));
    } catch {
        return [];
    }
}

// ── DOUGLAS-PEUCKER SIMPLIFICATION ───────────────
// Keeps points at curves/turns, removes redundant straight-line points.
// This preserves the road shape unlike uniform sampling.
function perpendicularDist(point, lineStart, lineEnd) {
    const dx = lineEnd.lng - lineStart.lng;
    const dy = lineEnd.lat - lineStart.lat;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((point.lng - lineStart.lng) ** 2 + (point.lat - lineStart.lat) ** 2);
    const t = Math.max(0, Math.min(1, ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) / lenSq));
    const projLng = lineStart.lng + t * dx;
    const projLat = lineStart.lat + t * dy;
    return Math.sqrt((point.lng - projLng) ** 2 + (point.lat - projLat) ** 2);
}

function douglasPeucker(points, epsilon) {
    if (points.length <= 2) return points;
    let maxDist = 0, maxIdx = 0;
    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDist(points[i], points[0], points[points.length - 1]);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    if (maxDist > epsilon) {
        const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
        const right = douglasPeucker(points.slice(maxIdx), epsilon);
        return left.slice(0, -1).concat(right);
    }
    return [points[0], points[points.length - 1]];
}

function simplifyRoute(points) {
    if (points.length <= 300) return points;
    // Auto-choose epsilon based on route scale: start small, increase until under 800 points
    let epsilon = 0.0001; // ~11 meters
    let result = douglasPeucker(points, epsilon);
    while (result.length > 800 && epsilon < 0.01) {
        epsilon *= 1.5;
        result = douglasPeucker(points, epsilon);
    }
    return result;
}

// ── OSRM ROAD ROUTE ──────────────────────────────
async function getOSRMRoute(from, to) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates;
            const full = coords.map(c => ({ lat: c[1], lng: c[0] }));
            // Douglas-Peucker: preserves road shape, removes only redundant straight-segment points
            return simplifyRoute(full);
        }
        return null;
    } catch {
        return null;
    }
}

// ── MAP CLICK HANDLER ────────────────────────────
function CheckpointClickHandler({ enabled, onMapClick }) {
    useMapEvents({
        click(e) {
            if (enabled) {
                onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
            }
        }
    });
    return null;
}

// ── FIT BOUNDS ───────────────────────────────────
function FitBounds({ route }) {
    const map = useMap();
    useEffect(() => {
        if (route && route.length > 1) {
            const bounds = L.latLngBounds(route.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [route, map]);
    return null;
}

// ── ADDRESS INPUT WITH AUTOCOMPLETE ──────────────
function AddressInput({ label, icon: Icon, value, onChange, onSelect, placeholder, action }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);

    const handleInputChange = (val) => {
        onChange(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.length > 2) {
            debounceRef.current = setTimeout(async () => {
                const results = await geocode(val);
                setSuggestions(results);
                setShowSuggestions(true);
            }, 400);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    return (
        <div className="relative flex flex-col justify-end h-full">
            <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1 text-[11px] font-semibold text-badge-400 uppercase tracking-wider">
                    <Icon className="w-3 h-3" /> {label}
                </label>
                {action && <div>{action}</div>}
            </div>
            <input
                type="text"
                value={value}
                onChange={e => handleInputChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-cream border border-mist rounded-xl text-sm text-badge placeholder:text-badge-200 focus:ring-2 focus:ring-olive-300 focus:border-olive-400 outline-none transition-all"
            />
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[2000] left-0 right-0 mt-1 bg-white border border-mist rounded-xl shadow-lg max-h-[180px] overflow-y-auto">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs text-badge hover:bg-olive-50 transition-colors border-b border-mist/50 last:border-0"
                            onMouseDown={() => {
                                onSelect(s);
                                onChange(s.display.split(',').slice(0, 3).join(','));
                                setShowSuggestions(false);
                            }}
                        >
                            <span className="font-medium">{s.display.split(',').slice(0, 2).join(',')}</span>
                            <span className="text-badge-300 block truncate">{s.display.split(',').slice(2, 4).join(',')}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════
// ROUTE BUILDER MAP (Main Component)
// ══════════════════════════════════════════════════
export function RouteBuilderMap({ waypoints = [], checkpoints = [], onWaypointsChange, onCheckpointsChange }) {
    const [fromText, setFromText] = useState('');
    const [toText, setToText] = useState('');
    const [fromCoords, setFromCoords] = useState(null);
    const [toCoords, setToCoords] = useState(null);
    const [routePoints, setRoutePoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addingCheckpoints, setAddingCheckpoints] = useState(false);
    const [error, setError] = useState('');

    // ── GEOLOCATION (My Location) ────────────────
    const handleMyLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFromCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setFromText('My Current Location');
                setError('');
                setLoading(false);
            },
            (err) => {
                setError('Could not fetch location. Please ensure location permissions are granted.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }, []);

    // ── GENERATE ROUTE ───────────────────────────
    const generateRoute = useCallback(async () => {
        if (!fromCoords || !toCoords) {
            setError('Please select both from and to locations');
            return;
        }
        setLoading(true);
        setError('');

        const route = await getOSRMRoute(fromCoords, toCoords);
        if (route) {
            setRoutePoints(route);
            onWaypointsChange(route);
            onCheckpointsChange([]);
            setAddingCheckpoints(true);
        } else {
            setError('Route not found. Try different locations.');
            // Fallback: straight line
            const fallback = [fromCoords, toCoords];
            setRoutePoints(fallback);
            onWaypointsChange(fallback);
        }
        setLoading(false);
    }, [fromCoords, toCoords, onWaypointsChange, onCheckpointsChange]);

    // ── ADD CHECKPOINT (click on map) ────────────
    const handleCheckpointClick = useCallback((latlng) => {
        if (!addingCheckpoints) return;
        const newCp = {
            lat: latlng.lat,
            lng: latlng.lng,
            order: checkpoints.length + 1,
            label: `Checkpoint ${checkpoints.length + 1}`,
        };
        onCheckpointsChange([...checkpoints, newCp]);
    }, [addingCheckpoints, checkpoints, onCheckpointsChange]);

    // ── REMOVE CHECKPOINT ────────────────────────
    const removeCheckpoint = useCallback((order) => {
        const updated = checkpoints
            .filter(c => c.order !== order)
            .map((c, i) => ({ ...c, order: i + 1, label: `Checkpoint ${i + 1}` }));
        onCheckpointsChange(updated);
    }, [checkpoints, onCheckpointsChange]);

    // ── CLEAR ALL ────────────────────────────────
    const clearAll = useCallback(() => {
        setRoutePoints([]);
        onWaypointsChange([]);
        onCheckpointsChange([]);
        setFromCoords(null);
        setToCoords(null);
        setFromText('');
        setToText('');
        setAddingCheckpoints(false);
        setError('');
    }, [onWaypointsChange, onCheckpointsChange]);

    const mapCenter = fromCoords ? [fromCoords.lat, fromCoords.lng] : DEFAULT_CENTER;

    return (
        <div className="space-y-3">
            {/* Address Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <AddressInput
                    label="From (Origin)"
                    icon={MapPin}
                    value={fromText}
                    onChange={setFromText}
                    onSelect={(s) => setFromCoords({ lat: s.lat, lng: s.lng })}
                    placeholder="Search origin address..."
                    action={
                        <button
                            type="button"
                            onClick={handleMyLocation}
                            disabled={loading}
                            className="flex items-center gap-1 text-[10px] font-bold text-olive-600 hover:text-olive-700 bg-olive-50 hover:bg-olive-100 px-2 py-0.5 rounded-md transition-colors disabled:opacity-50"
                        >
                            <Crosshair className="w-3 h-3" /> My Location
                        </button>
                    }
                />
                <AddressInput
                    label="To (Destination)"
                    icon={Flag}
                    value={toText}
                    onChange={setToText}
                    onSelect={(s) => setToCoords({ lat: s.lat, lng: s.lng })}
                    placeholder="Search destination address..."
                />
            </div>

            {/* Generate Route Button */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={generateRoute}
                    disabled={!fromCoords || !toCoords || loading}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-olive-500 rounded-xl hover:bg-olive-600 transition-all disabled:opacity-40"
                >
                    <Navigation className="w-3.5 h-3.5" />
                    {loading ? 'Generating route...' : 'Set Path'}
                </button>

                {routePoints.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setAddingCheckpoints(!addingCheckpoints)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${addingCheckpoints
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white text-badge-500 border-mist hover:bg-cream'
                            }`}
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {addingCheckpoints ? 'Adding Checkpoints (click map)' : 'Add Checkpoints'}
                    </button>
                )}

                {routePoints.length > 0 && (
                    <button type="button" onClick={clearAll}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-badge-400 bg-white border border-mist rounded-xl hover:text-red-500 hover:border-red-200 transition-colors">
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
            )}

            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-mist" style={{ height: '350px' }}>
                <MapContainer
                    center={mapCenter}
                    zoom={10}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                >
                    <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_TILES} />
                    <CheckpointClickHandler enabled={addingCheckpoints} onMapClick={handleCheckpointClick} />
                    <FitBounds route={routePoints} />

                    {/* Route Polyline (road-following) */}
                    {routePoints.length > 1 && (
                        <Polyline
                            positions={routePoints.map(p => [p.lat, p.lng])}
                            pathOptions={{ color: '#6B8C3E', weight: 4, opacity: 0.9 }}
                        />
                    )}

                    {/* Origin Marker */}
                    {fromCoords && (
                        <Marker position={[fromCoords.lat, fromCoords.lng]} icon={originIcon}>
                            <Tooltip permanent={false} direction="top">
                                <span style={{ fontSize: '11px', fontWeight: 600 }}>{fromText || 'Origin'}</span>
                            </Tooltip>
                        </Marker>
                    )}

                    {/* Destination Marker */}
                    {toCoords && (
                        <Marker position={[toCoords.lat, toCoords.lng]} icon={destIcon}>
                            <Tooltip permanent={false} direction="top">
                                <span style={{ fontSize: '11px', fontWeight: 600 }}>{toText || 'Destination'}</span>
                            </Tooltip>
                        </Marker>
                    )}

                    {/* Checkpoint Markers */}
                    {checkpoints.map((cp) => (
                        <Marker
                            key={`cp-${cp.order}`}
                            position={[cp.lat, cp.lng]}
                            icon={checkpointIcon(cp.order)}
                            eventHandlers={{
                                contextmenu: () => removeCheckpoint(cp.order)
                            }}
                        >
                            <Tooltip permanent direction="right" offset={[10, 0]}>
                                <span style={{ fontSize: '10px', fontWeight: 600 }}>{cp.label}</span>
                            </Tooltip>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Legend + Instructions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-badge-300">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" /> Origin</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" /> Destination</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" /> Checkpoint</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-olive-500 rounded" /> Route</span>
                </div>
                <div className="text-[10px] text-badge-300">
                    {waypoints.length > 0 && `${waypoints.length} route points`}
                    {checkpoints.length > 0 && ` • ${checkpoints.length} checkpoints`}
                    {addingCheckpoints && ' • Right-click checkpoint to remove'}
                </div>
            </div>
        </div>
    );
}

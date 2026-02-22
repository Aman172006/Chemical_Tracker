/**
 * CHEMTRACK — Formatters
 */

/**
 * Format a UNIX timestamp (ms) to "HH:MM:SS AM/PM — DD MMM YYYY"
 */
export function formatTimestamp(ms) {
    if (!ms) return '—';
    const d = new Date(ms);
    const time = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    const date = d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    return `${time} — ${date}`;
}

/**
 * Format seconds-ago into human-readable string
 * @param {number} seconds
 */
export function formatTimeAgo(seconds) {
    if (seconds == null || seconds < 0) return '—';
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 120) return '1 minute ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 7200) return '1 hour ago';
    return `${Math.floor(seconds / 3600)} hours ago`;
}

/**
 * Format coordinate value → "28.613900°N" or "77.209000°E"
 * @param {number} value
 * @param {'lat'|'lng'} type
 */
export function formatCoordinate(value, type) {
    if (value == null) return '—';
    const abs = Math.abs(value).toFixed(6);
    if (type === 'lat') return `${abs}°${value >= 0 ? 'N' : 'S'}`;
    return `${abs}°${value >= 0 ? 'E' : 'W'}`;
}

/**
 * Format weight in kg → "50.00 kg"
 */
export function formatWeight(kg) {
    if (kg == null) return '—';
    return `${Number(kg).toFixed(2)} kg`;
}

/**
 * Format speed → "45.2 km/h"
 */
export function formatSpeed(kmh) {
    if (kmh == null) return '—';
    return `${Number(kmh).toFixed(1)} km/h`;
}

/**
 * Format distance in meters → "45m" or "1.2 km"
 */
export function formatDistance(meters) {
    if (meters == null) return '—';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format percentage → "16.0%"
 */
export function formatPercentage(value) {
    if (value == null) return '—';
    return `${(value * 100).toFixed(1)}%`;
}

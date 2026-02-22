/**
 * CHEMTRACK — Application Constants
 */

// ── THRESHOLDS ────────────────────────────────────────
export const ROUTE_DEVIATION_TOLERANCE = 20;        // meters
export const WEIGHT_CHANGE_THRESHOLD = 0.02;         // 2%
export const GPS_STALE_WARNING = 10000;              // ms → yellow dot
export const GPS_STALE_CRITICAL = 30000;             // ms → red dot
export const TRACKER_LOST_TIMEOUT = 60000;           // ms → trigger L3
export const L2_ALERT_REPEAT_INTERVAL = 10000;       // ms
export const OWNER_ID = 'CHEMTRACK-OWNER-001';

// Legacy alias
export const ROUTE_TOLERANCE_METERS = ROUTE_DEVIATION_TOLERANCE;

// ── MAP CONFIG ────────────────────────────────────────
export const MAP_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
export const DEFAULT_CENTER = [28.6139, 77.2090];
export const DEFAULT_ZOOM = 13;

// ── THREAT LEVELS ─────────────────────────────────────
export const THREAT_LEVELS = {
    NORMAL: 0,
    LEVEL_1: 1,  // Route Deviation
    LEVEL_2: 2,  // Seal Tamper / Weight Change
    LEVEL_3: 3   // Tracker Removal
};

// ── COLORS ────────────────────────────────────────────
export const COLORS = {
    white: '#FFFFFF',
    offWhite: '#F8FAF7',
    cream: '#F1F4EE',
    mist: '#E4E9DF',
    olive: {
        50: '#F4F7F0',
        100: '#E3EBD8',
        200: '#C8D6B0',
        300: '#A8BC84',
        400: '#8BA55E',
        500: '#6B8C3E',
        600: '#567230',
        700: '#445A26',
        800: '#33431D',
        900: '#222D14'
    },
    badge: '#1E1E1E',
    badgeSub: {
        700: '#2D2D2D',
        600: '#3D3D3D',
        500: '#525252',
        400: '#6B6B6B',
        300: '#8A8A8A',
        200: '#B0B0B0',
        100: '#D4D4D4'
    },
    alert: {
        green: '#16A34A',
        greenBg: '#F0FDF4',
        greenBorder: '#BBF7D0',
        amber: '#D97706',
        amberBg: '#FFFBEB',
        amberBorder: '#FDE68A',
        amberText: '#92400E',
        orange: '#EA580C',
        orangeBg: '#FFF7ED',
        orangeBorder: '#FDBA74',
        orangeText: '#9A3412',
        red: '#DC2626',
        redBg: '#FEF2F2',
        redBorder: '#FCA5A5',
        redText: '#991B1B',
        redGlow: 'rgba(220, 38, 38, 0.15)'
    }
};

// ── THREAT LEVEL INFO ─────────────────────────────────
export const THREAT_INFO = {
    0: {
        label: 'Normal',
        color: 'green',
        bg: COLORS.alert.greenBg,
        border: COLORS.alert.greenBorder,
        text: '#166534',
        accent: COLORS.alert.green
    },
    1: {
        label: 'Deviation',
        color: 'amber',
        bg: COLORS.alert.amberBg,
        border: COLORS.alert.amberBorder,
        text: COLORS.alert.amberText,
        accent: COLORS.alert.amber
    },
    2: {
        label: 'Tamper',
        color: 'orange',
        bg: COLORS.alert.orangeBg,
        border: COLORS.alert.orangeBorder,
        text: COLORS.alert.orangeText,
        accent: COLORS.alert.orange
    },
    3: {
        label: 'Critical',
        color: 'red',
        bg: COLORS.alert.redBg,
        border: COLORS.alert.redBorder,
        text: COLORS.alert.redText,
        accent: COLORS.alert.red
    }
};

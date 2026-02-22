# CHEMTRACK — Hardware-Anchored. Blockchain-Verified.

## Overview
CHEMTRACK is a production-grade SaaS application designed for the end-to-end tracking of dual-use precursor chemicals. It leverages hardware-anchored identity, blockchain immutability, and real-time sensor monitoring to prevent diversion and ensure regulatory compliance.

## Key Features
- **Hardware-Anchored Identity**: IoT-triggered identity verification.
- **Blockchain Verification Pathway**: Immutable event logging on Polygon/Ethereum.
- **Tiered Threat Detection**:
  - **Level 1 (Amber)**: Route deviation via geospatial corridor analysis.
  - **Level 2 (Orange)**: Seal tamper and weight variation (threshold >2%).
  - **Level 3 (Red)**: Tracker removal / Signal loss with aggressive focal UI locking.
- **Dual Portal System**:
  - **Owner Dashboard**: Full fleet surveillance, high-fidelity mapping, and simulation.
  - **Client Portal**: Secure, delayed GPS tracking with filtered event history.

## Architecture
### Frontend (React + Vite + Tailwind)
- **State Management**: Context API (Auth, Alerts).
- **Mapping**: React-Leaflet with Dark Matter tiles.
- **Animations**: Framer Motion for hero and alert transitions.
- **Real-time**: Firebase Realtime DB (GPS) & Firestore (Alerts/Shipments).

### Backend Pathway (Node.js + Express)
- **Security**: Firebase Admin SDK with role-based auth.
- **Ledger Integration**: Ethers.js pathway for smart contract interaction.
- **Notifications**: FCM pathway and Nodemailer for track-ID distribution.

## Setup Instructions

### 1. Prerequisites
- Node.js v18+
- Firebase project with Firestore, RTDB, and Auth enabled.

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### 3. Backend Setup
```bash
cd server
npm install
npm run dev
```

### 4. Configuration
Create a `.env` in the root with:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

## Protocol Specifications
- **Route Tolerance**: 500m radius.
- **GPS Delay**: Configurable per client (Default 300s).
- **Weight Threshold**: 2.0% deviation triggers Level 2.
- **Audit Pulse**: Heartbeat required every 60s for Level 0 status.

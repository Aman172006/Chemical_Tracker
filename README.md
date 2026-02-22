# ChemTrack: Dual-Use Chemical Tracker

![ChemTrack Hero Concept](https://img.shields.io/badge/Status-Active_Development-brightgreen?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)

ChemTrack is an industrial-grade, full-stack IoT tracking platform designed to secure the transportation of dual-use precursor chemicals (like Acetic Anhydride). It merges custom IoT hardware with an immutable cloud backend and a real-time React dashboard to establish a continuous digital tether to high-risk cargo from origin to destination.

Traditional GPS tracking is insufficient for regulated chemicals, as bad actors can intercept cargo without breaking schedule (skimming). ChemTrack solves this by actively monitoring **location, weight anomalies, and physical tamper states** at 1-second intervals.

---

## 🏗️ System Architecture

The ChemTrack ecosystem operates via three primary layers:

1. **The EDGE-1 Node (Hardware):** An ESP32-based microcontroller equipped with a SIM800L module, GPS, load cells (for weight verification), DHT11 sensors (temperature), and contact switches (tamper seals). It writes real-time telemetry directly to the Firebase Realtime Database (RTDB) at 1Hz.
2. **The Nerve Center (Backend):** A Node.js/Express server that acts as the source of truth. It manages authentication, geocoding, database interactions (Firestore), and actively listens to the RTDB telemetry stream to broadcast it to clients via Socket.io.
3. **The Command Center (Frontend):** A React/Vite web application featuring an ultra-premium, industrial-styled dashboard. It consumes REST APIs and Socket.io streams to visualize live vehicle locations on interactive Leaflet maps.

---

## ✨ Key Features

- **Real-Time Telemetry Pipeline:** Zero-latency updates from the ESP32 to the UI using Firebase RTDB and Socket.io websockets.
- **Geofence Deviation Engine:** Utilizing the OSRM routing API, the system establishes a baseline route and will trigger a Level 3 alert if the vehicle strays beyond a 20-meter tolerance zone.
- **Tamper & Skimming Detection:** Immediate alerts if the cargo weight drops unexpectedly or if encrypted electronic transit seals are broken.
- **Three-Tier Alert Matrix:** Automated Normal, Amber, Orange, and Red alerts based upon combined heuristic sensor data.
- **Zero-Trust Dispatch & Handover:** Secure shipment initialization with origin and destination waypoints, concluding with cryptographic sign-off.
- **Ultra-Premium UI/UX:** Styled with TailwindCSS, GSAP, and Framer Motion to provide a cinematic, dark-themed industrial compliance portal.

---

## 📂 Project Structure

```bash
📦 dual-use-chemical-tracker
 ┣ 📂 backend                 # Express.js Server
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 config              # Firebase & Env Config
 ┃ ┃ ┣ 📂 controllers         # Auth, Device, Routing logic
 ┃ ┃ ┣ 📂 middleware          # JWT Authentication
 ┃ ┃ ┣ 📂 routes              # REST API definitions
 ┃ ┃ ┣ 📂 services            # RTDB Listeners, Geocoding
 ┃ ┃ ┗ 📂 websocket           # Socket.io event handlers
 ┃ ┗ 📜 index.js              # Server Entry Point
 ┃
 ┗ 📂 frontend/Tracking_Device-main  # React + Vite Client
   ┣ 📂 src
   ┃ ┣ 📂 components          # Reusable UI Blocks
   ┃ ┃ ┣ 📂 dashboard         # Map view, Shipment List, Modals
   ┃ ┃ ┣ 📂 landing           # GSAP Animated Landing Sections
   ┃ ┃ ┗ 📂 map               # React Leaflet Routing & Markers
   ┃ ┣ 📂 context             # AuthContext for state
   ┃ ┣ 📂 hooks               # Custom hooks (useRealtimeTracking)
   ┃ ┣ 📂 pages               # Dashboard, Landing, Login Routes
   ┃ ┗ 📜 App.jsx             # React Router Setup
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project Setup (Firestore & RTDB)
- OSRM / Nominatim Server (Free public tier used by default)

### 1. Backend Setup
```bash
cd backend
npm install
```
*Create a `.env` file in the backend root:*
```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-service-account
```
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend/Tracking_Device-main
npm install
```
*Create a `.env` file in the frontend root:*
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_DATABASE_URL=your-rtdb-url
VITE_FIREBASE_PROJECT_ID=your-project-id
```
```bash
npm run dev
```

---

## 🔒 Firebase Configuration
Ensure your Realtime Database rules allow read/write for authenticated services, specifically for the `/telemetry/latest` and `/live` paths.

## 📜 License
Internal Industrial Project. All rights reserved.

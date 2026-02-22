import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { errorHandler } from './middleware/errorHandler.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import tripRoutes from './routes/trip.routes.js';
import deviceRoutes from './routes/device.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io
const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join-trip', (tripId) => {
        socket.join(`trip:${tripId}`);
        socket.emit('joined-trip', { tripId });
        console.log(`[Socket] ${socket.id} joined trip:${tripId}`);
    });

    socket.on('leave-trip', (tripId) => {
        socket.leave(`trip:${tripId}`);
        console.log(`[Socket] ${socket.id} left trip:${tripId}`);
    });

    socket.on('join-owner-room', (ownerId) => {
        socket.join(`owner:${ownerId}`);
        socket.emit('joined-owner-room', { ownerId });
        console.log(`[Socket] ${socket.id} joined owner:${ownerId}`);
    });

    socket.on('join-admin-room', () => {
        socket.join('admin');
        socket.emit('joined-admin-room', {});
        console.log(`[Socket] ${socket.id} joined admin room`);
    });

    socket.on('ping-server', () => {
        socket.emit('pong-server', { ts: Date.now() });
    });

    socket.on('disconnect', (reason) => {
        console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    });
});

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/device', deviceRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'operational', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

httpServer.listen(PORT, () => {
    console.log(`[CHEMTRACK-SERVER] Running on port ${PORT}`);
    console.log(`[SOCKET.IO] WebSocket server ready`);
});

export { io };

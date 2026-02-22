import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser, getUserById, getAllUsers } from '../services/dataStore.js';
import { authMiddleware, JWT_SECRET } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Body: { email, password, name, phone, role }
 */
router.post('/register', async (req, res) => {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }

    if (getUserByEmail(email)) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({ email, passwordHash, name, phone, role: role || 'owner' });

    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
        success: true,
        data: {
            user: { userId: user.userId, email: user.email, name: user.name, role: user.role },
            token,
        },
    });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = getUserByEmail(email);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
        success: true,
        data: {
            user: { userId: user.userId, email: user.email, name: user.name, role: user.role },
            token,
        },
    });
});

/**
 * GET /api/auth/me
 * Requires: Bearer token
 */
router.get('/me', authMiddleware, (req, res) => {
    res.json({
        success: true,
        data: { user: req.user },
    });
});

/**
 * PUT /api/auth/profile
 */
router.put('/profile', authMiddleware, (req, res) => {
    res.json({ success: true, data: { user: req.user } });
});

/**
 * GET /api/auth/users (admin only)
 */
router.get('/users', authMiddleware, (req, res) => {
    res.json({ success: true, data: { users: getAllUsers() } });
});

export default router;

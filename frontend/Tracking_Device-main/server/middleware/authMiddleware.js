import jwt from 'jsonwebtoken';
import { getUserById } from '../services/dataStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chemtrack-hackathon-secret-key-2026';

/**
 * JWT Auth Middleware — verifies Bearer token and attaches user to req.
 */
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Missing or malformed Authorization header',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = getUserById(decoded.userId);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        req.user = {
            userId: user.userId,
            email: user.email,
            name: user.name,
            role: user.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

/**
 * Owner-only middleware — requires role === 'owner' or 'admin'
 */
export const ownerOnly = (req, res, next) => {
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Owner access required' });
    }
    next();
};

export { JWT_SECRET };

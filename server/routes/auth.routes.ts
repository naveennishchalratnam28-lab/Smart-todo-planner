import express from 'express';
import { register, login, getProfile, updateSettings } from '../controllers/auth.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getProfile);
router.put('/settings', authMiddleware, updateSettings);

export default router;

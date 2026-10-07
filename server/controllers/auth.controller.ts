import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbRepo } from '../db.ts';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'smart-todo-planner-jwt-secret-key-32503491';
const JWT_EXPIRES_IN = '7d';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = await dbRepo.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await dbRepo.createUser({
      email,
      password: hashedPassword,
      name,
    });

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const { password: _, ...userSafe } = user;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userSafe,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await dbRepo.findUserByEmail(email);
    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userSafe,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Login failed.' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await dbRepo.findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const { password: _, ...userSafe } = user;
    res.json({ success: true, user: userSafe });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch user profile.' });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { dailyHours, workingDays, startTime, bufferPercent } = req.body;
    const updates: any = {};

    if (dailyHours !== undefined) {
      updates.dailyHours = Math.max(1, Math.min(16, Number(dailyHours)));
    }
    if (workingDays !== undefined && Array.isArray(workingDays)) {
      updates.workingDays = workingDays.map(Number);
    }
    if (startTime !== undefined) {
      updates.startTime = String(startTime);
    }
    if (bufferPercent !== undefined) {
      updates.bufferPercent = Math.max(0, Math.min(50, Number(bufferPercent)));
    }

    const updatedUser = await dbRepo.updateUserSettings(req.userId!, updates);
    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const { password: _, ...userSafe } = updatedUser;
    res.json({
      success: true,
      message: 'Planner settings updated successfully.',
      user: userSafe,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update settings.' });
  }
}

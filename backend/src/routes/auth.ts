import express from 'express';
import { pool } from '../db/index.js';
import { sendSMS, generateSMSCode } from '../utils/sms.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
});

const loginSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
});

const verifySchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  code: z.string().length(4),
});

// Send SMS code for registration
router.post('/register/send-code', async (req, res) => {
  try {
    const { phone, name } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this phone already exists' });
    }

    // Generate and save code
    const code = generateSMSCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      'INSERT INTO sms_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
      [phone, code, expiresAt]
    );

    // Send SMS
    await sendSMS(phone, code);

    // В development режиме возвращаем код для тестирования
    const response: any = { 
      success: true, 
      message: 'Code sent',
    };

    // В development режиме возвращаем код (только для разработки!)
    if (process.env.NODE_ENV === 'development' || process.env.SMS_PROVIDER === 'mock') {
      response.code = code; // Только в development!
      response.devMode = true;
    }

    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Register send code error:', error);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

// Verify code and create user
router.post('/register/verify', async (req, res) => {
  try {
    const { phone, code, name } = verifySchema.extend({ name: z.string().min(2) }).parse(req.body);

    // Verify code
    const codeResult = await pool.query(
      `SELECT * FROM sms_codes 
       WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND used = FALSE 
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Mark code as used
    await pool.query('UPDATE sms_codes SET used = TRUE WHERE id = $1', [codeResult.rows[0].id]);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (phone, name, verified) 
       VALUES ($1, $2, TRUE) 
       RETURNING id, phone, name, rating, deliveries_count, created_at`,
      [phone, name]
    );

    const user = userResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        rating: user.rating,
        deliveriesCount: user.deliveries_count
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Register verify error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Send SMS code for login
router.post('/login/send-code', async (req, res) => {
  try {
    const { phone } = loginSchema.parse(req.body);

    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate and save code
    const code = generateSMSCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'INSERT INTO sms_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
      [phone, code, expiresAt]
    );

    await sendSMS(phone, code);

    const response: any = { 
      success: true, 
      message: 'Code sent',
    };

    // В development режиме возвращаем код для тестирования
    if (process.env.NODE_ENV === 'development' || process.env.SMS_PROVIDER === 'mock') {
      response.code = code; // Только в development!
      response.devMode = true;
    }

    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Login send code error:', error);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

// Verify code and login
router.post('/login/verify', async (req, res) => {
  try {
    const { phone, code } = verifySchema.parse(req.body);

    // Verify code
    const codeResult = await pool.query(
      `SELECT * FROM sms_codes 
       WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND used = FALSE 
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Mark code as used
    await pool.query('UPDATE sms_codes SET used = TRUE WHERE id = $1', [codeResult.rows[0].id]);

    // Get user
    const userResult = await pool.query(
      'SELECT id, phone, name, rating, deliveries_count, created_at FROM users WHERE phone = $1',
      [phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        rating: user.rating,
        deliveriesCount: user.deliveries_count
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Login verify error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, phone, name, rating, deliveries_count, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      rating: user.rating,
      deliveriesCount: user.deliveries_count,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;


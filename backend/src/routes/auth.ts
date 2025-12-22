import express from 'express';
import { pool } from '../db/index.js';
import { sendSMS, generateSMSCode } from '../utils/sms.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authRateLimit } from '../middleware/rateLimit.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Rate limiting для защиты от спама SMS (более строгий чем общий)
const smsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 3, // максимум 3 запроса на отправку SMS
  message: { error: 'Too many SMS requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting для проверки кодов (защита от брутфорса)
const verifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток ввода кода
  message: { error: 'Too many verification attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
router.post('/register/send-code', smsRateLimit, async (req, res) => {
  let phone: string | undefined;
  try {
    const parsed = registerSchema.parse(req.body);
    phone = parsed.phone;
    const { name } = parsed;

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
      const errorDetails = process.env.NODE_ENV === 'development' 
        ? { details: error.errors }
        : {};
      return res.status(400).json({ 
        error: 'Invalid input', 
        ...errorDetails 
      });
    }
    logger.error({ err: error, phone: phone || 'unknown' }, 'Register send code error');
    res.status(500).json({ error: 'Failed to send code' });
  }
});

// Verify code and create user
router.post('/register/verify', verifyRateLimit, async (req, res) => {
  let phone: string | undefined;
  try {
    const parsed = verifySchema.extend({ name: z.string().min(2) }).parse(req.body);
    phone = parsed.phone;
    const { code, name } = parsed;

    // Проверяем количество неудачных попыток за последние 15 минут
    const failedAttempts = await pool.query(
      `SELECT COUNT(*) as count FROM sms_codes 
       WHERE phone = $1 AND used = FALSE AND expires_at < NOW() 
       AND created_at > NOW() - INTERVAL '15 minutes'`,
      [phone]
    );

    if (parseInt(failedAttempts.rows[0].count) >= 5) {
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please request a new code.' 
      });
    }

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
    logger.error({ err: error, phone: phone || 'unknown' }, 'Register verify error');
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Send SMS code for login
router.post('/login/send-code', smsRateLimit, async (req, res) => {
  let phone: string | undefined;
  try {
    const parsed = loginSchema.parse(req.body);
    phone = parsed.phone;

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
    logger.error({ err: error, phone: phone || 'unknown' }, 'Login send code error');
    res.status(500).json({ error: 'Failed to send code' });
  }
});

// Verify code and login
router.post('/login/verify', verifyRateLimit, async (req, res) => {
  let phone: string | undefined;
  try {
    const parsed = verifySchema.parse(req.body);
    phone = parsed.phone;
    const { code } = parsed;

    // Проверяем количество неудачных попыток за последние 15 минут
    const failedAttempts = await pool.query(
      `SELECT COUNT(*) as count FROM sms_codes 
       WHERE phone = $1 AND used = FALSE AND expires_at < NOW() 
       AND created_at > NOW() - INTERVAL '15 minutes'`,
      [phone]
    );

    if (parseInt(failedAttempts.rows[0].count) >= 5) {
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please request a new code.' 
      });
    }

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
    logger.error({ err: error, phone: phone || 'unknown' }, 'Login verify error');
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
    logger.error({ err: error, userId: req.userId }, 'Get me error');
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;


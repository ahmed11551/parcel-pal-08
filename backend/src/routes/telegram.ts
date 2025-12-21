import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { validateTelegramInitData } from '../utils/telegram.js';
import { z } from 'zod';

const router = express.Router();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!BOT_TOKEN && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен. Telegram функции могут не работать.');
}

// Валидация схем
const telegramAuthSchema = z.object({
  initData: z.string().min(1),
});

const subscribeSchema = z.object({
  telegramId: z.number().int().positive(),
  subscriptionType: z.string().optional(),
});

const supportMessageSchema = z.object({
  telegramId: z.number().int().positive().optional(),
  message: z.string().min(1).max(2000),
});

const reviewSchema = z.object({
  telegramId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
});

/**
 * POST /api/telegram/auth
 * Авторизация через Telegram Web App
 */
router.post('/auth', async (req, res) => {
  try {
    const { initData } = telegramAuthSchema.parse(req.body);

    // Валидация initData
    const telegramUser = validateTelegramInitData(initData, BOT_TOKEN);
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Invalid Telegram initData' });
    }

    // Проверяем, есть ли уже пользователь с таким Telegram ID
    let telegramUserRecord = await pool.query(
      'SELECT * FROM telegram_users WHERE telegram_id = $1',
      [telegramUser.id]
    );

    if (telegramUserRecord.rows.length === 0) {
      // Создаем новую запись telegram_users
      await pool.query(
        `INSERT INTO telegram_users (telegram_id, username, first_name, last_name)
         VALUES ($1, $2, $3, $4)`,
        [
          telegramUser.id,
          telegramUser.username || null,
          telegramUser.first_name,
          telegramUser.last_name || null,
        ]
      );
    } else {
      // Обновляем данные
      await pool.query(
        `UPDATE telegram_users 
         SET username = $1, first_name = $2, last_name = $3, updated_at = CURRENT_TIMESTAMP
         WHERE telegram_id = $4`,
        [
          telegramUser.username || null,
          telegramUser.first_name,
          telegramUser.last_name || null,
          telegramUser.id,
        ]
      );
    }

    // Получаем обновленную запись
    telegramUserRecord = await pool.query(
      'SELECT * FROM telegram_users WHERE telegram_id = $1',
      [telegramUser.id]
    );

    const telegramUserData = telegramUserRecord.rows[0];

    // Если пользователь уже связан с аккаунтом, возвращаем JWT токен
    if (telegramUserData.user_id) {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: telegramUserData.user_id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Получаем данные пользователя
      const userResult = await pool.query(
        'SELECT id, phone, name, rating, deliveries_count FROM users WHERE id = $1',
        [telegramUserData.user_id]
      );

      return res.json({
        success: true,
        token,
        user: userResult.rows[0],
        telegramUser: {
          id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
        },
      });
    }

    // Если пользователь не связан, возвращаем только Telegram данные
    return res.json({
      success: true,
      telegramUser: {
        id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
      },
      needsPhoneAuth: true, // Нужна авторизация по телефону
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate via Telegram' });
  }
});

/**
 * POST /api/telegram/link
 * Связать Telegram аккаунт с существующим пользователем
 */
router.post('/link', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { initData } = telegramAuthSchema.parse(req.body);
    const userId = req.userId;

    const telegramUser = validateTelegramInitData(initData, BOT_TOKEN);
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Invalid Telegram initData' });
    }

    // Проверяем, не связан ли уже этот Telegram ID с другим пользователем
    const existingLink = await pool.query(
      'SELECT user_id FROM telegram_users WHERE telegram_id = $1 AND user_id IS NOT NULL',
      [telegramUser.id]
    );

    if (existingLink.rows.length > 0 && existingLink.rows[0].user_id !== userId) {
      return res.status(400).json({ error: 'This Telegram account is already linked to another user' });
    }

    // Создаем или обновляем связь
    await pool.query(
      `INSERT INTO telegram_users (telegram_id, user_id, username, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET user_id = $2, username = $3, first_name = $4, last_name = $5, updated_at = CURRENT_TIMESTAMP`,
      [
        telegramUser.id,
        userId,
        telegramUser.username || null,
        telegramUser.first_name,
        telegramUser.last_name || null,
      ]
    );

    res.json({ success: true, message: 'Telegram account linked successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Telegram link error:', error);
    res.status(500).json({ error: 'Failed to link Telegram account' });
  }
});

/**
 * POST /api/telegram/subscribe
 * Подписка на уведомления
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { telegramId, subscriptionType = 'all' } = subscribeSchema.parse(req.body);

    // Проверяем существование telegram_users
    const telegramUser = await pool.query(
      'SELECT id FROM telegram_users WHERE telegram_id = $1',
      [telegramId]
    );

    if (telegramUser.rows.length === 0) {
      return res.status(404).json({ error: 'Telegram user not found' });
    }

    // Проверяем, есть ли уже подписка
    const existingSubscription = await pool.query(
      'SELECT id FROM telegram_subscriptions WHERE telegram_id = $1 AND subscription_type = $2',
      [telegramId, subscriptionType]
    );

    if (existingSubscription.rows.length === 0) {
      await pool.query(
        'INSERT INTO telegram_subscriptions (telegram_id, subscription_type) VALUES ($1, $2)',
        [telegramId, subscriptionType]
      );
    } else {
      await pool.query(
        'UPDATE telegram_subscriptions SET active = TRUE WHERE telegram_id = $1 AND subscription_type = $2',
        [telegramId, subscriptionType]
      );
    }

    // Обновляем флаг подписки в telegram_users
    await pool.query(
      'UPDATE telegram_users SET subscribed = TRUE WHERE telegram_id = $1',
      [telegramId]
    );

    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/**
 * POST /api/telegram/unsubscribe
 * Отписка от уведомлений
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { telegramId } = subscribeSchema.parse(req.body);

    await pool.query(
      'UPDATE telegram_subscriptions SET active = FALSE WHERE telegram_id = $1',
      [telegramId]
    );

    await pool.query(
      'UPDATE telegram_users SET subscribed = FALSE WHERE telegram_id = $1',
      [telegramId]
    );

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * POST /api/telegram/support
 * Отправка сообщения в поддержку
 */
router.post('/support', async (req, res) => {
  try {
    const { telegramId, message } = supportMessageSchema.parse(req.body);
    const userId = telegramId ? null : (req as AuthRequest).userId || null;

    // Если есть telegramId, получаем user_id
    let finalUserId = userId;
    if (telegramId && !userId) {
      const telegramUser = await pool.query(
        'SELECT user_id FROM telegram_users WHERE telegram_id = $1',
        [telegramId]
      );
      if (telegramUser.rows.length > 0) {
        finalUserId = telegramUser.rows[0].user_id;
      }
    }

    await pool.query(
      `INSERT INTO support_messages (telegram_id, user_id, message, status)
       VALUES ($1, $2, $3, 'open')`,
      [telegramId || null, finalUserId, message]
    );

    res.json({ success: true, message: 'Support message sent successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Support message error:', error);
    res.status(500).json({ error: 'Failed to send support message' });
  }
});

/**
 * POST /api/telegram/review
 * Оставить отзыв через Telegram
 */
router.post('/review', async (req, res) => {
  try {
    const { telegramId, rating, text } = reviewSchema.parse(req.body);

    // Получаем user_id из telegram_users
    const telegramUser = await pool.query(
      'SELECT user_id FROM telegram_users WHERE telegram_id = $1',
      [telegramId]
    );

    if (telegramUser.rows.length === 0 || !telegramUser.rows[0].user_id) {
      return res.status(404).json({ error: 'Telegram user not linked to account' });
    }

    // Создаем отзыв (используем существующую таблицу ratings)
    // Для отзывов через Telegram task_id может быть null
    await pool.query(
      `INSERT INTO ratings (task_id, from_user_id, to_user_id, rating, comment)
       VALUES (NULL, $1, NULL, $2, $3)`,
      [telegramUser.rows[0].user_id, rating, text || null]
    );

    res.json({ success: true, message: 'Review submitted successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

/**
 * GET /api/telegram/notifications/:telegramId
 * Получить уведомления для пользователя
 */
router.get('/notifications/:telegramId', async (req, res) => {
  try {
    const telegramId = parseInt(req.params.telegramId);

    const notifications = await pool.query(
      `SELECT id, type, title, message, data, sent, sent_at, created_at
       FROM telegram_notifications
       WHERE telegram_id = $1 AND sent = FALSE
       ORDER BY created_at DESC
       LIMIT 50`,
      [telegramId]
    );

    res.json({ notifications: notifications.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

/**
 * POST /api/telegram/notifications/:id/mark-sent
 * Отметить уведомление как отправленное
 */
router.post('/notifications/:id/mark-sent', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await pool.query(
      'UPDATE telegram_notifications SET sent = TRUE, sent_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification as sent error:', error);
    res.status(500).json({ error: 'Failed to mark notification as sent' });
  }
});

/**
 * GET /api/telegram/subscribers
 * Получить список подписанных пользователей (для бота)
 */
router.get('/subscribers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT tu.telegram_id
       FROM telegram_users tu
       INNER JOIN telegram_subscriptions ts ON tu.telegram_id = ts.telegram_id
       WHERE tu.subscribed = TRUE AND ts.active = TRUE
       AND tu.telegram_id IS NOT NULL`
    );

    res.json({ subscribers: result.rows });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ error: 'Failed to get subscribers' });
  }
});

export default router;


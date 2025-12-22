import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { validateTelegramInitData } from '../utils/telegram.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

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
 * POST /api/telegram/auth/simple
 * Простая авторизация через Telegram ID (для бота)
 * Создает пользователя автоматически, если его нет
 * 
 * Примечание: Если пользователь уже зарегистрирован по телефону,
 * он может связать аккаунт через /api/telegram/link после авторизации в веб-приложении
 */
router.post('/auth/simple', async (req, res) => {
  let telegramId: number | undefined;
  try {
    const parsed = z.object({
      telegramId: z.number().int().positive(),
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      username: z.string().optional(),
    }).parse(req.body);
    
    telegramId = parsed.telegramId;
    const { firstName, lastName, username } = parsed;

    // Проверяем, есть ли уже запись telegram_users
    let telegramUserRecord = await pool.query(
      'SELECT * FROM telegram_users WHERE telegram_id = $1',
      [telegramId]
    );

    let telegramUserData;
    if (telegramUserRecord.rows.length === 0) {
      // Создаем запись telegram_users
      await pool.query(
        `INSERT INTO telegram_users (telegram_id, username, first_name, last_name)
         VALUES ($1, $2, $3, $4)`,
        [telegramId, username || null, firstName, lastName || null]
      );
      
      telegramUserRecord = await pool.query(
        'SELECT * FROM telegram_users WHERE telegram_id = $1',
        [telegramId]
      );
      telegramUserData = telegramUserRecord.rows[0];
    } else {
      // Обновляем данные
      await pool.query(
        `UPDATE telegram_users 
         SET username = $1, first_name = $2, last_name = $3, updated_at = CURRENT_TIMESTAMP
         WHERE telegram_id = $4`,
        [username || null, firstName, lastName || null, telegramId]
      );
      
      telegramUserRecord = await pool.query(
        'SELECT * FROM telegram_users WHERE telegram_id = $1',
        [telegramId]
      );
      telegramUserData = telegramUserRecord.rows[0];
    }

    // Если пользователь уже связан с аккаунтом, возвращаем JWT токен
    if (telegramUserData.user_id) {
      const token = jwt.sign(
        { userId: telegramUserData.user_id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const userResult = await pool.query(
        'SELECT id, phone, name, rating, deliveries_count FROM users WHERE id = $1',
        [telegramUserData.user_id]
      );

      if (userResult.rows.length === 0) {
        logger.warn({ telegramId, userId: telegramUserData.user_id }, 'User linked to telegram not found');
        // Разрываем связь и создаем нового пользователя
        await pool.query(
          'UPDATE telegram_users SET user_id = NULL WHERE telegram_id = $1',
          [telegramId]
        );
        // Продолжаем создание нового пользователя ниже
      } else {
        logger.info({ telegramId, userId: telegramUserData.user_id }, 'Telegram user authenticated');
        return res.json({
          success: true,
          token,
          user: userResult.rows[0],
          telegramUser: {
            id: telegramId,
            username,
            first_name: firstName,
          },
        });
      }
    }

    // Если пользователя нет, создаем его автоматически
    // Используем виртуальный телефон формата +79990000000{last9digits}
    // Это обеспечивает валидный формат телефона и уникальность
    const telegramIdStr = String(telegramId);
    const last9Digits = telegramIdStr.slice(-9).padStart(9, '0');
    const virtualPhone = `+7999000${last9Digits}`;
    const userName = lastName ? `${firstName} ${lastName}`.trim() : firstName;

    // Проверяем, нет ли уже пользователя с таким телефоном
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [virtualPhone]
    );

    let userId;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      logger.info({ telegramId, userId, phone: virtualPhone }, 'Using existing user for telegram auth');
    } else {
      try {
        // Создаем нового пользователя
        const newUserResult = await pool.query(
          `INSERT INTO users (phone, name, verified) 
           VALUES ($1, $2, TRUE) 
           RETURNING id`,
          [virtualPhone, userName]
        );
        userId = newUserResult.rows[0].id;
        logger.info({ telegramId, userId, phone: virtualPhone, name: userName }, 'New user created for telegram auth');
      } catch (error: any) {
        // Если произошла ошибка (например, уникальность), пытаемся получить существующего пользователя
        if (error.code === '23505') { // Unique violation
          const conflictUser = await pool.query(
            'SELECT id FROM users WHERE phone = $1',
            [virtualPhone]
          );
          if (conflictUser.rows.length > 0) {
            userId = conflictUser.rows[0].id;
            logger.warn({ telegramId, userId, phone: virtualPhone }, 'User phone conflict resolved');
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    // Связываем telegram_users с users
    try {
      await pool.query(
        `UPDATE telegram_users 
         SET user_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE telegram_id = $2`,
        [userId, telegramId]
      );
    } catch (error: any) {
      logger.error({ err: error, telegramId, userId }, 'Error linking telegram user');
      throw error;
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userResult = await pool.query(
      'SELECT id, phone, name, rating, deliveries_count FROM users WHERE id = $1',
      [userId]
    );

    logger.info({ telegramId, userId, phone: virtualPhone }, 'Telegram simple auth successful');

    const userData = userResult.rows[0];
    const isVirtualAccount = userData.phone.startsWith('+7999000');

    return res.json({
      success: true,
      token,
      user: userData,
      telegramUser: {
        id: telegramId,
        username,
        first_name: firstName,
      },
      isVirtualAccount, // Флаг, что аккаунт создан с виртуальным телефоном
      canLinkPhone: isVirtualAccount, // Можно связать реальный телефон позже
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ err: error, telegramId }, 'Simple Telegram auth error');
    res.status(500).json({ error: 'Failed to authenticate via Telegram' });
  }
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

    // Если пользователь не связан с аккаунтом, проверяем, может быть он уже создан через /auth/simple
    // В этом случае создаем связь автоматически, используя виртуальный телефон
    const telegramIdStr = String(telegramUser.id);
    const last9Digits = telegramIdStr.slice(-9).padStart(9, '0');
    const virtualPhone = `+7999000${last9Digits}`;
    
    const existingUserByPhone = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [virtualPhone]
    );
    
    if (existingUserByPhone.rows.length > 0) {
      // Нашли пользователя с виртуальным телефоном - это пользователь созданный через /auth/simple
      const userId = existingUserByPhone.rows[0].id;
      
      // Связываем telegram_users с users
      await pool.query(
        `UPDATE telegram_users 
         SET user_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE telegram_id = $2`,
        [userId, telegramUser.id]
      );
      
      // Генерируем токен
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      const userResult = await pool.query(
        'SELECT id, phone, name, rating, deliveries_count FROM users WHERE id = $1',
        [userId]
      );
      
      logger.info({ telegramId: telegramUser.id, userId }, 'Telegram user auto-linked to existing account');
      
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
    
    // Если пользователь не найден, возвращаем только Telegram данные
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
    logger.error({ err: error }, 'Telegram auth error');
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

/**
 * POST /api/telegram/test-notification
 * Создать тестовое уведомление (для админов/тестирования)
 */
router.post('/test-notification', async (req, res) => {
  try {
    const { telegramId } = z.object({
      telegramId: z.number().int().positive(),
    }).parse(req.body);

    // Проверяем существование telegram_users
    const telegramUser = await pool.query(
      'SELECT id FROM telegram_users WHERE telegram_id = $1',
      [telegramId]
    );

    if (telegramUser.rows.length === 0) {
      return res.status(404).json({ error: 'Telegram user not found. Please send /start to the bot first.' });
    }

    // Создаем тестовое уведомление
    await pool.query(
      `INSERT INTO telegram_notifications (telegram_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        telegramId,
        'new_task',
        '🧪 Тестовое уведомление',
        'Это тестовое уведомление для проверки системы. Если вы видите это сообщение, значит уведомления работают!\n\nСистема будет отправлять вам уведомления о новых заданиях, изменениях статуса и других событиях.',
        JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      ]
    );

    logger.info({ telegramId }, 'Test notification created');
    res.json({ success: true, message: 'Test notification created. It will be sent within 30 seconds.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ err: error }, 'Create test notification error');
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

export default router;


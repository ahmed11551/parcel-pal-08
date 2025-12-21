import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import * as notifications from '../services/telegram-notifications.js';
import { logger, metrics } from '../utils/logger.js';

const router = express.Router();

const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000),
  size: z.enum(['S', 'M', 'L']),
  estimatedValue: z.number().int().min(0).max(10000).optional(),
  photoUrl: z.string().url().optional(),
  fromAirport: z.string().length(3),
  fromPoint: z.string().max(200).optional(),
  toAirport: z.string().length(3),
  toPoint: z.string().max(200).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reward: z.number().int().min(500).max(50000),
}).refine((data) => {
  const from = new Date(data.dateFrom);
  const to = new Date(data.dateTo);
  return to >= from;
}, {
  message: "dateTo must be after or equal to dateFrom",
  path: ["dateTo"],
});

// Get all tasks with filters
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { from, to, status, page = '1', limit = '20', minReward, maxReward, sortBy = 'date' } = req.query;
    
    let query = `
      SELECT 
        t.*,
        u.name as sender_name,
        u.rating as sender_rating,
        u.deliveries_count as sender_deliveries,
        COUNT(DISTINCT m.id) as messages_count
      FROM tasks t
      LEFT JOIN users u ON t.sender_id = u.id
      LEFT JOIN messages m ON m.task_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (from) {
      query += ` AND t.from_airport = $${paramCount}`;
      params.push(from);
      paramCount++;
    }

    if (to) {
      query += ` AND t.to_airport = $${paramCount}`;
      params.push(to);
      paramCount++;
    }

    if (status) {
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    } else {
      query += ` AND t.status = 'active'`;
    }

    // Exclude soft-deleted tasks from main listing
    query += ` AND t.deleted_at IS NULL`;

    if (minReward) {
      query += ` AND t.reward >= $${paramCount}`;
      params.push(parseInt(minReward as string));
      paramCount++;
    }

    if (maxReward) {
      query += ` AND t.reward <= $${paramCount}`;
      params.push(parseInt(maxReward as string));
      paramCount++;
    }

    // Sorting
    let orderBy = 't.created_at DESC';
    if (sortBy === 'reward') {
      orderBy = 't.reward ASC';
    } else if (sortBy === 'reward_desc') {
      orderBy = 't.reward DESC';
    } else if (sortBy === 'date') {
      orderBy = 't.created_at DESC';
    }

    query += ` GROUP BY t.id, u.id ORDER BY ${orderBy}`;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    const tasks = result.rows.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      size: task.size,
      estimatedValue: task.estimated_value,
      photoUrl: task.photo_url,
      receivedPhotoUrl: task.received_photo_url,
      deliveredPhotoUrl: task.delivered_photo_url,
      from: {
        airport: task.from_airport,
        point: task.from_point
      },
      to: {
        airport: task.to_airport,
        point: task.to_point
      },
      dateFrom: task.date_from,
      dateTo: task.date_to,
      reward: task.reward,
      status: task.status,
      sender: {
        id: task.sender_id,
        name: task.sender_name,
        rating: task.sender_rating,
        deliveries: task.sender_deliveries
      },
      courierId: task.courier_id,
      messagesCount: parseInt(task.messages_count) || 0,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));

    res.json({ tasks, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    logger.error({ err: error }, 'Get tasks error');
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Get single task
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        t.*,
        u.name as sender_name,
        u.rating as sender_rating,
        u.deliveries_count as sender_deliveries,
        u.phone as sender_phone,
        c.name as courier_name,
        c.rating as courier_rating
      FROM tasks t
      LEFT JOIN users u ON t.sender_id = u.id
      LEFT JOIN users c ON t.courier_id = c.id
      WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      size: task.size,
      estimatedValue: task.estimated_value,
      photoUrl: task.photo_url,
      receivedPhotoUrl: task.received_photo_url,
      deliveredPhotoUrl: task.delivered_photo_url,
      from: {
        airport: task.from_airport,
        point: task.from_point
      },
      to: {
        airport: task.to_airport,
        point: task.to_point
      },
      dateFrom: task.date_from,
      dateTo: task.date_to,
      reward: task.reward,
      status: task.status,
      sender: {
        id: task.sender_id,
        name: task.sender_name,
        rating: task.sender_rating,
        deliveries: task.sender_deliveries,
        phone: req.userId === task.sender_id ? task.sender_phone : undefined
      },
      courier: task.courier_id ? {
        id: task.courier_id,
        name: task.courier_name,
        rating: task.courier_rating
      } : null,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    logger.error({ err: error, taskId: req.params.id }, 'Get task error');
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Create task
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const data = createTaskSchema.parse(req.body);
    const commission = Math.round(data.reward * 0.15);

    const result = await client.query(
      `INSERT INTO tasks (
        sender_id, title, description, size, estimated_value, photo_url,
        from_airport, from_point, to_airport, to_point,
        date_from, date_to, reward, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active')
      RETURNING *`,
      [
        req.userId,
        data.title,
        data.description,
        data.size,
        data.estimatedValue || null,
        data.photoUrl || null,
        data.fromAirport,
        data.fromPoint || null,
        data.toAirport,
        data.toPoint || null,
        data.dateFrom,
        data.dateTo,
        data.reward
      ]
    );

    const task = result.rows[0];

    // Create payment record в той же транзакции
    await client.query(
      `INSERT INTO payments (task_id, sender_id, amount, commission, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [task.id, req.userId, data.reward, commission]
    );

    await client.query('COMMIT');

    // Отправляем уведомления подписанным пользователям о новом задании
    // Находим всех подписанных пользователей с подходящим маршрутом
    const subscribers = await pool.query(
      `SELECT DISTINCT tu.telegram_id 
       FROM telegram_users tu
       INNER JOIN telegram_subscriptions ts ON tu.telegram_id = ts.telegram_id
       WHERE tu.subscribed = TRUE AND ts.active = TRUE
       AND tu.telegram_id IS NOT NULL
       LIMIT 100`
    );

    const taskData = {
      id: task.id,
      title: task.title,
      from: { airport: data.fromAirport },
      to: { airport: data.toAirport },
      reward: data.reward,
    };

    // Отправляем уведомления (асинхронно, не блокируем ответ)
    // Используем Promise.allSettled для правильной обработки ошибок
    Promise.allSettled(
      subscribers.rows.map((row) => 
        notifications.notifyNewTask(row.telegram_id, taskData)
      )
    ).then((results) => {
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        logger.warn({ 
          failed, 
          total: results.length,
          taskId: task.id,
        }, 'Failed to send some notifications');
      }
    });

    res.status(201).json({
      id: task.id,
      title: task.title,
      description: task.description,
      size: task.size,
      estimatedValue: task.estimated_value,
      photoUrl: task.photo_url,
      receivedPhotoUrl: task.received_photo_url,
      deliveredPhotoUrl: task.delivered_photo_url,
      from: {
        airport: task.from_airport,
        point: task.from_point
      },
      to: {
        airport: task.to_airport,
        point: task.to_point
      },
      dateFrom: task.date_from,
      dateTo: task.date_to,
      reward: task.reward,
      status: task.status,
      totalAmount: data.reward + commission,
      commission
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ err: error, userId: req.userId }, 'Create task error');
    res.status(500).json({ error: 'Failed to create task' });
  } finally {
    client.release();
  }
});

// Assign courier to task
router.post('/:id/assign', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if task exists and is available
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    if (task.status !== 'active') {
      return res.status(400).json({ error: 'Task is not available for assignment' });
    }

    if (task.sender_id === req.userId) {
      return res.status(400).json({ error: 'Cannot assign yourself as courier' });
    }

    // Update task
    await pool.query(
      'UPDATE tasks SET courier_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [req.userId, 'assigned', id]
    );

    // Отправляем уведомление курьеру
    const courierTelegram = await pool.query(
      'SELECT telegram_id FROM telegram_users WHERE user_id = $1',
      [req.userId]
    );

    if (courierTelegram.rows.length > 0 && courierTelegram.rows[0].telegram_id) {
      const taskData = {
        id: task.id,
        title: task.title,
        from: { airport: task.from_airport },
        to: { airport: task.to_airport },
      };
      notifications.notifyTaskAssigned(courierTelegram.rows[0].telegram_id, taskData).catch(console.error);
    }

    // Отправляем уведомление отправителю
    const senderTelegram = await pool.query(
      'SELECT telegram_id FROM telegram_users WHERE user_id = $1',
      [task.sender_id]
    );

    if (senderTelegram.rows.length > 0 && senderTelegram.rows[0].telegram_id) {
      const taskData = {
        id: task.id,
        title: task.title,
        from: { airport: task.from_airport },
        to: { airport: task.to_airport },
      };
      notifications.notifyTaskStatusChanged(
        senderTelegram.rows[0].telegram_id,
        taskData,
        'assigned'
      ).catch(console.error);
    }

    res.json({ success: true, message: 'Task assigned successfully' });
  } catch (error) {
    logger.error({ err: error, taskId: req.params.id, userId: req.userId }, 'Assign task error');
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

// Upload confirmation photo
router.post('/:id/confirmation-photo', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { photoType, photoUrl } = z.object({
      photoType: z.enum(['received', 'delivered']),
      photoUrl: z.string().url(),
    }).parse(req.body);

    // Check if user is authorized (sender or courier)
    const taskResult = await pool.query(
      'SELECT sender_id, courier_id, status FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    if (task.sender_id !== req.userId && task.courier_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Validate photo type and status
    if (photoType === 'received' && task.courier_id !== req.userId) {
      return res.status(403).json({ error: 'Only courier can upload received photo' });
    }

    if (photoType === 'delivered' && task.courier_id !== req.userId) {
      return res.status(403).json({ error: 'Only courier can upload delivered photo' });
    }

    // Update appropriate photo field
    const photoField = photoType === 'received' ? 'received_photo_url' : 'delivered_photo_url';
    await pool.query(
      `UPDATE tasks SET ${photoField} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [photoUrl, id]
    );

    logger.info({ taskId: id, userId: req.userId, photoType }, 'Confirmation photo uploaded');
    res.json({ success: true, photoUrl });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ err: error, taskId: req.params.id, userId: req.userId }, 'Upload confirmation photo error');
    res.status(500).json({ error: 'Failed to upload confirmation photo' });
  }
});

// Update task status
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['in_transit', 'delivered', 'cancelled']) }).parse(req.body);

    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check permissions
    if (task.sender_id !== req.userId && task.courier_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );

    // If delivered, release payment
    if (status === 'delivered' && task.courier_id) {
      await pool.query(
        `UPDATE payments SET status = 'released', updated_at = CURRENT_TIMESTAMP 
         WHERE task_id = $1 AND courier_id = $2`,
        [id, task.courier_id]
      );

      // Уведомление о переводе денег курьеру
      const courierTelegram = await pool.query(
        'SELECT telegram_id FROM telegram_users WHERE user_id = $1',
        [task.courier_id]
      );

      if (courierTelegram.rows.length > 0 && courierTelegram.rows[0].telegram_id) {
        const paymentResult = await pool.query(
          'SELECT amount FROM payments WHERE task_id = $1',
          [id]
        );
        const amount = paymentResult.rows[0]?.amount || 0;

        const taskData = {
          id: task.id,
          title: task.title,
        };
        notifications.notifyPaymentReleased(
          courierTelegram.rows[0].telegram_id,
          amount,
          taskData
        ).catch(console.error);
      }
    }

    // Отправляем уведомления об изменении статуса
    const taskData = {
      id: task.id,
      title: task.title,
      from: { airport: task.from_airport },
      to: { airport: task.to_airport },
    };

    // Уведомление отправителю
    if (task.sender_id) {
      const senderTelegram = await pool.query(
        'SELECT telegram_id FROM telegram_users WHERE user_id = $1',
        [task.sender_id]
      );
      if (senderTelegram.rows.length > 0 && senderTelegram.rows[0].telegram_id) {
        notifications.notifyTaskStatusChanged(
          senderTelegram.rows[0].telegram_id,
          taskData,
          status
        ).catch(console.error);
      }
    }

    // Уведомление курьеру
    if (task.courier_id) {
      const courierTelegram = await pool.query(
        'SELECT telegram_id FROM telegram_users WHERE user_id = $1',
        [task.courier_id]
      );
      if (courierTelegram.rows.length > 0 && courierTelegram.rows[0].telegram_id) {
        notifications.notifyTaskStatusChanged(
          courierTelegram.rows[0].telegram_id,
          taskData,
          status
        ).catch(console.error);
      }
    }

    res.json({ success: true, status });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ err: error, taskId: req.params.id, userId: req.userId }, 'Update task status error');
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Cancel task
router.post('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const taskResult = await pool.query(
      'SELECT sender_id, courier_id, status FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Only sender can cancel (if no courier assigned) or courier can cancel if status is assigned
    if (task.sender_id !== req.userId && task.courier_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this task' });
    }

    // Sender can cancel if status is active (no courier assigned)
    if (task.sender_id === req.userId) {
      if (task.status !== 'active') {
        return res.status(400).json({ 
          error: 'Can only cancel tasks that are active (no courier assigned yet)' 
        });
      }
    }

    // Courier can cancel if status is assigned
    if (task.courier_id === req.userId) {
      if (task.status !== 'assigned') {
        return res.status(400).json({ 
          error: 'Can only cancel assignment if task status is assigned' 
        });
      }
      // If courier cancels, just remove courier assignment
      await pool.query(
        `UPDATE tasks SET courier_id = NULL, status = 'active', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [id]
      );

      logger.info({ taskId: id, userId: req.userId, action: 'courier_cancelled' }, 'Courier cancelled assignment');
      return res.json({ success: true, message: 'Assignment cancelled, task is now active again' });
    }

    // Sender cancels task completely
    await pool.query(
      `UPDATE tasks SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [id]
    );

    logger.info({ taskId: id, userId: req.userId, action: 'sender_cancelled' }, 'Task cancelled by sender');
    res.json({ success: true, message: 'Task cancelled successfully' });
  } catch (error) {
    logger.error({ err: error, taskId: req.params.id, userId: req.userId }, 'Cancel task error');
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

// Confirm payment (sender confirms they sent the payment)
router.post('/:id/confirm-payment', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const taskResult = await pool.query(
      'SELECT sender_id, status FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    if (task.sender_id !== req.userId) {
      return res.status(403).json({ error: 'Only task sender can confirm payment' });
    }

    if (task.status !== 'assigned' && task.status !== 'in_transit') {
      return res.status(400).json({ error: 'Payment can only be confirmed for assigned or in_transit tasks' });
    }

    // Update payment status to 'held' (means payment is confirmed by sender)
    await pool.query(
      `UPDATE payments SET status = 'held', updated_at = CURRENT_TIMESTAMP 
       WHERE task_id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Payment confirmed' });
  } catch (error) {
    logger.error({ err: error, taskId: req.params.id, userId: req.userId }, 'Confirm payment error');
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Get user's tasks (as sender or courier)
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { role, status } = req.query; // role: 'sender' | 'courier', status: optional filter
    
    let query = '';
    const params: any[] = [req.userId];
    
    if (role === 'sender') {
      query = `
        SELECT 
          t.*,
          u.name as sender_name,
          u.rating as sender_rating,
          u.deliveries_count as sender_deliveries,
          c.name as courier_name,
          c.rating as courier_rating,
          c.id as courier_id
        FROM tasks t
        LEFT JOIN users u ON t.sender_id = u.id
        LEFT JOIN users c ON t.courier_id = c.id
        WHERE t.sender_id = $1
      `;
    } else if (role === 'courier') {
      query = `
        SELECT 
          t.*,
          u.name as sender_name,
          u.rating as sender_rating,
          u.deliveries_count as sender_deliveries,
          c.name as courier_name,
          c.rating as courier_rating,
          c.id as courier_id
        FROM tasks t
        LEFT JOIN users u ON t.sender_id = u.id
        LEFT JOIN users c ON t.courier_id = c.id
        WHERE t.courier_id = $1
      `;
    } else {
      // Both roles
      query = `
        SELECT 
          t.*,
          u.name as sender_name,
          u.rating as sender_rating,
          u.deliveries_count as sender_deliveries,
          c.name as courier_name,
          c.rating as courier_rating,
          c.id as courier_id
        FROM tasks t
        LEFT JOIN users u ON t.sender_id = u.id
        LEFT JOIN users c ON t.courier_id = c.id
        WHERE t.sender_id = $1 OR t.courier_id = $1
      `;
    }
    
    if (status) {
      query += ` AND t.status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY t.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    const tasks = result.rows.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      size: task.size,
      estimatedValue: task.estimated_value,
      photoUrl: task.photo_url,
      receivedPhotoUrl: task.received_photo_url,
      deliveredPhotoUrl: task.delivered_photo_url,
      from: {
        airport: task.from_airport,
        point: task.from_point
      },
      to: {
        airport: task.to_airport,
        point: task.to_point
      },
      dateFrom: task.date_from,
      dateTo: task.date_to,
      reward: task.reward,
      status: task.status,
      sender: {
        id: task.sender_id,
        name: task.sender_name,
        rating: task.sender_rating,
        deliveries: task.sender_deliveries
      },
      courier: task.courier_id ? {
        id: task.courier_id,
        name: task.courier_name,
        rating: task.courier_rating
      } : null,
      courierId: task.courier_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));
    
    res.json({ tasks });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get my tasks error');
    res.status(500).json({ error: 'Failed to get my tasks' });
  }
});

// Get messages for task
router.get('/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user is sender or courier of this task
    const taskResult = await pool.query(
      'SELECT sender_id, courier_id FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    if (task.sender_id !== req.userId && task.courier_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to view messages' });
    }

    // Get messages
    const messagesResult = await pool.query(
      `SELECT 
        m.id, m.content, m.read, m.created_at,
        m.sender_id,
        u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.task_id = $1
      ORDER BY m.created_at ASC`,
      [id]
    );

    const messages = messagesResult.rows.map(msg => ({
      id: msg.id,
      message: msg.content,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      read: msg.read,
      createdAt: msg.created_at,
    }));

    res.json({ messages });
  } catch (error) {
    logger.error({ err: error, taskId: req.params.id, userId: req.userId }, 'Get messages error');
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
router.post('/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content } = z.object({
      content: z.string().min(1).max(1000),
    }).parse(req.body);

    // Check if user is sender or courier of this task
    const taskResult = await pool.query(
      'SELECT sender_id, courier_id FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    if (task.sender_id !== req.userId && task.courier_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to send messages' });
    }

    // Determine receiver (the other user)
    const receiverId = task.sender_id === req.userId ? task.courier_id : task.sender_id;

    if (!receiverId) {
      return res.status(400).json({ error: 'Task has no courier assigned' });
    }

    // Insert message
    const result = await pool.query(
      `INSERT INTO messages (task_id, sender_id, receiver_id, content, read)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, content, created_at`,
      [id, req.userId, receiverId, content]
    );

    const message = result.rows[0];

    res.status(201).json({
      id: message.id,
      message: message.content,
      senderId: req.userId,
      createdAt: message.created_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ err: error, taskId: req.params.id, userId: req.userId }, 'Send message error');
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.post('/:id/messages/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user is sender or courier of this task
    const taskResult = await pool.query(
      'SELECT sender_id, courier_id FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    if (task.sender_id !== req.userId && task.courier_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark messages as read where user is receiver
    await pool.query(
      `UPDATE messages SET read = TRUE 
       WHERE task_id = $1 AND receiver_id = $2 AND read = FALSE`,
      [id, req.userId]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error, taskId: req.params.id, userId: req.userId }, 'Mark messages read error');
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;


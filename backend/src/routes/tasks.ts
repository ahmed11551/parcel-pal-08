import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

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
});

// Get all tasks with filters
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { from, to, status, page = '1', limit = '20' } = req.query;
    
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

    query += ` GROUP BY t.id, u.id ORDER BY t.created_at DESC`;

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
    console.error('Get tasks error:', error);
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
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Create task
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const commission = Math.round(data.reward * 0.15);

    const result = await pool.query(
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

    // Create payment record
    await pool.query(
      `INSERT INTO payments (task_id, sender_id, amount, commission, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [task.id, req.userId, data.reward, commission]
    );

    res.status(201).json({
      id: task.id,
      title: task.title,
      description: task.description,
      size: task.size,
      estimatedValue: task.estimated_value,
      photoUrl: task.photo_url,
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
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

    res.json({ success: true, message: 'Task assigned successfully' });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ error: 'Failed to assign task' });
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
    }

    res.json({ success: true, status });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

export default router;


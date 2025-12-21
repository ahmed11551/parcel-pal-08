import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id, name, rating, deliveries_count, created_at,
        (SELECT COUNT(*) FROM tasks WHERE sender_id = users.id) as tasks_created,
        (SELECT COUNT(*) FROM tasks WHERE courier_id = users.id) as tasks_completed
      FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      rating: user.rating,
      deliveriesCount: user.deliveries_count,
      tasksCreated: parseInt(user.tasks_created) || 0,
      tasksCompleted: parseInt(user.tasks_completed) || 0,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user's tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'all' } = req.query; // 'sent', 'received', 'all'

    let query = '';
    if (type === 'sent') {
      query = 'SELECT * FROM tasks WHERE sender_id = $1 ORDER BY created_at DESC';
    } else if (type === 'received') {
      query = 'SELECT * FROM tasks WHERE courier_id = $1 ORDER BY created_at DESC';
    } else {
      query = 'SELECT * FROM tasks WHERE sender_id = $1 OR courier_id = $1 ORDER BY created_at DESC';
    }

    const result = await pool.query(query, [id]);

    res.json({ tasks: result.rows });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ error: 'Failed to get user tasks' });
  }
});

// Get current user profile (me)
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, name, phone, rating, deliveries_count, created_at,
        phone_sbp, account_number, bank_name,
        (SELECT COUNT(*) FROM tasks WHERE sender_id = users.id) as tasks_created,
        (SELECT COUNT(*) FROM tasks WHERE courier_id = users.id) as tasks_completed
      FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      rating: user.rating,
      deliveriesCount: user.deliveries_count,
      tasksCreated: parseInt(user.tasks_created) || 0,
      tasksCompleted: parseInt(user.tasks_completed) || 0,
      phoneSbp: user.phone_sbp,
      accountNumber: user.account_number,
      bankName: user.bank_name,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update current user profile
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phoneSbp: z.string().regex(/^\+7\d{10}$/).optional().or(z.literal('')),
  accountNumber: z.string().max(50).optional().or(z.literal('')),
  bankName: z.string().max(100).optional().or(z.literal('')),
});

router.patch('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.phoneSbp !== undefined) {
      updates.push(`phone_sbp = $${paramCount++}`);
      values.push(data.phoneSbp || null);
    }

    if (data.accountNumber !== undefined) {
      updates.push(`account_number = $${paramCount++}`);
      values.push(data.accountNumber || null);
    }

    if (data.bankName !== undefined) {
      updates.push(`bank_name = $${paramCount++}`);
      values.push(data.bankName || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    res.json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      phone: result.rows[0].phone,
      phoneSbp: result.rows[0].phone_sbp,
      accountNumber: result.rows[0].account_number,
      bankName: result.rows[0].bank_name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get payment details for task (courier's payment info)
router.get('/tasks/:taskId/payment-details', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;

    // Check if user is the sender of this task
    const taskResult = await pool.query(
      'SELECT sender_id, courier_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    if (task.sender_id !== req.userId) {
      return res.status(403).json({ error: 'Only task sender can view payment details' });
    }

    if (!task.courier_id) {
      return res.status(400).json({ error: 'Task has no courier assigned' });
    }

    // Get courier's payment details
    const courierResult = await pool.query(
      'SELECT phone_sbp, account_number, bank_name, phone FROM users WHERE id = $1',
      [task.courier_id]
    );

    if (courierResult.rows.length === 0) {
      return res.status(404).json({ error: 'Courier not found' });
    }

    const courier = courierResult.rows[0];

    res.json({
      phoneSbp: courier.phone_sbp || courier.phone,
      accountNumber: courier.account_number,
      bankName: courier.bank_name,
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ error: 'Failed to get payment details' });
  }
});

export default router;


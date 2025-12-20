import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

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

export default router;


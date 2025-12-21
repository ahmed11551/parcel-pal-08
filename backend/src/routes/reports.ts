import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const router = express.Router();

const createReportSchema = z.object({
  reportedUserId: z.number().int().positive().optional(),
  taskId: z.number().int().positive().optional(),
  type: z.enum(['user', 'task', 'other']),
  reason: z.string().min(1).max(100),
  description: z.string().min(10).max(1000),
});

// Create report/complaint
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = createReportSchema.parse(req.body);
    const { reportedUserId, taskId, type, reason, description } = data;

    // Validate that either reportedUserId or taskId is provided
    if (type === 'user' && !reportedUserId) {
      return res.status(400).json({ error: 'reportedUserId is required for user reports' });
    }

    if (type === 'task' && !taskId) {
      return res.status(400).json({ error: 'taskId is required for task reports' });
    }

    // If taskId provided, verify task exists and get reportedUserId if needed
    if (taskId) {
      const taskResult = await pool.query('SELECT sender_id, courier_id FROM tasks WHERE id = $1', [taskId]);
      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      const task = taskResult.rows[0];
      // Determine reported user (the other user in the task)
      const otherUserId = task.sender_id === req.userId ? task.courier_id : task.sender_id;
      if (type === 'task' && !reportedUserId) {
        // Use other user from task
        data.reportedUserId = otherUserId;
      }
    }

    // Insert report
    const result = await pool.query(
      `INSERT INTO reports (reporter_id, reported_user_id, task_id, type, reason, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, created_at`,
      [req.userId, data.reportedUserId || null, taskId || null, type, reason, description]
    );

    logger.info({ 
      reportId: result.rows[0].id, 
      reporterId: req.userId, 
      reportedUserId: data.reportedUserId,
      taskId,
      type 
    }, 'Report created');

    res.status(201).json({
      success: true,
      id: result.rows[0].id,
      message: 'Жалоба отправлена. Мы рассмотрим её в ближайшее время.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ err: error, userId: req.userId }, 'Create report error');
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Get user's reports (optional - for viewing own reports)
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, reason, description, status, created_at, updated_at
       FROM reports
       WHERE reporter_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json({ reports: result.rows });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get my reports error');
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

export default router;


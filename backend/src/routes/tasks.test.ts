import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import taskRoutes from './tasks.js';
import { authenticateToken } from '../middleware/auth.js';

// Mock authentication middleware
jest.mock('../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    // Mock authenticated user
    req.userId = 1;
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.userId = null;
    next();
  },
}));

// Mock database
jest.mock('../db/index.js', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

// Mock notifications
jest.mock('../services/telegram-notifications.js', () => ({
  notifyNewTask: jest.fn().mockResolvedValue(undefined),
  notifyTaskAssigned: jest.fn().mockResolvedValue(undefined),
  notifyTaskStatusChanged: jest.fn().mockResolvedValue(undefined),
}));

const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

describe('Tasks Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return list of active tasks', async () => {
      const { pool } = require('../db/index.js');
      
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            title: 'Test Task',
            from_airport: 'SVO',
            to_airport: 'LED',
            reward: 1000,
            status: 'active',
            sender_id: 1,
            courier_id: null,
            created_at: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/tasks')
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0]).toHaveProperty('id', 1);
    });

    it('should filter tasks by airports', async () => {
      const { pool } = require('../db/index.js');
      
      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .get('/api/tasks')
        .query({ from: 'SVO', to: 'LED' });

      expect(response.status).toBe(200);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('from_airport'),
        expect.arrayContaining(['SVO', 'LED'])
      );
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const { pool } = require('../db/index.js');
      const client = {
        query: jest.fn(),
        release: jest.fn(),
      };
      
      pool.connect.mockResolvedValueOnce(client);
      
      // Mock transaction
      client.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            title: 'Test Task',
            from_airport: 'SVO',
            to_airport: 'LED',
            reward: 1000,
            status: 'active',
            sender_id: 1,
          }],
        }) // INSERT task
        .mockResolvedValueOnce({}) // COMMIT
        .mockResolvedValueOnce({
          rows: [{ telegram_id: 123 }],
        }); // Get subscribers

      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description',
          size: 'M',
          fromAirport: 'SVO',
          toAirport: 'LED',
          dateFrom: '2025-12-25',
          dateTo: '2025-12-26',
          reward: 1000,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task).toHaveProperty('id', 1);
    });

    it('should reject invalid task data', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          // Missing required fields
          title: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/tasks/:id/assign', () => {
    it('should assign courier to task', async () => {
      const { pool } = require('../db/index.js');
      
      // Mock: task exists and is active
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            status: 'active',
            sender_id: 2,
            courier_id: null,
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ telegram_id: 123 }],
        }) // Get courier telegram
        .mockResolvedValueOnce({
          rowCount: 1,
        }); // Update task

      const response = await request(app)
        .post('/api/tasks/1/assign');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject assignment to own task', async () => {
      const { pool } = require('../db/index.js');
      
      // Mock: task belongs to current user
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'active',
          sender_id: 1, // Same as req.userId
          courier_id: null,
        }],
      });

      const response = await request(app)
        .post('/api/tasks/1/assign');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject assignment to non-active task', async () => {
      const { pool } = require('../db/index.js');
      
      // Mock: task is not active
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'assigned',
          sender_id: 2,
          courier_id: 3,
        }],
      });

      const response = await request(app)
        .post('/api/tasks/1/assign');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('active');
    });
  });
});


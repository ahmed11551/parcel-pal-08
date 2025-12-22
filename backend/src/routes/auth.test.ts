import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRoutes from './auth.js';
import { pool } from '../db/index.js';

// Mock database
jest.mock('../db/index.js', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register/send-code', () => {
    it('should send SMS code for valid phone number', async () => {
      const mockQuery = pool.query as jest.Mock;
      
      // Mock: user doesn't exist
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      // Mock: insert SMS code
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .post('/api/auth/register/send-code')
        .send({
          name: 'Test User',
          phone: '+79991234567',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('SMS code sent');
    });

    it('should reject invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/register/send-code')
        .send({
          name: 'Test User',
          phone: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing name', async () => {
      const response = await request(app)
        .post('/api/auth/register/send-code')
        .send({
          phone: '+79991234567',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/register/verify', () => {
    it('should register user with valid code', async () => {
      const mockQuery = pool.query as jest.Mock;
      
      // Mock: SMS code exists and valid
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          phone: '+79991234567',
          code: '1234',
          expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        }],
      });
      
      // Mock: user doesn't exist
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      // Mock: create user
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          phone: '+79991234567',
          name: 'Test User',
        }],
      });
      
      // Mock: delete SMS code
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .post('/api/auth/register/verify')
        .send({
          phone: '+79991234567',
          code: '1234',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid code', async () => {
      const mockQuery = pool.query as jest.Mock;
      
      // Mock: SMS code doesn't exist
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/register/verify')
        .send({
          phone: '+79991234567',
          code: '9999',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject expired code', async () => {
      const mockQuery = pool.query as jest.Mock;
      
      // Mock: SMS code expired
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          phone: '+79991234567',
          code: '1234',
          expires_at: new Date(Date.now() - 1000), // Expired
        }],
      });

      const response = await request(app)
        .post('/api/auth/register/verify')
        .send({
          phone: '+79991234567',
          code: '1234',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('expired');
    });
  });

  describe('POST /api/auth/login/send-code', () => {
    it('should send SMS code for existing user', async () => {
      const mockQuery = pool.query as jest.Mock;
      
      // Mock: user exists
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          phone: '+79991234567',
        }],
      });
      
      // Mock: insert SMS code
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .post('/api/auth/login/send-code')
        .send({
          phone: '+79991234567',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject non-existent user', async () => {
      const mockQuery = pool.query as jest.Mock;
      
      // Mock: user doesn't exist
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login/send-code')
        .send({
          phone: '+79991234567',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});

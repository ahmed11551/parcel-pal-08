import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Общий rate limiter для API
 * 100 запросов в 15 минут на IP
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  message: { 
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Возвращает rate limit info в заголовках
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
    }, 'Rate limit exceeded');
    
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later',
      retryAfter: '15 minutes'
    });
  },
  skip: (req: Request) => {
    // Пропускаем health check и metrics
    return req.path === '/api/health' || req.path === '/api/metrics';
  },
});

/**
 * Строгий rate limiter для аутентификации
 * 10 попыток в 15 минут на IP
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // максимум 10 попыток
  message: { 
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
    }, 'Auth rate limit exceeded');
    
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later',
      retryAfter: '15 minutes'
    });
  },
});

/**
 * Rate limiter для создания заданий
 * 20 заданий в час на пользователя
 */
export const createTaskRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 20, // максимум 20 заданий
  message: { 
    error: 'Too many tasks created, please try again later',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // Используем user ID если пользователь авторизован, иначе IP
    return req.userId ? `user:${req.userId}` : req.ip;
  },
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      userId: (req as any).userId,
      path: req.path,
    }, 'Create task rate limit exceeded');
    
    res.status(429).json({
      error: 'Too many tasks created, please try again later',
      retryAfter: '1 hour'
    });
  },
});

/**
 * Rate limiter для отправки сообщений
 * 50 сообщений в 15 минут на пользователя
 */
export const messageRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 50, // максимум 50 сообщений
  message: { 
    error: 'Too many messages sent, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.userId ? `user:${req.userId}` : req.ip;
  },
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      userId: (req as any).userId,
      path: req.path,
    }, 'Message rate limit exceeded');
    
    res.status(429).json({
      error: 'Too many messages sent, please try again later',
      retryAfter: '15 minutes'
    });
  },
});


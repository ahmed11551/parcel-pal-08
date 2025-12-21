import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import { initDatabase, closeDatabase } from './db/index.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import telegramRoutes from './routes/telegram.js';
import { logger, metrics } from './utils/logger.js';
import { securityHeaders, sanitizeError } from './middleware/security.js';

dotenv.config();

// Проверка обязательных переменных окружения
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Отсутствуют обязательные переменные окружения:', missingVars.join(', '));
  console.error('💡 Проверьте файл .env или .env.production');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Security headers
app.use(securityHeaders);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'https://send-buddy.ru',
  'https://web.telegram.org', // Telegram Web App
  'https://telegram.org', // Telegram Web App fallback
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman, or Telegram Web App)
    if (!origin || allowedOrigins.includes(origin) || origin.includes('telegram.org')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Структурированное логирование HTTP запросов
app.use(pinoHttp({ 
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads (only if directory exists)
import fs from 'fs';
if (fs.existsSync('uploads')) {
  app.use('/uploads', express.static('uploads'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/telegram', telegramRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  const stats: Record<string, any> = {};
  
  // Статистика по HTTP запросам
  const httpStats = metrics.getMetricStats('http_request_duration');
  if (httpStats) {
    stats.httpRequests = httpStats;
  }

  // Статистика по SMS
  const smsStats = metrics.getMetricStats('sms_send_duration');
  if (smsStats) {
    stats.sms = smsStats;
  }

  // Статистика по Telegram API
  const telegramStats = metrics.getMetricStats('telegram_api_duration');
  if (telegramStats) {
    stats.telegram = telegramStats;
  }

  res.json({
    timestamp: new Date().toISOString(),
    metrics: stats,
    allMetrics: metrics.getMetrics().slice(-100), // Последние 100 метрик
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({
    err,
    method: req.method,
    url: req.url,
    statusCode: err.status || 500,
  }, 'Request error');
  
  const errorMessage = sanitizeError(err);
  
  res.status(err.status || 500).json({
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.message !== errorMessage ? err.message : undefined
    })
  });
});

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    logger.info('Database connected');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info({
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
      }, 'Server started');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        closeDatabase().then(() => {
          logger.info('Database connection closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

start();


import pg from 'pg';
import dotenv from 'dotenv';
import { createTables } from './schema.js';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Отключаем SSL для локальных подключений (Docker Compose)
  // Включаем только для внешних сервисов (Railway, облачные БД)
  ssl: process.env.DATABASE_URL?.includes('railway') || 
       process.env.DATABASE_URL?.includes('amazonaws') ||
       process.env.DATABASE_URL?.includes('azure') ||
       (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost') && !process.env.DATABASE_URL?.includes('postgres:'))
    ? { rejectUnauthorized: false } 
    : false,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function initDatabase() {
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    
    // Create tables
    await createTables();
    
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export async function closeDatabase() {
  await pool.end();
}


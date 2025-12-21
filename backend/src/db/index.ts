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

// Очистка старых SMS кодов (старше 24 часов)
async function cleanupOldSMSCodes() {
  try {
    const result = await pool.query(
      `DELETE FROM sms_codes 
       WHERE (expires_at < NOW() OR created_at < NOW() - INTERVAL '24 hours')
       AND used = TRUE`
    );
    if (result.rowCount && result.rowCount > 0) {
      // Используем console.log для системных сообщений, так как logger может быть не инициализирован
      console.log(`🧹 Очищено ${result.rowCount} старых SMS кодов`);
    }
  } catch (error) {
    console.error('Ошибка при очистке старых SMS кодов:', error);
  }
}

export async function initDatabase() {
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    
    // Create tables
    await createTables();
    
    // Очистка старых SMS кодов при старте
    await cleanupOldSMSCodes();
    
    // Периодическая очистка каждые 6 часов
    setInterval(cleanupOldSMSCodes, 6 * 60 * 60 * 1000);
    
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export async function closeDatabase() {
  await pool.end();
}


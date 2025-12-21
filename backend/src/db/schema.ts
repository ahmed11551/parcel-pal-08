import { pool } from './index.js';

export async function createTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255),
        verified BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 5.0,
        deliveries_count INTEGER DEFAULT 0,
        phone_sbp VARCHAR(20),
        account_number VARCHAR(50),
        bank_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        courier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        size VARCHAR(10) NOT NULL CHECK (size IN ('S', 'M', 'L')),
        estimated_value INTEGER,
        photo_url VARCHAR(500),
        from_airport VARCHAR(10) NOT NULL,
        from_point VARCHAR(200),
        to_airport VARCHAR(10) NOT NULL,
        to_point VARCHAR(200),
        date_from DATE NOT NULL,
        date_to DATE NOT NULL,
        reward INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'assigned', 'in_transit', 'delivered', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        courier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        amount INTEGER NOT NULL,
        commission INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'refunded')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // SMS codes table (for verification)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Telegram users table (link Telegram ID with user ID)
    await client.query(`
      CREATE TABLE IF NOT EXISTS telegram_users (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(100),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        subscribed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Telegram subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS telegram_subscriptions (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        subscription_type VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES telegram_users(telegram_id) ON DELETE CASCADE
      )
    `);

    // Support messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        response TEXT,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES telegram_users(telegram_id) ON DELETE SET NULL
      )
    `);

    // Telegram notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS telegram_notifications (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        sent BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES telegram_users(telegram_id) ON DELETE CASCADE
      )
    `);

    // Indexes для оптимизации запросов
    await client.query(`
      -- Users indexes
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      
      -- Tasks indexes
      CREATE INDEX IF NOT EXISTS idx_tasks_sender ON tasks(sender_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_courier ON tasks(courier_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_airports ON tasks(from_airport, to_airport);
      CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(date_from, date_to);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
      
      -- Messages indexes
      CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id);
      CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(sender_id, receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read, created_at DESC);
      
      -- Payments indexes
      CREATE INDEX IF NOT EXISTS idx_payments_task ON payments(task_id);
      CREATE INDEX IF NOT EXISTS idx_payments_sender ON payments(sender_id);
      CREATE INDEX IF NOT EXISTS idx_payments_courier ON payments(courier_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      
      -- SMS codes indexes (для быстрого поиска и очистки)
      CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);
      CREATE INDEX IF NOT EXISTS idx_sms_codes_phone_code ON sms_codes(phone, code);
      CREATE INDEX IF NOT EXISTS idx_sms_codes_expires ON sms_codes(expires_at);
      CREATE INDEX IF NOT EXISTS idx_sms_codes_used_created ON sms_codes(used, created_at);
      
      -- Telegram indexes
      CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_telegram_users_subscribed ON telegram_users(subscribed);
      CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_telegram_id ON telegram_subscriptions(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_active ON telegram_subscriptions(telegram_id, active);
      CREATE INDEX IF NOT EXISTS idx_support_messages_telegram_id ON support_messages(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
      CREATE INDEX IF NOT EXISTS idx_telegram_notifications_telegram_id ON telegram_notifications(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_telegram_notifications_sent ON telegram_notifications(sent);
      CREATE INDEX IF NOT EXISTS idx_telegram_notifications_unsent ON telegram_notifications(telegram_id, sent) WHERE sent = FALSE;
      
      -- Ratings indexes
      CREATE INDEX IF NOT EXISTS idx_ratings_task ON ratings(task_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON ratings(to_user_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}


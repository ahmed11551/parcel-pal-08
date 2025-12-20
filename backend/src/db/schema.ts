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

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_sender ON tasks(sender_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_courier ON tasks(courier_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_airports ON tasks(from_airport, to_airport);
      CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id);
      CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(sender_id, receiver_id);
      CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);
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


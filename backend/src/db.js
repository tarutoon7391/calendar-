const { Pool } = require('pg');

// Railway の DATABASE_URL をそのまま使う想定。
// SSL が必要な環境では DATABASE_SSL=true を設定する。
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// 起動時にテーブルがなければ作成する
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      code CHAR(6) NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stamps (
      id SERIAL PRIMARY KEY,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      emoji TEXT NOT NULL,
      memo TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_stamps_room_date ON stamps (room_id, date);
  `);
}

module.exports = { pool, init };

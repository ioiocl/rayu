const { Pool } = require("pg");

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error("Falta la variable de entorno DATABASE_URL");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function initPostgres() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stories (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image')),
      cover_content TEXT NOT NULL,
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chapter_activity (
      id UUID PRIMARY KEY,
      story_id UUID NOT NULL REFERENCES stories(id),
      chapter_id UUID UNIQUE NOT NULL,
      chapter_number INTEGER NOT NULL,
      parent_chapter_id UUID,
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = {
  pool,
  initPostgres,
};

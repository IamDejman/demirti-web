/**
 * PostgreSQL connection wrapper using `pg` (Supabase).
 * Provides a `sql` tagged template that returns { rows, rowCount }.
 */
import './env-db';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Tagged template literal for parameterized SQL queries.
 * Usage: sql`SELECT * FROM users WHERE id = ${id}`
 * Returns the same { rows, rowCount } shape as @vercel/postgres.
 */
export function sql(strings, ...values) {
  let text = '';
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }
  return pool.query(text, values);
}

/**
 * Create a separate connection pool (e.g. for read replicas).
 * Returns an object with a `sql` tagged template bound to that pool.
 */
export function createPool({ connectionString }) {
  const p = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  return {
    sql(strings, ...values) {
      let text = '';
      for (let i = 0; i < strings.length; i++) {
        text += strings[i];
        if (i < values.length) {
          text += `$${i + 1}`;
        }
      }
      return p.query(text, values);
    },
  };
}

/** Helper to build parameterized query text from a tagged template. */
function buildQuery(strings, values) {
  let text = '';
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }
  return { text, values };
}

/**
 * Pool-level object for transaction support (mirrors @vercel/postgres `db`).
 * Usage: const client = await db.connect(); client.sql`...`; client.release();
 */
export const db = {
  async connect() {
    const client = await pool.connect();
    client.sql = function (strings, ...values) {
      const { text, values: params } = buildQuery(strings, values);
      return client.query(text, params);
    };
    return client;
  },
};

import './env-db';
import { db } from '@vercel/postgres';

/**
 * Execute a callback inside a database transaction.
 * The callback receives a `client` with a tagged-template `sql` method.
 * If the callback throws, the transaction is rolled back automatically.
 *
 * Usage:
 *   const result = await withTransaction(async (client) => {
 *     const a = await client.sql`INSERT INTO ... RETURNING *`;
 *     const b = await client.sql`UPDATE ... WHERE id = ${a.rows[0].id}`;
 *     return b.rows[0];
 *   });
 */
export async function withTransaction(callback) {
  const client = await db.connect();
  try {
    await client.sql`BEGIN`;
    const result = await callback(client);
    await client.sql`COMMIT`;
    return result;
  } catch (error) {
    await client.sql`ROLLBACK`;
    throw error;
  } finally {
    client.release();
  }
}

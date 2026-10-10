import pg from 'pg';
import 'dotenv/config';

// Return numeric / bigint columns as JS numbers instead of strings
pg.types.setTypeParser(1700, (v) => parseFloat(v)); // NUMERIC
pg.types.setTypeParser(20, (v) => Number(v)); // BIGINT
pg.types.setTypeParser(1082, (v) => v); // DATE -> plain 'YYYY-MM-DD' (no timezone shift)

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10,
});

/** Run one parameterised query. */
export const query = (text, params) => pool.query(text, params);

/** Run several statements in ONE transaction. Rolls back if the callback throws. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Run database functions "as" a signed-in user.
 *
 * Our SQL functions (withdraw_bid, decline_bid, claim_delivery ...) decide who is calling with
 * auth.uid(). That value is normally filled in by Supabase's own API gateway. We connect with
 * plain `pg`, so we set it ourselves: for the length of ONE transaction we store the user's id in
 * the 'request.jwt.claims' setting, which is exactly what auth.uid() reads.
 * (is_local = true means the setting disappears at COMMIT/ROLLBACK, so it can never leak to
 * another request that reuses the same pooled connection.)
 */
export function withUser(userId, fn) {
  return withTransaction(async (db) => {
    const claims = JSON.stringify({ sub: userId, role: 'authenticated' });
    await db.query(`SELECT set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [
      claims,
      userId,
    ]);
    return fn(db);
  });
}

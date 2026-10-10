import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../db.js';
import { HttpError, wrap } from '../http.js';
import { requireAuth, signToken } from '../auth.js';

const router = Router();
const ROLES = ['farmer', 'buyer', 'delivery'];
const PROFILE_COLS = 'id, role::text AS role, name, farm_name, avatar_url, phone, verified, email';

// POST /api/auth/signup
router.post(
  '/signup',
  wrap(async (req, res) => {
    const { email, password, name, role, farmName, phone } = req.body ?? {};
    if (!email || !password || !name) throw new HttpError(400, 'Name, email and password are required.');
    if (!ROLES.includes(role)) throw new HttpError(400, 'Pick a valid account type.');
    if (String(password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');

    const cleanEmail = String(email).trim().toLowerCase();
    const taken = await query('SELECT 1 FROM profiles WHERE lower(email) = $1', [cleanEmail]);
    if (taken.rowCount > 0) throw new HttpError(409, 'An account with this email already exists.');

    const hash = await bcrypt.hash(String(password), 10);
    const profile = await withTransaction(async (db) => {
      const ins = await db.query(
        `INSERT INTO profiles (role, name, farm_name, email, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${PROFILE_COLS}`,
        [role, String(name).trim(), role === 'farmer' ? farmName?.trim() || null : null, cleanEmail, phone?.trim() || null]
      );
      await db.query('INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)', [
        ins.rows[0].id,
        hash,
      ]);
      return ins.rows[0];
    });

    res.status(201).json({ token: signToken(profile), user: { id: profile.id, email: cleanEmail }, profile });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  wrap(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw new HttpError(400, 'Email and password are required.');
    const cleanEmail = String(email).trim().toLowerCase();

    const r = await query(
      `SELECT p.id, p.role::text AS role, p.name, p.farm_name, p.avatar_url, p.phone, p.verified,
              p.email, c.password_hash
         FROM profiles p JOIN user_credentials c ON c.user_id = p.id
        WHERE lower(p.email) = $1`,
      [cleanEmail]
    );
    const row = r.rows[0];
    const ok = row && (await bcrypt.compare(String(password), row.password_hash));
    if (!ok) throw new HttpError(401, 'Invalid email or password.');

    const { password_hash: _drop, ...profile } = row;
    res.json({ token: signToken(profile), user: { id: profile.id, email: profile.email }, profile });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const r = await query(`SELECT ${PROFILE_COLS} FROM profiles WHERE id = $1`, [req.user.id]);
    if (!r.rows[0]) throw new HttpError(401, 'Account not found.');
    res.json({ user: { id: r.rows[0].id, email: r.rows[0].email }, profile: r.rows[0] });
  })
);

export default router;

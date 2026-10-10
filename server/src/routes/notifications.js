import { Router } from 'express';
import { query } from '../db.js';
import { wrap } from '../http.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

// READ: my latest notifications (written by the database triggers) + how many are unread
router.get(
  '/',
  wrap(async (req, res) => {
    const [items, unread] = await Promise.all([
      query(
        `SELECT id, kind, message, link, is_read, created_at
           FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
        [req.user.id]
      ),
      query('SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND NOT is_read', [req.user.id]),
    ]);
    res.json({ items: items.rows, unread: unread.rows[0].n });
  })
);

// UPDATE: mark all of mine as read
router.post(
  '/read',
  wrap(async (req, res) => {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND NOT is_read', [req.user.id]);
    res.json({ ok: true });
  })
);

export default router;

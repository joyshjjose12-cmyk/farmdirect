import { Router } from 'express';
import { query, withUser } from '../db.js';
import { HttpError, wrap } from '../http.js';
import { requireAuth, requireRole } from '../auth.js';
import { ORDER_SELECT } from '../queries.js';

const router = Router();
router.use(requireAuth);

// READ: ?scope=buyer | farmer | delivery  (must match the signed-in role)
router.get(
  '/',
  wrap(async (req, res) => {
    const scope = req.query.scope;
    if (!['buyer', 'farmer', 'delivery'].includes(scope)) throw new HttpError(400, 'Unknown scope.');
    if (req.user.role !== scope) throw new HttpError(403, `Only ${scope} accounts can see this.`);

    let where = '';
    const params = [];
    if (scope === 'buyer') {
      where = 'WHERE o.buyer_id = $1';
      params.push(req.user.id);
    } else if (scope === 'farmer') {
      where = 'WHERE o.listing_id IN (SELECT id FROM listings WHERE farmer_id = $1)';
      params.push(req.user.id);
    }
    const r = await query(`${ORDER_SELECT} ${where} ORDER BY o.placed_at DESC`, params);
    res.json(r.rows);
  })
);

// Each delivery action below is one database function (see supabase_delivery.sql).
// The function checks who is calling (auth.uid()) and whether the order is in the right state,
// and raises an exception with a readable message if not.

// UPDATE (buyer): save / edit the delivery address   ->  set_delivery_address()
router.put(
  '/:id/address',
  requireRole('buyer'),
  wrap(async (req, res) => {
    const { address, lat, lng, phone, notes } = req.body ?? {};
    await withUser(req.user.id, (db) =>
      db.query('SELECT set_delivery_address($1, $2, $3, $4, $5, $6)', [
        req.params.id,
        address ?? '',
        lat ?? null,
        lng ?? null,
        phone ?? '',
        notes ?? '',
      ])
    );
    res.json({ ok: true });
  })
);

// UPDATE (delivery): take a job   bid_accepted -> harvest_scheduled   ->  claim_delivery()
router.post(
  '/:id/claim',
  requireRole('delivery'),
  wrap(async (req, res) => {
    await withUser(req.user.id, (db) => db.query('SELECT claim_delivery($1)', [req.params.id]));
    res.json({ ok: true });
  })
);

// UPDATE (delivery): give a job back   harvest_scheduled -> bid_accepted   ->  release_delivery()
router.post(
  '/:id/release',
  requireRole('delivery'),
  wrap(async (req, res) => {
    await withUser(req.user.id, (db) => db.query('SELECT release_delivery($1)', [req.params.id]));
    res.json({ ok: true });
  })
);

// UPDATE (delivery): harvest_scheduled -> out_for_delivery -> delivered   ->  advance_delivery()
router.post(
  '/:id/advance',
  requireRole('delivery'),
  wrap(async (req, res) => {
    const { stage } = req.body ?? {};
    await withUser(req.user.id, (db) => db.query('SELECT advance_delivery($1, $2)', [req.params.id, stage ?? '']));
    res.json({ ok: true });
  })
);

// CREATE (delivery): append the courier's GPS position   ->  log_courier_location()
router.post(
  '/:id/location',
  requireRole('delivery'),
  wrap(async (req, res) => {
    const { lat, lng, place } = req.body ?? {};
    if (typeof lat !== 'number' || typeof lng !== 'number') throw new HttpError(400, 'lat and lng are required.');
    await withUser(req.user.id, (db) =>
      db.query('SELECT log_courier_location($1, $2, $3, $4)', [req.params.id, lat, lng, place ?? null])
    );
    res.status(201).json({ ok: true });
  })
);

// READ: latest courier position (buyer, farmer or courier of that order)
router.get(
  '/:id/location',
  wrap(async (req, res) => {
    const r = await query(
      `SELECT t.latitude, t.longitude, t.logged_at
         FROM transport_logs t
         JOIN orders o ON o.id = t.order_id
         JOIN listings l ON l.id = o.listing_id
        WHERE t.order_id = $1 AND t.latitude IS NOT NULL
          AND (o.buyer_id = $2 OR o.delivery_person_id = $2 OR l.farmer_id = $2)
        ORDER BY t.logged_at DESC LIMIT 1`,
      [req.params.id, req.user.id]
    );
    res.json(r.rows[0] ?? null);
  })
);

export default router;

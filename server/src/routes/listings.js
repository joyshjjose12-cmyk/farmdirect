import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { HttpError, wrap } from '../http.js';
import { requireAuth, requireRole } from '../auth.js';
import { FARMER_DASHBOARD_SELECT, LISTING_BIDS_SELECT, LISTING_SELECT } from '../queries.js';

const router = Router();

// READ (public): all active listings, newest first
router.get(
  '/',
  wrap(async (_req, res) => {
    const r = await query(`${LISTING_SELECT} WHERE l.status::text = 'Active' ORDER BY l.created_at DESC`);
    res.json(r.rows);
  })
);

// READ (farmer): my own listings with bid / order counts for the dashboard
router.get(
  '/mine',
  requireAuth,
  requireRole('farmer'),
  wrap(async (req, res) => {
    const r = await query(`${FARMER_DASHBOARD_SELECT} WHERE l.farmer_id = $1 ORDER BY l.created_at DESC`, [
      req.user.id,
    ]);
    res.json(r.rows);
  })
);

// READ (public): one listing
router.get(
  '/:id',
  wrap(async (req, res) => {
    const r = await query(`${LISTING_SELECT} WHERE l.id = $1`, [req.params.id]);
    if (!r.rows[0]) throw new HttpError(404, 'Listing not found.');
    res.json(r.rows[0]);
  })
);

// READ: all bids on one listing
router.get(
  '/:id/bids',
  wrap(async (req, res) => {
    const r = await query(`${LISTING_BIDS_SELECT} WHERE b.listing_id = $1 ORDER BY b.placed_at DESC`, [
      req.params.id,
    ]);
    res.json(r.rows);
  })
);

/** Find the crop by name (case-insensitive) or create it. */
async function findOrCreateCrop(db, name, cropType) {
  const found = await db.query('SELECT id FROM crops WHERE name ILIKE $1 LIMIT 1', [name]);
  if (found.rows[0]) return found.rows[0].id;
  const ins = await db.query('INSERT INTO crops (name, crop_type) VALUES ($1, $2) RETURNING id', [name, cropType]);
  return ins.rows[0].id;
}

/** Coordinates must be real numbers; anything else (empty, '20.0°N') is stored as NULL. */
const toCoord = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v));

function readBody(b) {
  const cropName = String(b.cropName ?? '').trim();
  if (!cropName) throw new HttpError(400, 'Please select a crop.');
  if (!(Number(b.quantity) > 0)) throw new HttpError(400, 'Quantity must be greater than 0.');
  if (!(Number(b.pricePerUnit) > 0)) throw new HttpError(400, 'Price must be greater than 0.');
  return {
    cropName,
    cropType: b.cropType || 'Vegetables',
    quantity: Number(b.quantity),
    unit: b.unit || 'kg',
    price: Number(b.pricePerUnit),
    quality: Number(b.qualityRating) || 0,
    description: b.description ?? '',
    location: b.location ?? '',
    latitude: toCoord(b.latitude),
    longitude: toCoord(b.longitude),
    organic: Boolean(b.organic),
    harvestDate: b.harvestDate || null,
    imageUrl: b.imageUrl || null,
  };
}

// CREATE (farmer)
router.post(
  '/',
  requireAuth,
  requireRole('farmer'),
  wrap(async (req, res) => {
    const f = readBody(req.body ?? {});
    const created = await withTransaction(async (db) => {
      const cropId = await findOrCreateCrop(db, f.cropName, f.cropType);
      const r = await db.query(
        `INSERT INTO listings
           (farmer_id, crop_id, price_per_unit, unit, quantity_available, location_text,
            latitude, longitude, quality_rating, description, organic, harvest_date, image_url, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Active')
         RETURNING id`,
        [req.user.id, cropId, f.price, f.unit, f.quantity, f.location, f.latitude, f.longitude,
         f.quality, f.description, f.organic, f.harvestDate, f.imageUrl]
      );
      return r.rows[0];
    });
    res.status(201).json(created);
  })
);

// UPDATE (owner farmer)
router.put(
  '/:id',
  requireAuth,
  requireRole('farmer'),
  wrap(async (req, res) => {
    const f = readBody(req.body ?? {});
    const updated = await withTransaction(async (db) => {
      const cropId = await findOrCreateCrop(db, f.cropName, f.cropType);
      const r = await db.query(
        `UPDATE listings SET
            crop_id = $3, price_per_unit = $4, unit = $5, quantity_available = $6,
            location_text = $7, latitude = $8, longitude = $9, quality_rating = $10,
            description = $11, organic = $12, harvest_date = $13,
            image_url = COALESCE($14, image_url)
          WHERE id = $1 AND farmer_id = $2
          RETURNING id`,
        [req.params.id, req.user.id, cropId, f.price, f.unit, f.quantity, f.location, f.latitude,
         f.longitude, f.quality, f.description, f.organic, f.harvestDate, f.imageUrl]
      );
      return r.rows[0];
    });
    if (!updated) throw new HttpError(404, 'Listing not found, or it is not yours.');
    res.json(updated);
  })
);

// UPDATE (owner farmer): mark as sold
router.patch(
  '/:id/sold',
  requireAuth,
  requireRole('farmer'),
  wrap(async (req, res) => {
    const r = await query(
      `UPDATE listings SET status = 'Sold', quantity_available = 0
        WHERE id = $1 AND farmer_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!r.rows[0]) throw new HttpError(404, 'Listing not found, or it is not yours.');
    res.json({ ok: true });
  })
);

// DELETE (owner farmer): only when no order has been created from it
router.delete(
  '/:id',
  requireAuth,
  requireRole('farmer'),
  wrap(async (req, res) => {
    await withTransaction(async (db) => {
      const own = await db.query('SELECT 1 FROM listings WHERE id = $1 AND farmer_id = $2 FOR UPDATE', [
        req.params.id,
        req.user.id,
      ]);
      if (!own.rows[0]) throw new HttpError(404, 'Listing not found, or it is not yours.');

      const used = await db.query('SELECT 1 FROM orders WHERE listing_id = $1 LIMIT 1', [req.params.id]);
      if (used.rowCount > 0) throw new HttpError(409, 'This listing already has orders, so it cannot be deleted.');

      await db.query('DELETE FROM bids WHERE listing_id = $1', [req.params.id]);
      await db.query('DELETE FROM listing_images WHERE listing_id = $1', [req.params.id]);
      await db.query('DELETE FROM listings WHERE id = $1 AND farmer_id = $2', [req.params.id, req.user.id]);
    });
    res.json({ ok: true });
  })
);

export default router;

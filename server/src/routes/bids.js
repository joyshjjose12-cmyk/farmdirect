import { Router } from 'express';
import { query, withTransaction, withUser } from '../db.js';
import { HttpError, wrap } from '../http.js';
import { requireAuth, requireRole } from '../auth.js';
import { BUYER_BIDS_SELECT } from '../queries.js';

const router = Router();
router.use(requireAuth);

// CREATE (buyer): place a bid.
// All the rules (own listing, stock, one pending bid per listing ...) are enforced by the
// bids_validate trigger in the database; its message is returned to the browser as-is.
router.post(
  '/',
  requireRole('buyer'),
  wrap(async (req, res) => {
    const { listingId, amountPerUnit, quantity } = req.body ?? {};
    if (!listingId) throw new HttpError(400, 'No listing selected.');
    const r = await query(
      `INSERT INTO bids (listing_id, buyer_id, amount_per_unit, quantity, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [listingId, req.user.id, Number(amountPerUnit), Number(quantity)]
    );
    res.status(201).json(r.rows[0]);
  })
);

// READ (buyer): my bids + the orders created from them
router.get(
  '/mine',
  requireRole('buyer'),
  wrap(async (req, res) => {
    const [bids, orders] = await Promise.all([
      query(`${BUYER_BIDS_SELECT} WHERE b.buyer_id = $1 ORDER BY b.placed_at DESC`, [req.user.id]),
      query(
        `SELECT id, bid_id, stage::text AS stage, agreed_price_per_unit
           FROM orders WHERE buyer_id = $1`,
        [req.user.id]
      ),
    ]);
    res.json({ bids: bids.rows, orders: orders.rows });
  })
);

// READ: the order created from one bid (buyer of the bid or farmer of the listing)
router.get(
  '/:id/order',
  wrap(async (req, res) => {
    const r = await query(
      `SELECT o.id, o.bid_id, o.stage::text AS stage, o.placed_at
         FROM orders o
         JOIN listings l ON l.id = o.listing_id
        WHERE o.bid_id = $1 AND (o.buyer_id = $2 OR l.farmer_id = $2)`,
      [req.params.id, req.user.id]
    );
    res.json(r.rows[0] ?? null);
  })
);

// DELETE (buyer): withdraw a pending bid  ->  calls the withdraw_bid() function in the database
router.delete(
  '/:id',
  requireRole('buyer'),
  wrap(async (req, res) => {
    await withUser(req.user.id, (db) => db.query('SELECT withdraw_bid($1)', [req.params.id]));
    res.json({ ok: true });
  })
);

// UPDATE (farmer): accept a bid. Three writes, ONE transaction, so nothing is ever half done:
//   1. bid -> accepted   (the bids_on_accept trigger then declines the rest if stock is used up)
//   2. new order row for the buyer to track
//   3. take the quantity out of the listing's stock
router.post(
  '/:id/accept',
  requireRole('farmer'),
  wrap(async (req, res) => {
    await withTransaction(async (db) => {
      const r = await db.query(
        `SELECT b.id, b.buyer_id, b.listing_id, b.amount_per_unit, b.quantity, b.status::text AS status,
                l.farmer_id, l.quantity_available
           FROM bids b JOIN listings l ON l.id = b.listing_id
          WHERE b.id = $1
          FOR UPDATE OF b, l`,
        [req.params.id]
      );
      const bid = r.rows[0];
      if (!bid || bid.farmer_id !== req.user.id) throw new HttpError(404, 'Bid not found on one of your listings.');
      if (bid.status !== 'pending') throw new HttpError(409, 'This bid has already been answered.');
      if (Number(bid.quantity) > Number(bid.quantity_available))
        throw new HttpError(409, `Only ${bid.quantity_available} left, this bid needs ${bid.quantity}.`);

      await db.query(`UPDATE bids SET status = 'accepted' WHERE id = $1`, [bid.id]);

      await db.query(
        `INSERT INTO orders (listing_id, bid_id, buyer_id, stage, agreed_price_per_unit, quantity, placed_at)
         VALUES ($1, $2, $3, 'bid_accepted', $4, $5, now())`,
        [bid.listing_id, bid.id, bid.buyer_id, bid.amount_per_unit, bid.quantity]
      );

      await db.query(
        `UPDATE listings
            SET quantity_available = quantity_available - $2,
                status = CASE WHEN quantity_available - $2 <= 0 THEN 'Sold' ELSE status END
          WHERE id = $1`,
        [bid.listing_id, bid.quantity]
      );
    });
    res.json({ ok: true });
  })
);

// UPDATE (farmer): decline a pending bid  ->  calls the decline_bid() function in the database
router.post(
  '/:id/decline',
  requireRole('farmer'),
  wrap(async (req, res) => {
    await withUser(req.user.id, (db) => db.query('SELECT decline_bid($1)', [req.params.id]));
    res.json({ ok: true });
  })
);

export default router;

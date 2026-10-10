import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { query } from './db.js';
import { errorHandler } from './http.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import bidRoutes from './routes/bids.js';
import orderRoutes from './routes/orders.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes, { UPLOAD_DIR } from './routes/uploads.js';

const app = express();

app.use(cors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',') }));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', async (_req, res) => {
  try {
    const r = await query('SELECT now() AS time, current_database() AS db');
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`FarmDirect API listening on http://localhost:${port}`));

/** Throw this from a route to send a specific status + message to the browser. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wrap an async route so thrown errors reach the error handler. */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Express error handler. Trigger / constraint messages from Postgres are passed through. */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });

  // P0001 = RAISE EXCEPTION (our triggers), 23xxx = constraint violations, 22xxx = bad input
  const code = err.code ?? '';
  if (code === 'P0001' || code.startsWith('23') || code.startsWith('22')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Server error. Check the server logs.' });
}

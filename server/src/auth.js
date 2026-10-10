import jwt from 'jsonwebtoken';
import { HttpError } from './http.js';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error('JWT_SECRET is not set in server/.env');
  process.exit(1);
}

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '7d' });

function readToken(req) {
  const h = req.headers.authorization ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

/** Requires a valid token. Puts { id, role } on req.user. */
export function requireAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Please sign in.'));
  try {
    const p = jwt.verify(token, SECRET);
    req.user = { id: p.sub, role: p.role };
    next();
  } catch {
    next(new HttpError(401, 'Your session expired. Please sign in again.'));
  }
}

/** Requires one of the given roles (use after requireAuth). */
export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role)
    ? next()
    : next(new HttpError(403, `Only ${roles.join(' / ')} accounts can do this.`));

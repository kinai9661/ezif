import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const COOKIE_NAME = 'admin_token';

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    return jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const cookie = req.cookies?.[COOKIE_NAME];
  if (cookie) return cookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export function isAuthenticated(req: NextApiRequest): boolean {
  const token = getTokenFromRequest(req);
  if (!token) return false;
  return verifyToken(token) !== null;
}

export function setCookieHeader(token: string): string {
  const maxAge = 60 * 60 * 24; // 24 hours
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict`;
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;

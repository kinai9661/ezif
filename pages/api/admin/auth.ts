import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { signToken, setCookieHeader, clearCookieHeader, isAuthenticated } from '../../../lib/auth';
import { getAdminPasswordHash, setAdminPasswordHash } from '../../../lib/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: '請輸入密碼' });

    // Get stored hash or fall back to ADMIN_PASSWORD env var
    let storedHash = await getAdminPasswordHash();
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!storedHash) {
      if (!envPassword) {
        return res.status(500).json({ error: '未設定管理員密碼，請設定 ADMIN_PASSWORD 環境變數' });
      }
      // First login: hash and store the env password
      storedHash = await bcrypt.hash(envPassword, 10);
      await setAdminPasswordHash(storedHash);
    }

    const valid = await bcrypt.compare(password, storedHash);
    if (!valid) return res.status(401).json({ error: '密碼錯誤' });

    const token = signToken({ role: 'admin', iat: Date.now() });
    res.setHeader('Set-Cookie', setCookieHeader(token));
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
    res.setHeader('Set-Cookie', clearCookieHeader());
    return res.status(200).json({ ok: true });
  }

  // PUT: change password
  if (req.method === 'PUT') {
    if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: '請輸入目前密碼與新密碼' });
    if (newPassword.length < 8) return res.status(400).json({ error: '新密碼至少需要 8 個字元' });

    const storedHash = await getAdminPasswordHash();
    const envPassword = process.env.ADMIN_PASSWORD;
    const checkHash = storedHash || (envPassword ? await bcrypt.hash(envPassword, 10) : null);
    if (!checkHash) return res.status(500).json({ error: '無法驗證目前密碼' });

    const valid = await bcrypt.compare(currentPassword, checkHash);
    if (!valid) return res.status(401).json({ error: '目前密碼錯誤' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await setAdminPasswordHash(newHash);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}

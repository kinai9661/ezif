import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminUsers, setAdminUsers, addAuditLog } from '../../../lib/kv';
import { isAuthenticated, getTokenFromRequest } from '../../../lib/auth';
import { AdminUser } from '../../../lib/types';
import * as crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return 'unknown';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      const users = await getAdminUsers();
      const masked = users.map(u => ({ ...u, passwordHash: '****' }));
      return res.status(200).json({ users: masked });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '讀取使用者失敗：' + message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { username, password, role } = req.body;
      if (!username || !password || !role) {
        return res.status(400).json({ error: '使用者名稱、密碼和角色不能為空' });
      }

      const users = await getAdminUsers();
      if (users.some(u => u.username === username)) {
        return res.status(400).json({ error: '使用者名稱已存在' });
      }

      const newUser: AdminUser = {
        id: crypto.randomUUID(),
        username,
        passwordHash: hashPassword(password),
        role,
        enabled: true,
        createdAt: Date.now(),
      };

      users.push(newUser);
      await setAdminUsers(users);

      const token = getTokenFromRequest(req);
      const decoded = token ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) : {};
      await addAuditLog({
        id: crypto.randomUUID(),
        userId: decoded.id || 'unknown',
        username: decoded.username || 'unknown',
        action: 'CREATE_USER',
        resource: 'AdminUser',
        resourceId: newUser.id,
        details: { username, role },
        timestamp: Date.now(),
        ipAddress: getClientIP(req),
      });

      return res.status(201).json({ ok: true, userId: newUser.id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '建立使用者失敗：' + message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { userId, role, enabled } = req.body;
      if (!userId) return res.status(400).json({ error: '使用者 ID 不能為空' });

      const users = await getAdminUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return res.status(404).json({ error: '使用者不存在' });

      const oldRole = user.role;
      const oldEnabled = user.enabled;

      if (role !== undefined) user.role = role;
      if (enabled !== undefined) user.enabled = enabled;

      await setAdminUsers(users);

      const token = getTokenFromRequest(req);
      const decoded = token ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) : {};
      await addAuditLog({
        id: crypto.randomUUID(),
        userId: decoded.id || 'unknown',
        username: decoded.username || 'unknown',
        action: 'UPDATE_USER',
        resource: 'AdminUser',
        resourceId: userId,
        details: { oldRole, newRole: role, oldEnabled, newEnabled: enabled },
        timestamp: Date.now(),
        ipAddress: getClientIP(req),
      });

      return res.status(200).json({ ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '更新使用者失敗：' + message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: '使用者 ID 不能為空' });

      const users = await getAdminUsers();
      const index = users.findIndex(u => u.id === userId);
      if (index === -1) return res.status(404).json({ error: '使用者不存在' });

      const deletedUser = users[index];
      users.splice(index, 1);
      await setAdminUsers(users);

      const token = getTokenFromRequest(req);
      const decoded = token ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) : {};
      await addAuditLog({
        id: crypto.randomUUID(),
        userId: decoded.id || 'unknown',
        username: decoded.username || 'unknown',
        action: 'DELETE_USER',
        resource: 'AdminUser',
        resourceId: userId,
        details: { username: deletedUser.username, role: deletedUser.role },
        timestamp: Date.now(),
        ipAddress: getClientIP(req),
      });

      return res.status(200).json({ ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '刪除使用者失敗：' + message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuditLogs } from '../../../lib/kv';
import { isAuthenticated } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
      const logs = await getAuditLogs(limit);
      return res.status(200).json({ logs: logs.reverse() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '讀取審計日誌失敗：' + message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSettings, setSettings } from '../../../lib/kv';
import { isAuthenticated } from '../../../lib/auth';
import { AppSettings } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const settings = await getSettings();
    // Mask apiKey for display
    const masked = {
      ...settings,
      apiKey: settings.apiKey ? settings.apiKey.slice(0, 4) + '****' + settings.apiKey.slice(-4) : '',
    };
    return res.status(200).json({ settings: masked });
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const current = await getSettings();

    const updated: AppSettings = {
      apiBaseUrl: typeof body.apiBaseUrl === 'string' ? body.apiBaseUrl.trim() : current.apiBaseUrl,
      // Only update apiKey if a non-masked value is provided
      apiKey: (typeof body.apiKey === 'string' && !body.apiKey.includes('****'))
        ? body.apiKey.trim()
        : current.apiKey,
      rateLimitPerMinute: Number(body.rateLimitPerMinute) || current.rateLimitPerMinute,
      rateLimitBurst: Number(body.rateLimitBurst) || current.rateLimitBurst,
      rateLimitBurstWindow: Number(body.rateLimitBurstWindow) || current.rateLimitBurstWindow,
      enableEnvKey: typeof body.enableEnvKey === 'boolean' ? body.enableEnvKey : current.enableEnvKey,
    };

    if (!updated.apiBaseUrl) return res.status(400).json({ error: 'API 地址不能為空' });
    if (updated.rateLimitPerMinute < 1) return res.status(400).json({ error: '速率限制不能小於 1' });

    await setSettings(updated);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}

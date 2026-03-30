import type { NextApiRequest, NextApiResponse } from 'next';
import { getSettings, setSettings } from '../../../lib/kv';
import { isAuthenticated } from '../../../lib/auth';
import { AppSettings } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      const settings = await getSettings();
      // Mask apiKey for display
      const masked = {
        ...settings,
        apiKey: settings.apiKey ? settings.apiKey.slice(0, 4) + '****' + settings.apiKey.slice(-4) : '',
      };
      return res.status(200).json({ settings: masked });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '讀取設定失敗：' + message });
    }
  }

  if (req.method === 'PUT') {
    try {
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
        theme: typeof body.theme === 'string' && (body.theme === 'dark' || body.theme === 'light') ? body.theme : current.theme,
        logo: typeof body.logo === 'string' ? body.logo.trim() : current.logo,
        primaryColor: typeof body.primaryColor === 'string' ? body.primaryColor.trim() : current.primaryColor,
        secondaryColor: typeof body.secondaryColor === 'string' ? body.secondaryColor.trim() : current.secondaryColor,
        rateLimitPerDay: Number(body.rateLimitPerDay) || current.rateLimitPerDay,
        rateLimitPerHour: Number(body.rateLimitPerHour) || current.rateLimitPerHour,
        ipWhitelist: Array.isArray(body.ipWhitelist) ? body.ipWhitelist.map((ip: string) => ip.trim()).filter((ip: string) => ip) : current.ipWhitelist,
        enableIpWhitelist: typeof body.enableIpWhitelist === 'boolean' ? body.enableIpWhitelist : current.enableIpWhitelist,
      };

      if (!updated.apiBaseUrl) return res.status(400).json({ error: 'API 地址不能為空' });
      if (updated.rateLimitPerMinute < 1) return res.status(400).json({ error: '速率限制不能小於 1' });

      await setSettings(updated);
      return res.status(200).json({ ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: '儲存設定失敗：' + message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

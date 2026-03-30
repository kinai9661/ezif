import type { NextApiRequest, NextApiResponse } from 'next';
import { getSettings, getModels } from '../../lib/kv';

const requestStore = new Map<string, {
  minuteCount: number;
  minuteReset: number;
  burstCount: number;
  burstReset: number;
}>();

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return 'unknown';
}

function checkRateLimit(
  clientId: string,
  perMinute: number,
  burstLimit: number,
  burstWindow: number
): { allowed: boolean; retryAfter?: number; message?: string } {
  const now = Date.now();
  const minuteWindow = 60000;

  let record = requestStore.get(clientId);
  if (!record) {
    record = { minuteCount: 0, minuteReset: now + minuteWindow, burstCount: 0, burstReset: now + burstWindow };
    requestStore.set(clientId, record);
  }

  if (now > record.minuteReset) { record.minuteCount = 0; record.minuteReset = now + minuteWindow; }
  if (now > record.burstReset) { record.burstCount = 0; record.burstReset = now + burstWindow; }

  if (record.burstCount >= burstLimit) {
    const retryAfter = Math.ceil((record.burstReset - now) / 1000);
    return { allowed: false, retryAfter, message: `請求過於頻繁，請等待 ${retryAfter} 秒後再試（突發限制：每 ${Math.ceil(burstWindow/1000)} 秒最多 ${burstLimit} 次）` };
  }
  if (record.minuteCount >= perMinute) {
    const retryAfter = Math.ceil((record.minuteReset - now) / 1000);
    return { allowed: false, retryAfter, message: `已達到每分鐘請求上限（${perMinute} 次），請等待 ${retryAfter} 秒後再試` };
  }

  record.minuteCount++;
  record.burstCount++;
  return { allowed: true };
}

function cleanupExpiredRecords() {
  const now = Date.now();
  requestStore.forEach((record, clientId) => {
    if (now > record.minuteReset + 300000) requestStore.delete(clientId);
  });
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 300000);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Load settings and models from KV (with fallback to defaults/env)
  const [settings, models] = await Promise.all([getSettings(), getModels()]);

  const clientId = getClientIP(req);
  const rateLimitResult = checkRateLimit(
    clientId,
    settings.rateLimitPerMinute,
    settings.rateLimitBurst,
    settings.rateLimitBurstWindow
  );

  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', rateLimitResult.retryAfter?.toString() || '60');
    res.setHeader('X-RateLimit-Limit', settings.rateLimitPerMinute.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    return res.status(429).json({ error: rateLimitResult.message, retryAfter: rateLimitResult.retryAfter });
  }

  const { prompt, model, size, n, useEnvKey, aspectRatio } = req.body;

  const serverApiKey = settings.apiKey || process.env.API_KEY;
  const apiKey = (useEnvKey && settings.enableEnvKey && serverApiKey) ? serverApiKey : req.body.apiKey;

  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  if (!apiKey) {
    return res.status(400).json({
      error: serverApiKey
        ? '請設定 useEnvKey: true 來使用伺服器端的 API Key，或輸入你的 API Key'
        : 'Missing API key. Please input your API key.',
    });
  }

  // Determine if model is grok type from KV config, fallback to name check
  const modelConfig = models.find(m => m.value === model);
  const isGrok = modelConfig ? modelConfig.isGrok : (typeof model === 'string' && model.startsWith('grok-'));

  const body: Record<string, unknown> = {
    model: isGrok ? 'grok-imagine-image' : (model || 'gpt-image-1'),
    prompt,
  };

  if (isGrok) {
    body.response_format = 'b64_json';
    if (aspectRatio) body.aspect_ratio = aspectRatio;
  } else {
    if (size) body.size = size;
    if (n) body.n = Number(n);
  }

  try {
    const baseUrl = settings.apiBaseUrl || process.env.API_BASE_URL || 'https://ai.ezif.in';
    const response = await fetch(`${baseUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'API error' });
    }

    const record = requestStore.get(clientId);
    if (record) {
      res.setHeader('X-RateLimit-Limit', settings.rateLimitPerMinute.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, settings.rateLimitPerMinute - record.minuteCount).toString());
    }

    return res.status(200).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

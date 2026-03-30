import type { NextApiRequest, NextApiResponse } from 'next';
import { getSettings, getModels, getProviders } from '../../lib/kv';

const requestStore = new Map<string, {
  minuteCount: number;
  minuteReset: number;
  burstCount: number;
  burstReset: number;
  hourCount: number;
  hourReset: number;
  dayCount: number;
  dayReset: number;
}>();

function isIpInWhitelist(ip: string, whitelist: string[]): boolean {
  if (whitelist.length === 0) return true;
  for (const entry of whitelist) {
    if (entry.includes('/')) {
      const [network, bits] = entry.split('/');
      const mask = (0xffffffff << (32 - parseInt(bits))) >>> 0;
      const ipParts = ip.split('.').map(Number);
      const networkParts = network.split('.').map(Number);
      const ipNum = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
      const networkNum = ((networkParts[0] << 24) | (networkParts[1] << 16) | (networkParts[2] << 8) | networkParts[3]) >>> 0;
      if ((ipNum & mask) === (networkNum & mask)) return true;
    } else if (ip === entry) {
      return true;
    }
  }
  return false;
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return 'unknown';
}

function checkRateLimit(
  clientId: string,
  perMinute: number,
  burstLimit: number,
  burstWindow: number,
  perHour: number,
  perDay: number
): { allowed: boolean; retryAfter?: number; message?: string } {
  const now = Date.now();
  const minuteWindow = 60000;
  const hourWindow = 3600000;
  const dayWindow = 86400000;

  let record = requestStore.get(clientId);
  if (!record) {
    record = { minuteCount: 0, minuteReset: now + minuteWindow, burstCount: 0, burstReset: now + burstWindow, hourCount: 0, hourReset: now + hourWindow, dayCount: 0, dayReset: now + dayWindow };
    requestStore.set(clientId, record);
  }

  if (now > record.minuteReset) { record.minuteCount = 0; record.minuteReset = now + minuteWindow; }
  if (now > record.burstReset) { record.burstCount = 0; record.burstReset = now + burstWindow; }
  if (now > record.hourReset) { record.hourCount = 0; record.hourReset = now + hourWindow; }
  if (now > record.dayReset) { record.dayCount = 0; record.dayReset = now + dayWindow; }

  if (record.burstCount >= burstLimit) {
    const retryAfter = Math.ceil((record.burstReset - now) / 1000);
    return { allowed: false, retryAfter, message: `請求過於頻繁，請等待 ${retryAfter} 秒後再試（突發限制：每 ${Math.ceil(burstWindow/1000)} 秒最多 ${burstLimit} 次）` };
  }
  if (record.minuteCount >= perMinute) {
    const retryAfter = Math.ceil((record.minuteReset - now) / 1000);
    return { allowed: false, retryAfter, message: `已達到每分鐘請求上限（${perMinute} 次），請等待 ${retryAfter} 秒後再試` };
  }
  if (record.hourCount >= perHour) {
    const retryAfter = Math.ceil((record.hourReset - now) / 1000);
    return { allowed: false, retryAfter, message: `已達到每小時請求上限（${perHour} 次），請等待 ${retryAfter} 秒後再試` };
  }
  if (record.dayCount >= perDay) {
    const retryAfter = Math.ceil((record.dayReset - now) / 1000);
    return { allowed: false, retryAfter, message: `已達到每日請求上限（${perDay} 次），請等待 ${retryAfter} 秒後再試` };
  }

  record.minuteCount++;
  record.burstCount++;
  record.hourCount++;
  record.dayCount++;
  return { allowed: true };
}

function cleanupExpiredRecords() {
  const now = Date.now();
  requestStore.forEach((record, clientId) => {
    if (now > record.minuteReset + 300000) requestStore.delete(clientId);
  });
}

function normalizeApiResponse(data: any) {
  if (data.data && Array.isArray(data.data)) {
    return data;
  }
  if (data.url && typeof data.url === 'string') {
    return { data: [{ url: data.url }] };
  }
  if (typeof data === 'string') {
    return { data: [{ url: data }] };
  }
  if (Array.isArray(data)) {
    return { data: data.map(item => typeof item === 'string' ? { url: item } : item) };
  }
  if (data.image_url) {
    return { data: [{ url: data.image_url }] };
  }
  return data;
}

function convertSizeToProvider(size: string, sizeFormat?: string): Record<string, unknown> {
  const sizeMap: Record<string, { width: number; height: number }> = {
    '256x256': { width: 256, height: 256 },
    '512x512': { width: 512, height: 512 },
    '1024x1024': { width: 1024, height: 1024 },
    '1024x1792': { width: 1024, height: 1792 },
    '1792x1024': { width: 1792, height: 1024 },
  };

  const dims = sizeMap[size] || { width: 1024, height: 1024 };

  if (sizeFormat === 'aspect_ratio') {
    const ratio = dims.width / dims.height;
    if (ratio > 1) return { aspect_ratio: '16:9' };
    if (ratio < 1) return { aspect_ratio: '9:16' };
    return { aspect_ratio: '1:1' };
  }
  if (sizeFormat === 'resolution') {
    if (dims.width >= 1024) return { resolution: '2k' };
    if (dims.width >= 512) return { resolution: '1k' };
    return { resolution: '512' };
  }
  return { size };
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

  // Load settings, models, and providers from KV
  const [settings, models, providers] = await Promise.all([getSettings(), getModels(), getProviders()]);

  const clientIp = getClientIP(req);
  
  // Check IP whitelist if enabled
  if (settings.enableIpWhitelist && !isIpInWhitelist(clientIp, settings.ipWhitelist)) {
    return res.status(403).json({ error: 'IP 地址不在白名單中' });
  }

  const rateLimitResult = checkRateLimit(
    clientIp,
    settings.rateLimitPerMinute,
    settings.rateLimitBurst,
    settings.rateLimitBurstWindow,
    settings.rateLimitPerHour,
    settings.rateLimitPerDay
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

  // Resolve provider-specific API credentials
  let resolvedBaseUrl = settings.apiBaseUrl || process.env.API_BASE_URL || 'https://ai.ezif.in';
  let resolvedApiKey = apiKey;

  if (modelConfig?.providerId) {
    const provider = providers.find(p => p.id === modelConfig.providerId);
    if (provider && provider.enabled) {
      resolvedBaseUrl = provider.baseUrl;
      if (provider.apiKey) {
        resolvedApiKey = provider.apiKey;
      }
    }
  }

  const body: Record<string, unknown> = {
    model: isGrok ? 'grok-imagine-image' : (model || 'gpt-image-1'),
    prompt,
  };

  if (isGrok) {
    body.response_format = 'b64_json';
    if (aspectRatio) body.aspect_ratio = aspectRatio;
  } else {
    if (size) {
      const provider = modelConfig?.providerId ? providers.find(p => p.id === modelConfig.providerId) : null;
      const sizeParams = convertSizeToProvider(size, provider?.sizeFormat);
      Object.assign(body, sizeParams);
    }
    if (n) body.n = Number(n);
  }

  try {
     const response = await fetch(`${resolvedBaseUrl}/v1/images/generations`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${resolvedApiKey}`,
       },
       body: JSON.stringify(body),
     });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'API error' });
    }

    const record = requestStore.get(clientIp);
    if (record) {
      res.setHeader('X-RateLimit-Limit', settings.rateLimitPerMinute.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, settings.rateLimitPerMinute - record.minuteCount).toString());
    }

    return res.status(200).json(normalizeApiResponse(data));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

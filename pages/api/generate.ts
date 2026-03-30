import type { NextApiRequest, NextApiResponse } from 'next';

const BASE_URL = process.env.API_BASE_URL || 'https://ai.ezif.in';
const DEFAULT_API_KEY = process.env.API_KEY;

// 速率限制配置
const RATE_LIMITS = {
  perMinute: 20,      // 每分鐘最多 20 次請求
  burstLimit: 5,      // 突發限制：每 10 秒最多 5 次請求
  burstWindow: 10000, // 突發窗口：10 秒（毫秒）
};

// 使用記憶體儲存請求記錄（注意：在 Vercel 無狀態環境中，這會在每次部署重置）
// 對於生產環境，建議使用 Redis 或其他持久化儲存
const requestStore = new Map<string, { minuteCount: number; minuteReset: number; burstCount: number; burstReset: number }>();

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

function checkRateLimit(clientId: string): { allowed: boolean; retryAfter?: number; message?: string } {
  const now = Date.now();
  const minuteWindow = 60000; // 1 分鐘
  
  let record = requestStore.get(clientId);
  
  if (!record) {
    record = {
      minuteCount: 0,
      minuteReset: now + minuteWindow,
      burstCount: 0,
      burstReset: now + RATE_LIMITS.burstWindow,
    };
    requestStore.set(clientId, record);
  }
  
  // 檢查並重置過期的窗口
  if (now > record.minuteReset) {
    record.minuteCount = 0;
    record.minuteReset = now + minuteWindow;
  }
  if (now > record.burstReset) {
    record.burstCount = 0;
    record.burstReset = now + RATE_LIMITS.burstWindow;
  }
  
  // 檢查突發限制（每 10 秒 5 次）
  if (record.burstCount >= RATE_LIMITS.burstLimit) {
    const retryAfter = Math.ceil((record.burstReset - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      message: `請求過於頻繁，請等待 ${retryAfter} 秒後再試（突發限制：每 10 秒最多 ${RATE_LIMITS.burstLimit} 次請求）`,
    };
  }
  
  // 檢查每分鐘限制
  if (record.minuteCount >= RATE_LIMITS.perMinute) {
    const retryAfter = Math.ceil((record.minuteReset - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      message: `已達到每分鐘請求上限（${RATE_LIMITS.perMinute} 次），請等待 ${retryAfter} 秒後再試`,
    };
  }
  
  // 更新計數
  record.minuteCount++;
  record.burstCount++;
  
  return { allowed: true };
}

// 清理過期記錄的函數（每 5 分鐘執行一次）
function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [clientId, record] of requestStore.entries()) {
    if (now > record.minuteReset + 300000) { // 5 分鐘後清理
      requestStore.delete(clientId);
    }
  }
}

// 定期清理
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 300000);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 設定 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 速率限制檢查
  const clientId = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientId);
  
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', rateLimitResult.retryAfter?.toString() || '60');
    res.setHeader('X-RateLimit-Limit', RATE_LIMITS.perMinute.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    return res.status(429).json({ 
      error: rateLimitResult.message,
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  const { prompt, model, size, n, useEnvKey } = req.body;
  
  // 優先使用環境變數的 API Key（如果設定了），否則使用使用者輸入的 Key
  const apiKey = useEnvKey && DEFAULT_API_KEY ? DEFAULT_API_KEY : req.body.apiKey;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  if (!apiKey) {
    return res.status(400).json({ 
      error: DEFAULT_API_KEY 
        ? '請設定 useEnvKey: true 來使用伺服器端的 API Key，或輸入你的 API Key' 
        : 'Missing API key. Please input your API key or set API_KEY in environment variables.'
    });
  }

  const body: Record<string, unknown> = {
    model: model || 'gpt-image-1',
    prompt,
  };

  if (size) body.size = size;
  if (n) body.n = Number(n);

  try {
    const response = await fetch(`${BASE_URL}/v1/images/generations`, {
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

    // 添加速率限制標頭到成功回應
    const record = requestStore.get(clientId);
    if (record) {
      res.setHeader('X-RateLimit-Limit', RATE_LIMITS.perMinute.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMITS.perMinute - record.minuteCount).toString());
    }

    return res.status(200).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

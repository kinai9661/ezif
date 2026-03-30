import type { NextApiRequest, NextApiResponse } from 'next';

const BASE_URL = process.env.API_BASE_URL || 'https://ai.ezif.in';
const DEFAULT_API_KEY = process.env.API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    return res.status(200).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

import { ModelConfig, AppSettings, DEFAULT_MODELS, DEFAULT_SETTINGS } from './types';

// Direct Upstash Redis REST API client (bypasses @vercel/kv path parsing issues)
async function kvGet(key: string): Promise<unknown> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN');

  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`KV GET failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.result ?? null;
}

async function kvSet(key: string, value: string): Promise<void> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN');

  const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([value]),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KV SET failed: ${res.status} ${text}`);
  }
}

export async function getModels(): Promise<ModelConfig[]> {
  try {
    const raw = await kvGet('models');
    if (raw) {
      const models: ModelConfig[] = typeof raw === 'string' ? JSON.parse(raw) : raw as ModelConfig[];
      if (Array.isArray(models) && models.length > 0) {
        return models.sort((a, b) => a.order - b.order);
      }
    }
  } catch {}
  return DEFAULT_MODELS;
}

export async function setModels(models: ModelConfig[]): Promise<void> {
  await kvSet('models', JSON.stringify(models));
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await kvGet('settings');
    if (raw) {
      const settings: AppSettings = typeof raw === 'string' ? JSON.parse(raw) : raw as AppSettings;
      if (settings && settings.apiBaseUrl) return settings;
    }
  } catch {}
  return {
    ...DEFAULT_SETTINGS,
    apiBaseUrl: process.env.API_BASE_URL || DEFAULT_SETTINGS.apiBaseUrl,
    apiKey: process.env.API_KEY || DEFAULT_SETTINGS.apiKey,
  };
}

export async function setSettings(settings: AppSettings): Promise<void> {
  await kvSet('settings', JSON.stringify(settings));
}

export async function getAdminPasswordHash(): Promise<string | null> {
  try {
    const raw = await kvGet('admin_password_hash');
    return typeof raw === 'string' ? raw : null;
  } catch {
    return null;
  }
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  await kvSet('admin_password_hash', hash);
}

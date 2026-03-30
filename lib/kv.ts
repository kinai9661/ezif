import { ModelConfig, AppSettings, DEFAULT_MODELS, DEFAULT_SETTINGS } from './types';

// Direct Upstash Redis REST API client using pipeline format
async function upstash(command: unknown[]): Promise<unknown> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`KV error: ${JSON.stringify(data)}`);
  }
  return data.result ?? null;
}

export async function getModels(): Promise<ModelConfig[]> {
  try {
    const raw = await upstash(['GET', 'models']);
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
  await upstash(['SET', 'models', JSON.stringify(models)]);
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await upstash(['GET', 'settings']);
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
  await upstash(['SET', 'settings', JSON.stringify(settings)]);
}

export async function getAdminPasswordHash(): Promise<string | null> {
  try {
    const raw = await upstash(['GET', 'admin_password_hash']);
    return typeof raw === 'string' ? raw : null;
  } catch {
    return null;
  }
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  await upstash(['SET', 'admin_password_hash', hash]);
}

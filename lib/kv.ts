import { kv } from '@vercel/kv';
import { ModelConfig, AppSettings, DEFAULT_MODELS, DEFAULT_SETTINGS } from './types';

export async function getModels(): Promise<ModelConfig[]> {
  try {
    const models = await kv.get<ModelConfig[]>('models');
    if (models && models.length > 0) return models.sort((a, b) => a.order - b.order);
  } catch {}
  return DEFAULT_MODELS;
}

export async function setModels(models: ModelConfig[]): Promise<void> {
  await kv.set('models', models);
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const settings = await kv.get<AppSettings>('settings');
    if (settings) return settings;
  } catch {}
  return {
    ...DEFAULT_SETTINGS,
    apiBaseUrl: process.env.API_BASE_URL || DEFAULT_SETTINGS.apiBaseUrl,
    apiKey: process.env.API_KEY || DEFAULT_SETTINGS.apiKey,
  };
}

export async function setSettings(settings: AppSettings): Promise<void> {
  await kv.set('settings', settings);
}

export async function getAdminPasswordHash(): Promise<string | null> {
  try {
    return await kv.get<string>('admin_password_hash');
  } catch {
    return null;
  }
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  await kv.set('admin_password_hash', hash);
}

import { neon } from '@neondatabase/serverless';
import { ModelConfig, AppSettings, Provider, AdminUser, AuditLog, DEFAULT_MODELS, DEFAULT_SETTINGS, DEFAULT_PROVIDERS } from './types';

function getSql() {
  const url = process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.KV_REST_API_URL || '';
  if (!url || !url.startsWith('postgres')) {
    throw new Error('Missing Neon/Postgres database URL. Please set POSTGRES_URL in environment variables.');
  }
  return neon(url);
}

async function ensureTable(): Promise<void> {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;
}

async function dbGet(key: string): Promise<string | null> {
  const sql = getSql();
  await ensureTable();
  const rows = await sql`SELECT value FROM kv_store WHERE key = ${key}`;
  if (!rows || rows.length === 0) return null;
  return rows[0].value as string;
}

async function dbSet(key: string, value: string): Promise<void> {
  const sql = getSql();
  await ensureTable();
  await sql`INSERT INTO kv_store (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

export async function getModels(): Promise<ModelConfig[]> {
  try {
    const raw = await dbGet('models');
    if (raw) {
      const models: ModelConfig[] = JSON.parse(raw);
      if (Array.isArray(models) && models.length > 0) {
        return models.sort((a, b) => a.order - b.order);
      }
    }
  } catch {}
  return DEFAULT_MODELS;
}

export async function setModels(models: ModelConfig[]): Promise<void> {
  await dbSet('models', JSON.stringify(models));
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await dbGet('settings');
    if (raw) {
      const settings: AppSettings = JSON.parse(raw);
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
  await dbSet('settings', JSON.stringify(settings));
}

export async function getAdminPasswordHash(): Promise<string | null> {
  try {
    return await dbGet('admin_password_hash');
  } catch {
    return null;
  }
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  await dbSet('admin_password_hash', hash);
}

export async function getProviders(): Promise<Provider[]> {
  try {
    const raw = await dbGet('providers');
    if (raw) {
      const providers: Provider[] = JSON.parse(raw);
      if (Array.isArray(providers)) {
        return providers.sort((a, b) => a.order - b.order);
      }
    }
  } catch {}
  return DEFAULT_PROVIDERS;
}

export async function setProviders(providers: Provider[]): Promise<void> {
  await dbSet('providers', JSON.stringify(providers));
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const raw = await dbGet('admin_users');
    if (raw) {
      const users: AdminUser[] = JSON.parse(raw);
      if (Array.isArray(users)) return users;
    }
  } catch {}
  return [];
}

export async function setAdminUsers(users: AdminUser[]): Promise<void> {
  await dbSet('admin_users', JSON.stringify(users));
}

export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  try {
    const raw = await dbGet('audit_logs');
    if (raw) {
      const logs: AuditLog[] = JSON.parse(raw);
      if (Array.isArray(logs)) return logs.slice(-limit);
    }
  } catch {}
  return [];
}

export async function addAuditLog(log: AuditLog): Promise<void> {
  const logs = await getAuditLogs(1000);
  logs.push(log);
  await dbSet('audit_logs', JSON.stringify(logs.slice(-1000)));
}

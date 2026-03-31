import { neon } from '@neondatabase/serverless';
import { ModelConfig, AppSettings, Provider, AdminUser, AuditLog, StyleConfig, ImageRecord, BatchJob, ShareLink, DEFAULT_MODELS, DEFAULT_SETTINGS, DEFAULT_PROVIDERS, DEFAULT_STYLES } from './types';

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

export async function getStyles(): Promise<StyleConfig[]> {
  try {
    const raw = await dbGet('styles');
    if (raw) {
      const styles: StyleConfig[] = JSON.parse(raw);
      if (Array.isArray(styles) && styles.length > 0) {
        return styles.sort((a, b) => a.order - b.order);
      }
    }
  } catch {}
  return DEFAULT_STYLES;
}

export async function setStyles(styles: StyleConfig[]): Promise<void> {
  await dbSet('styles', JSON.stringify(styles));
}

export async function getImageRecords(limit: number = 100): Promise<ImageRecord[]> {
  try {
    const data = await dbGet('image_records');
    if (!data) return [];
    return JSON.parse(data).slice(-limit);
  } catch {}
  return [];
}

export async function addImageRecord(record: ImageRecord): Promise<void> {
  const records = await getImageRecords(1000);
  records.push(record);
  await dbSet('image_records', JSON.stringify(records));
}

export async function updateImageRecord(id: string, updates: Partial<ImageRecord>): Promise<void> {
  const records = await getImageRecords(1000);
  const idx = records.findIndex(r => r.id === id);
  if (idx >= 0) {
    records[idx] = { ...records[idx], ...updates };
    await dbSet('image_records', JSON.stringify(records));
  }
}

export async function deleteImageRecord(id: string): Promise<void> {
  const records = await getImageRecords(1000);
  await dbSet('image_records', JSON.stringify(records.filter(r => r.id !== id)));
}

export async function getBatchJobs(limit: number = 50): Promise<BatchJob[]> {
  try {
    const data = await dbGet('batch_jobs');
    if (!data) return [];
    return JSON.parse(data).slice(-limit);
  } catch {}
  return [];
}

export async function addBatchJob(job: BatchJob): Promise<void> {
  const jobs = await getBatchJobs(500);
  jobs.push(job);
  await dbSet('batch_jobs', JSON.stringify(jobs));
}

export async function updateBatchJob(id: string, updates: Partial<BatchJob>): Promise<void> {
  const jobs = await getBatchJobs(500);
  const idx = jobs.findIndex(j => j.id === id);
  if (idx >= 0) {
    jobs[idx] = { ...jobs[idx], ...updates };
    await dbSet('batch_jobs', JSON.stringify(jobs));
  }
}

export async function getShareLinks(): Promise<ShareLink[]> {
  try {
    const data = await dbGet('share_links');
    if (!data) return [];
    return JSON.parse(data);
  } catch {}
  return [];
}

export async function addShareLink(link: ShareLink): Promise<void> {
  const links = await getShareLinks();
  links.push(link);
  await dbSet('share_links', JSON.stringify(links));
}

export async function getShareLink(token: string): Promise<ShareLink | null> {
  const links = await getShareLinks();
  return links.find(l => l.token === token) || null;
}

export async function updateShareLink(token: string, updates: Partial<ShareLink>): Promise<void> {
  const links = await getShareLinks();
  const idx = links.findIndex(l => l.token === token);
  if (idx >= 0) {
    links[idx] = { ...links[idx], ...updates };
    await dbSet('share_links', JSON.stringify(links));
  }
}

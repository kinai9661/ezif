import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Provider, SizeOption } from '../../lib/types';
import { useTranslation } from '../../lib/useTranslation';

export default function AdminProviders() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [form, setForm] = useState({ name: '', baseUrl: '', apiKey: '', enabled: true, sizeFormat: 'size' as const, supportedSizes: [] as SizeOption[] });

  const TEMPLATES = {
    supabase: { name: 'Supabase', baseUrl: 'https://gjosebfngzowbcrwzxnw.supabase.co/functions/v1', apiKey: '', sizeFormat: 'aspect_ratio' as const, supportedSizes: [{ label: '1:1', value: '1:1' }, { label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' }] },
    openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com', apiKey: '', sizeFormat: 'size' as const, supportedSizes: [{ label: '256x256', value: '256x256' }, { label: '512x512', value: '512x512' }, { label: '1024x1024', value: '1024x1024' }] },
    frenix: { name: 'Frenix', baseUrl: 'https://api.frenix.sh/v1', apiKey: '', sizeFormat: 'size' as const, supportedSizes: [{ label: '256x256', value: '256x256' }, { label: '512x512', value: '512x512' }, { label: '1024x1024', value: '1024x1024' }, { label: '1024x1792', value: '1024x1792' }, { label: '1792x1024', value: '1792x1024' }] },
    custom: { name: '', baseUrl: '', apiKey: '', sizeFormat: 'size' as const, supportedSizes: [] },
  };

  const applyTemplate = (templateKey: string) => {
    const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
    setForm({ ...template, enabled: true } as any);
    setSelectedTemplate(templateKey);
  };

  useEffect(() => {
    fetch('/api/admin/providers')
      .then(r => { if (r.status === 401) { router.push('/admin/login'); } return r.json(); })
      .then(data => { if (data.providers) setProviders(data.providers); })
      .catch(() => setError(t('providers.loadFailed')))
      .finally(() => setLoading(false));
  }, [router]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('providers.addFailed')); return; }
      setProviders(p => [...p, data.provider]);
      setForm({ name: '', baseUrl: '', apiKey: '', enabled: true, sizeFormat: 'size', supportedSizes: [] });
      setShowForm(false);
      setSuccess(t('providers.added'));
    } catch { setError(t('providers.addFailed')); }
    finally { setSaving(false); }
  };

  const handleToggle = async (p: Provider) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, enabled: !p.enabled }),
      });
      if (!res.ok) { setError(t('providers.updateFailed')); return; }
      setProviders(ps => ps.map(x => x.id === p.id ? { ...x, enabled: !x.enabled } : x));
    } catch { setError(t('providers.updateFailed')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('providers.confirmDelete'))) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { setError(t('providers.deleteFailed')); return; }
      setProviders(ps => ps.filter(p => p.id !== id));
      setSuccess(t('providers.deleted'));
    } catch { setError(t('providers.deleteFailed')); }
    finally { setSaving(false); }
  };

  const handleChangeLanguage = (newLocale: string) => {
    router.push(router.asPath, router.asPath, { locale: newLocale });
  };

  return (
    <div style={s.bg}>
      <nav style={s.nav}>
        <span style={s.logo}>⚙️ {t('admin.title')}</span>
        <div style={s.navLinks}>
          <Link href="/admin" style={s.navLink}>{t('common.dashboard')}</Link>
          <Link href="/admin/models" style={s.navLink}>{t('common.models')}</Link>
          <Link href="/admin/providers" style={{...s.navLink, color: '#818cf8'}}>{t('common.providers')}</Link>
          <Link href="/admin/settings" style={s.navLink}>{t('common.settings')}</Link>
          <Link href="/" style={s.navLink}>{t('common.dashboard')}</Link>
          <select value={locale} onChange={e => handleChangeLanguage(e.target.value)} style={s.langSelect}>
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
          </select>
          <button onClick={() => { fetch('/api/admin/auth', { method: 'DELETE' }); router.push('/admin/login'); }} style={s.logoutBtn}>{t('common.logout')}</button>
        </div>
      </nav>
      <div style={s.content}>
        <h1 style={s.h1}>{t('providers.title')}</h1>
        {loading ? <p style={s.muted}>{t('common.loading')}</p> : (
          <>
            {error && <p style={s.error}>{error}</p>}
            {success && <p style={s.success}>{success}</p>}
            
            <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
              {showForm ? t('common.cancel') : t('providers.addProvider')}
            </button>

            {showForm && (
              <form onSubmit={handleAdd} style={s.form}>
                <div style={s.templateRow}>
                  <label style={s.label}>快速模板</label>
                  <div style={s.templateBtns}>
                    <button type="button" onClick={() => applyTemplate('supabase')} style={{...s.templateBtn, background: selectedTemplate === 'supabase' ? '#818cf8' : '#334155'}}>Supabase</button>
                    <button type="button" onClick={() => applyTemplate('openai')} style={{...s.templateBtn, background: selectedTemplate === 'openai' ? '#818cf8' : '#334155'}}>OpenAI</button>
                    <button type="button" onClick={() => applyTemplate('frenix')} style={{...s.templateBtn, background: selectedTemplate === 'frenix' ? '#818cf8' : '#334155'}}>Frenix</button>
                    <button type="button" onClick={() => applyTemplate('custom')} style={{...s.templateBtn, background: selectedTemplate === 'custom' ? '#818cf8' : '#334155'}}>自訂</button>
                  </div>
                </div>
                <label style={s.label}>{t('providers.name')}</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  style={s.input}
                  placeholder="例：OpenAI"
                  required
                />
                <label style={s.label}>{t('providers.baseUrl')}</label>
                <input
                  value={form.baseUrl}
                  onChange={e => setForm(f => ({...f, baseUrl: e.target.value}))}
                  style={s.input}
                  placeholder="https://api.openai.com"
                  required
                />
                <label style={s.label}>{t('providers.apiKey')}</label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={e => setForm(f => ({...f, apiKey: e.target.value}))}
                  style={s.input}
                  placeholder="sk-..."
                />
                <label style={s.label}>尺寸格式</label>
                <select value={form.sizeFormat} onChange={e => setForm(f => ({...f, sizeFormat: e.target.value as any}))} style={s.input}>
                  <option value="size">size (256x256)</option>
                  <option value="aspect_ratio">aspect_ratio (16:9)</option>
                  <option value="resolution">resolution (2k)</option>
                  <option value="custom">自訂</option>
                </select>
                <div style={s.checkRow}>
                  <label style={s.checkLabel}>
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={e => setForm(f => ({...f, enabled: e.target.checked}))}
                    />
                    {' '}{t('providers.enabled')}
                  </label>
                </div>
                <button type="submit" disabled={saving} style={s.saveBtn}>
                  {saving ? `${t('common.add')}中...` : t('providers.addProvider')}
                </button>
              </form>
            )}

            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>{t('providers.name')}</th>
                    <th style={s.th}>{t('providers.baseUrl')}</th>
                    <th style={s.th}>尺寸格式</th>
                    <th style={s.th}>{t('providers.status')}</th>
                    <th style={s.th}>{t('common.edit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p.id} style={s.tr}>
                      <td style={s.td}>{p.name}</td>
                      <td style={{...s.td, fontSize: 12, color: '#94a3b8'}}>{p.baseUrl}</td>
                      <td style={s.td}>{p.sizeFormat || 'size'}</td>
                      <td style={s.td}>
                        <button
                          onClick={() => handleToggle(p)}
                          style={{...s.toggleBtn, background: p.enabled ? '#10b981' : '#6b7280'}}
                        >
                          {p.enabled ? t('providers.enabled') : t('providers.disabled')}
                        </button>
                      </td>
                      <td style={s.td}>
                        <button onClick={() => handleDelete(p.id)} style={s.deleteBtn}>{t('common.delete')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {providers.length === 0 && <p style={s.muted}>{t('providers.noProviders')}</p>}
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  bg: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56, background: '#1e293b', borderBottom: '1px solid #334155' },
  logo: { fontWeight: 700, fontSize: 18, color: '#f1f5f9' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 16 },
  navLink: { color: '#94a3b8', textDecoration: 'none', fontSize: 14 },
  langSelect: { padding: '4px 8px', borderRadius: 6, border: '1px solid #475569', background: '#0f172a', color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
  logoutBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13 },
  content: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  h1: { fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginBottom: 32 },
  muted: { color: '#64748b' },
  error: { color: '#f87171', fontSize: 13, marginBottom: 16 },
  success: { color: '#4ade80', fontSize: 13, marginBottom: 16 },
  addBtn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, marginBottom: 20 },
  form: { background: '#1e293b', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #334155' },
  label: { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 4, marginTop: 14 },
  input: { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box', marginBottom: 12 },
  checkRow: { marginTop: 14, marginBottom: 16 },
  checkLabel: { color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  saveBtn: { padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 15 },
  tableWrap: { overflowX: 'auto', marginTop: 20 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left', padding: '12px 16px', background: '#1e293b', color: '#94a3b8', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #334155' },
  tr: { borderBottom: '1px solid #334155' },
  td: { padding: '12px 16px', color: '#f1f5f9', fontSize: 14 },
  toggleBtn: { padding: '4px 12px', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  deleteBtn: { padding: '4px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  templateRow: { marginBottom: 16 },
  templateBtns: { display: 'flex', gap: 8, marginTop: 8 },
  templateBtn: { padding: '8px 16px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'background 0.2s' },
};

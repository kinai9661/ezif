import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ModelConfig, Provider } from '../../lib/types';
import { useTranslation } from '../../lib/useTranslation';

const emptyForm = { value: '', label: '', isGrok: false, enabled: true, providerId: '' };

export default function AdminModels() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [modelsRes, providersRes] = await Promise.all([
        fetch('/api/admin/models'),
        fetch('/api/admin/providers'),
      ]);
      if (modelsRes.status === 401 || providersRes.status === 401) { router.push('/admin/login'); return; }
      const modelsData = await modelsRes.json();
      const providersData = await providersRes.json();
      setModels(modelsData.models || []);
      setProviders(providersData.providers || []);
    } catch { setError(t('models.loadFailed')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); setError(''); setSuccess(''); };
  const openEdit = (m: ModelConfig) => { setForm({ value: m.value, label: m.label, isGrok: m.isGrok, enabled: m.enabled, providerId: m.providerId || '' }); setEditId(m.id); setShowForm(true); setError(''); setSuccess(''); };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async () => {
    if (!form.value.trim() || !form.label.trim()) { setError(t('models.fillRequired')); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      if (editId) {
        // Update via PUT with full models list
        const updated = models.map(m => m.id === editId ? { ...m, ...form } : m);
        const res = await fetch('/api/admin/models', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ models: updated }) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || t('models.saveFailed')); return; }
        setModels(data.models);
      } else {
        const res = await fetch('/api/admin/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || t('models.addFailed')); return; }
        setModels(prev => [...prev, data.model]);
      }
      setSuccess(editId ? t('models.updated') : t('models.added'));
      closeForm();
    } catch { setError(t('models.saveFailed')); }
    finally { setSaving(false); }
  };

  const handleToggle = async (m: ModelConfig) => {
    const updated = models.map(x => x.id === m.id ? { ...x, enabled: !x.enabled } : x);
    const res = await fetch('/api/admin/models', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ models: updated }) });
    const data = await res.json();
    if (res.ok) setModels(data.models);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('models.confirmDelete'))) return;
    const res = await fetch(`/api/admin/models?id=${id}`, { method: 'DELETE' });
    if (res.ok) setModels(prev => prev.filter(m => m.id !== id));
  };

  const handleMoveUp = async (idx: number) => {
    if (idx === 0) return;
    const arr = [...models];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    const res = await fetch('/api/admin/models', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ models: arr }) });
    const data = await res.json();
    if (res.ok) setModels(data.models);
  };

  const handleMoveDown = async (idx: number) => {
    if (idx === models.length - 1) return;
    const arr = [...models];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    const res = await fetch('/api/admin/models', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ models: arr }) });
    const data = await res.json();
    if (res.ok) setModels(data.models);
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
          <Link href="/admin/models" style={{...s.navLink, color: '#818cf8'}}>{t('common.models')}</Link>
          <Link href="/admin/providers" style={s.navLink}>{t('common.providers')}</Link>
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
        <div style={s.header}>
          <h1 style={s.h1}>{t('models.title')}</h1>
          <button onClick={openAdd} style={s.addBtn}>{t('models.addModel')}</button>
        </div>
        {error && <p style={s.error}>{error}</p>}
        {success && <p style={s.success}>{success}</p>}
        {loading ? <p style={s.muted}>{t('common.loading')}</p> : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{t('models.sort')}</th>
                  <th style={s.th}>{t('models.displayName')}</th>
                  <th style={s.th}>{t('models.apiValue')}</th>
                  <th style={s.th}>{t('models.provider')}</th>
                  <th style={s.th}>Grok</th>
                  <th style={s.th}>{t('models.status')}</th>
                  <th style={s.th}>{t('models.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, idx) => {
                  const providerName = m.providerId ? providers.find(p => p.id === m.providerId)?.name : null;
                  return (
                  <tr key={m.id} style={s.tr}>
                    <td style={s.td}>
                      <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} style={s.sortBtn}>▲</button>
                      <button onClick={() => handleMoveDown(idx)} disabled={idx === models.length - 1} style={s.sortBtn}>▼</button>
                    </td>
                    <td style={s.td}>{m.label}</td>
                    <td style={{...s.td, fontFamily: 'monospace', fontSize: 12, color: '#94a3b8'}}>{m.value}</td>
                    <td style={{...s.td, fontSize: 12, color: '#94a3b8'}}>{providerName || t('models.globalSettings')}</td>
                    <td style={s.td}>{m.isGrok ? '✅' : '—'}</td>
                    <td style={s.td}>
                      <button onClick={() => handleToggle(m)} style={m.enabled ? s.enabledBadge : s.disabledBadge}>
                        {m.enabled ? t('providers.enabled') : t('providers.disabled')}
                      </button>
                    </td>
                    <td style={s.td}>
                      <button onClick={() => openEdit(m)} style={s.editBtn}>{t('common.edit')}</button>
                      <button onClick={() => handleDelete(m.id)} style={s.deleteBtn}>{t('common.delete')}</button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>{editId ? t('models.editModel') : t('models.newModel')}</h2>
            <label style={s.label}>{t('models.displayName')}</label>
            <input value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} style={s.input} placeholder="例如：GPT Image 1" />
            <label style={s.label}>{t('models.apiValue')}</label>
            <input value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} style={s.input} placeholder="例如：gpt-image-1" disabled={!!editId} />
            <label style={s.label}>{t('models.provider')}</label>
            <select value={form.providerId} onChange={e => setForm(f => ({...f, providerId: e.target.value}))} style={s.select}>
              <option value="">{t('models.globalSettings')}</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.baseUrl}</option>
              ))}
            </select>
            <div style={s.checkRow}>
              <label style={s.checkLabel}>
                <input type="checkbox" checked={form.isGrok} onChange={e => setForm(f => ({...f, isGrok: e.target.checked}))} />
                {' '}{t('models.grokDesc')}
              </label>
            </div>
            <div style={s.checkRow}>
              <label style={s.checkLabel}>
                <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({...f, enabled: e.target.checked}))} />
                {' '}{t('models.enabledDesc')}
              </label>
            </div>
            {error && <p style={s.error}>{error}</p>}
            <div style={s.modalBtns}>
              <button onClick={closeForm} style={s.cancelBtn}>{t('common.cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={s.saveBtn}>{saving ? `${t('common.save')}中...` : t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
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
  content: { maxWidth: 960, margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  h1: { fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  addBtn: { padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  muted: { color: '#64748b' },
  error: { color: '#f87171', fontSize: 13, marginBottom: 8 },
  success: { color: '#4ade80', fontSize: 13, marginBottom: 8 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: 10, overflow: 'hidden' },
  th: { padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 13, borderBottom: '1px solid #334155', fontWeight: 600 },
  tr: { borderBottom: '1px solid #1e293b' },
  td: { padding: '12px 16px', fontSize: 14, color: '#f1f5f9', verticalAlign: 'middle' },
  sortBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px 4px', fontSize: 12 },
  enabledBadge: { background: '#065f46', color: '#4ade80', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 12, cursor: 'pointer' },
  disabledBadge: { background: '#374151', color: '#9ca3af', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 12, cursor: 'pointer' },
  editBtn: { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13, marginRight: 6 },
  deleteBtn: { background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1e293b', borderRadius: 12, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  modalTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 20 },
  label: { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 4, marginTop: 12 },
  input: { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' },
  checkRow: { marginTop: 12 },
  checkLabel: { color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  modalBtns: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  cancelBtn: { padding: '8px 18px', background: 'none', border: '1px solid #475569', color: '#94a3b8', borderRadius: 7, cursor: 'pointer' },
  saveBtn: { padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 },
};

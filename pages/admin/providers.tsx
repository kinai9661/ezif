import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Provider } from '../../lib/types';

export default function AdminProviders() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', baseUrl: '', apiKey: '', enabled: true });

  useEffect(() => {
    fetch('/api/admin/providers')
      .then(r => { if (r.status === 401) { router.push('/admin/login'); } return r.json(); })
      .then(data => { if (data.providers) setProviders(data.providers); })
      .catch(() => setError('載入供應商失敗'))
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
      if (!res.ok) { setError(data.error || '新增失敗'); return; }
      setProviders(p => [...p, data.provider]);
      setForm({ name: '', baseUrl: '', apiKey: '', enabled: true });
      setShowForm(false);
      setSuccess('供應商已新增');
    } catch { setError('新增失敗'); }
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
      if (!res.ok) { setError('更新失敗'); return; }
      setProviders(ps => ps.map(x => x.id === p.id ? { ...x, enabled: !x.enabled } : x));
    } catch { setError('更新失敗'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此供應商嗎？')) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { setError('刪除失敗'); return; }
      setProviders(ps => ps.filter(p => p.id !== id));
      setSuccess('供應商已刪除');
    } catch { setError('刪除失敗'); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  return (
    <div style={s.bg}>
      <nav style={s.nav}>
        <span style={s.logo}>⚙️ 後台管理</span>
        <div style={s.navLinks}>
          <Link href="/admin" style={s.navLink}>儀表板</Link>
          <Link href="/admin/models" style={s.navLink}>模型管理</Link>
          <Link href="/admin/providers" style={{...s.navLink, color: '#818cf8'}}>供應商</Link>
          <Link href="/admin/settings" style={s.navLink}>設定</Link>
          <Link href="/" style={s.navLink}>前台</Link>
          <button onClick={handleLogout} style={s.logoutBtn}>登出</button>
        </div>
      </nav>
      <div style={s.content}>
        <h1 style={s.h1}>API 供應商管理</h1>
        {loading ? <p style={s.muted}>載入中...</p> : (
          <>
            {error && <p style={s.error}>{error}</p>}
            {success && <p style={s.success}>{success}</p>}
            
            <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
              {showForm ? '取消' : '+ 新增供應商'}
            </button>

            {showForm && (
              <form onSubmit={handleAdd} style={s.form}>
                <label style={s.label}>供應商名稱</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  style={s.input}
                  placeholder="例：OpenAI"
                  required
                />
                <label style={s.label}>API 基礎地址</label>
                <input
                  value={form.baseUrl}
                  onChange={e => setForm(f => ({...f, baseUrl: e.target.value}))}
                  style={s.input}
                  placeholder="https://api.openai.com"
                  required
                />
                <label style={s.label}>API Key</label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={e => setForm(f => ({...f, apiKey: e.target.value}))}
                  style={s.input}
                  placeholder="sk-..."
                />
                <div style={s.checkRow}>
                  <label style={s.checkLabel}>
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={e => setForm(f => ({...f, enabled: e.target.checked}))}
                    />
                    {' '}啟用此供應商
                  </label>
                </div>
                <button type="submit" disabled={saving} style={s.saveBtn}>
                  {saving ? '新增中...' : '新增供應商'}
                </button>
              </form>
            )}

            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>名稱</th>
                    <th style={s.th}>API 地址</th>
                    <th style={s.th}>狀態</th>
                    <th style={s.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p.id} style={s.tr}>
                      <td style={s.td}>{p.name}</td>
                      <td style={{...s.td, fontSize: 12, color: '#94a3b8'}}>{p.baseUrl}</td>
                      <td style={s.td}>
                        <button
                          onClick={() => handleToggle(p)}
                          style={{...s.toggleBtn, background: p.enabled ? '#10b981' : '#6b7280'}}
                        >
                          {p.enabled ? '已啟用' : '已停用'}
                        </button>
                      </td>
                      <td style={s.td}>
                        <button onClick={() => handleDelete(p.id)} style={s.deleteBtn}>刪除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {providers.length === 0 && <p style={s.muted}>尚無供應商，請新增一個</p>}
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
};

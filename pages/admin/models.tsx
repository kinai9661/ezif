import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ModelConfig } from '../../lib/types';

const emptyForm = { value: '', label: '', isGrok: false, enabled: true };

export default function AdminModels() {
  const router = useRouter();
  const [models, setModels] = useState<ModelConfig[]>([]);
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
      const res = await fetch('/api/admin/models');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setModels(data.models || []);
    } catch { setError('載入失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); setError(''); setSuccess(''); };
  const openEdit = (m: ModelConfig) => { setForm({ value: m.value, label: m.label, isGrok: m.isGrok, enabled: m.enabled }); setEditId(m.id); setShowForm(true); setError(''); setSuccess(''); };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async () => {
    if (!form.value.trim() || !form.label.trim()) { setError('請填寫 API Value 與顯示名稱'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      if (editId) {
        // Update via PUT with full models list
        const updated = models.map(m => m.id === editId ? { ...m, ...form } : m);
        const res = await fetch('/api/admin/models', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ models: updated }) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || '儲存失敗'); return; }
        setModels(data.models);
      } else {
        const res = await fetch('/api/admin/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || '新增失敗'); return; }
        setModels(prev => [...prev, data.model]);
      }
      setSuccess(editId ? '已更新' : '已新增');
      closeForm();
    } catch { setError('操作失敗'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (m: ModelConfig) => {
    const updated = models.map(x => x.id === m.id ? { ...x, enabled: !x.enabled } : x);
    const res = await fetch('/api/admin/models', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ models: updated }) });
    const data = await res.json();
    if (res.ok) setModels(data.models);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此模型？')) return;
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

  return (
    <div style={s.bg}>
      <nav style={s.nav}>
        <span style={s.logo}>⚙️ 後台管理</span>
        <div style={s.navLinks}>
          <Link href="/admin" style={s.navLink}>儀表板</Link>
          <Link href="/admin/models" style={{...s.navLink, color: '#818cf8'}}>模型管理</Link>
          <Link href="/admin/providers" style={s.navLink}>供應商</Link>
          <Link href="/admin/settings" style={s.navLink}>設定</Link>
          <Link href="/" style={s.navLink}>前台</Link>
        </div>
      </nav>
      <div style={s.content}>
        <div style={s.header}>
          <h1 style={s.h1}>模型管理</h1>
          <button onClick={openAdd} style={s.addBtn}>+ 新增模型</button>
        </div>
        {error && <p style={s.error}>{error}</p>}
        {success && <p style={s.success}>{success}</p>}
        {loading ? <p style={s.muted}>載入中...</p> : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>排序</th>
                  <th style={s.th}>顯示名稱</th>
                  <th style={s.th}>API Value</th>
                  <th style={s.th}>Grok</th>
                  <th style={s.th}>狀態</th>
                  <th style={s.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, idx) => (
                  <tr key={m.id} style={s.tr}>
                    <td style={s.td}>
                      <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} style={s.sortBtn}>▲</button>
                      <button onClick={() => handleMoveDown(idx)} disabled={idx === models.length - 1} style={s.sortBtn}>▼</button>
                    </td>
                    <td style={s.td}>{m.label}</td>
                    <td style={{...s.td, fontFamily: 'monospace', fontSize: 12, color: '#94a3b8'}}>{m.value}</td>
                    <td style={s.td}>{m.isGrok ? '✅' : '—'}</td>
                    <td style={s.td}>
                      <button onClick={() => handleToggle(m)} style={m.enabled ? s.enabledBadge : s.disabledBadge}>
                        {m.enabled ? '已啟用' : '已停用'}
                      </button>
                    </td>
                    <td style={s.td}>
                      <button onClick={() => openEdit(m)} style={s.editBtn}>編輯</button>
                      <button onClick={() => handleDelete(m.id)} style={s.deleteBtn}>刪除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>{editId ? '編輯模型' : '新增模型'}</h2>
            <label style={s.label}>顯示名稱</label>
            <input value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} style={s.input} placeholder="例如：GPT Image 1" />
            <label style={s.label}>API Value（model 欄位傳入值）</label>
            <input value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} style={s.input} placeholder="例如：gpt-image-1" disabled={!!editId} />
            <div style={s.checkRow}>
              <label style={s.checkLabel}>
                <input type="checkbox" checked={form.isGrok} onChange={e => setForm(f => ({...f, isGrok: e.target.checked}))} />
                {' '}Grok 類型（使用 grok-imagine-image + aspect_ratio）
              </label>
            </div>
            <div style={s.checkRow}>
              <label style={s.checkLabel}>
                <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({...f, enabled: e.target.checked}))} />
                {' '}啟用（顯示於前台）
              </label>
            </div>
            {error && <p style={s.error}>{error}</p>}
            <div style={s.modalBtns}>
              <button onClick={closeForm} style={s.cancelBtn}>取消</button>
              <button onClick={handleSave} disabled={saving} style={s.saveBtn}>{saving ? '儲存中...' : '儲存'}</button>
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
  checkRow: { marginTop: 12 },
  checkLabel: { color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  modalBtns: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  cancelBtn: { padding: '8px 18px', background: 'none', border: '1px solid #475569', color: '#94a3b8', borderRadius: 7, cursor: 'pointer' },
  saveBtn: { padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 },
};

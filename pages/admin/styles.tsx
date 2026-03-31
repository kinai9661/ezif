import { useEffect, useState, FormEvent } from 'react';
import { useTranslation } from '../../lib/useTranslation';
import { StyleConfig, ModelConfig } from '../../lib/types';

export default function AdminStyles() {
  const { t, locale, handleChangeLanguage } = useTranslation();
  const [styles, setStyles] = useState<StyleConfig[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [form, setForm] = useState({ name: '', value: '', description: '', supportedModels: [] as string[] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [stylesData, modelsData] = await Promise.all([
        fetch('/api/admin/styles').then(r => r.json()),
        fetch('/api/public/models').then(r => r.json()),
      ]);
      setStyles(stylesData);
      setModels(modelsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.value) return;
    try {
      const res = await fetch('/api/admin/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', style: form }),
      });
      if (res.ok) {
        setForm({ name: '', value: '', description: '', supportedModels: [] });
        await load();
      }
    } catch (err) {
      console.error('Failed to add style:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此風格？')) return;
    try {
      const res = await fetch('/api/admin/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', style: { id } }),
      });
      if (res.ok) await load();
    } catch (err) {
      console.error('Failed to delete style:', err);
    }
  };

  const handleToggle = async (style: StyleConfig) => {
    try {
      const res = await fetch('/api/admin/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', style: { ...style, enabled: !style.enabled } }),
      });
      if (res.ok) await load();
    } catch (err) {
      console.error('Failed to toggle style:', err);
    }
  };

  const s = {
    bg: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px' },
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', color: '#fff' },
    navLinks: { display: 'flex', gap: '15px' },
    link: { color: '#fff', textDecoration: 'none', cursor: 'pointer', fontSize: '14px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    section: { background: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    form: { display: 'grid', gap: '15px' },
    input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
    select: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
    button: { padding: '10px 20px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    tr: { borderBottom: '1px solid #eee' },
    th: { textAlign: 'left' as const, padding: '12px', background: '#f5f5f5', fontWeight: 'bold', fontSize: '14px' },
    td: { padding: '12px', fontSize: '14px' },
    langSelect: { padding: '6px 10px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '4px', color: '#fff', cursor: 'pointer' },
    tableWrap: { overflowX: 'auto' as const },
  };

  return (
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>
      <div style={s.bg}>
        <nav style={s.nav}>
          <h1>風格管理</h1>
          <div style={s.navLinks}>
            <select value={locale} onChange={e => handleChangeLanguage(e.target.value)} style={s.langSelect}>
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
            </select>
            <a href="/admin" style={s.link}>返回</a>
          </div>
        </nav>
        <div style={s.content}>
          <div style={s.section}>
            <h2 style={{ marginBottom: '15px' }}>新增風格</h2>
            <form onSubmit={handleAdd} style={s.form}>
              <input
                type="text"
                placeholder="風格名稱"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={s.input}
              />
              <input
                type="text"
                placeholder="風格值（英文）"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                style={s.input}
              />
              <input
                type="text"
                placeholder="描述"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={s.input}
              />
              <button type="submit" style={s.button}>新增</button>
            </form>
          </div>

          <div style={s.section}>
            <h2 style={{ marginBottom: '15px' }}>風格列表</h2>
            {loading ? (
              <p>載入中...</p>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr style={s.tr}>
                      <th style={s.th}>名稱</th>
                      <th style={s.th}>值</th>
                      <th style={s.th}>描述</th>
                      <th style={s.th}>狀態</th>
                      <th style={s.th}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {styles.map(style => (
                      <tr key={style.id} style={s.tr}>
                        <td style={s.td}>{style.name}</td>
                        <td style={s.td}>{style.value}</td>
                        <td style={s.td}>{style.description}</td>
                        <td style={s.td}>
                          <input
                            type="checkbox"
                            checked={style.enabled}
                            onChange={() => handleToggle(style)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={s.td}>
                          <button
                            onClick={() => handleDelete(style.id)}
                            style={{ ...s.button, background: '#dc3545' }}
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

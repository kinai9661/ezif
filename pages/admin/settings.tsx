import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from '../../lib/useTranslation';

interface SettingsForm {
  apiBaseUrl: string;
  apiKey: string;
  rateLimitPerMinute: number;
  rateLimitBurst: number;
  rateLimitBurstWindow: number;
  enableEnvKey: boolean;
}

const defaultForm: SettingsForm = {
  apiBaseUrl: '',
  apiKey: '',
  rateLimitPerMinute: 20,
  rateLimitBurst: 5,
  rateLimitBurstWindow: 10000,
  enableEnvKey: true,
};

export default function AdminSettings() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => { if (r.status === 401) { router.push('/admin/login'); } return r.json(); })
      .then(data => { if (data.settings) setForm(s => ({ ...s, ...data.settings, apiKey: data.settings.apiKey || '' })); })
      .catch(() => setError(t('settings.loadFailed')))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('settings.saveFailed')); return; }
      setSuccess(t('settings.saved'));
    } catch { setError(t('settings.saveFailed')); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError(t('settings.passwordMismatch')); return; }
    if (pwForm.newPassword.length < 8) { setPwError(t('settings.passwordTooShort')); return; }
    setPwSaving(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || t('settings.changeFailed')); return; }
      setPwSuccess(t('settings.passwordUpdated'));
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { setPwError(t('settings.changeFailed')); }
    finally { setPwSaving(false); }
  };

  const handleChangeLanguage = (newLocale: string) => {
    router.push(router.asPath, router.asPath, { locale: newLocale });
  };

  const set = (key: keyof SettingsForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [key]: val }));
  };

  return (
    <div style={s.bg}>
      <nav style={s.nav}>
        <span style={s.logo}>⚙️ {t('admin.title')}</span>
        <div style={s.navLinks}>
          <Link href="/admin" style={s.navLink}>{t('common.dashboard')}</Link>
          <Link href="/admin/models" style={s.navLink}>{t('common.models')}</Link>
          <Link href="/admin/providers" style={s.navLink}>{t('common.providers')}</Link>
          <Link href="/admin/settings" style={{...s.navLink, color: '#818cf8'}}>{t('common.settings')}</Link>
          <Link href="/" style={s.navLink}>{t('common.dashboard')}</Link>
          <select value={locale} onChange={e => handleChangeLanguage(e.target.value)} style={s.langSelect}>
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
          </select>
          <button onClick={() => { fetch('/api/admin/auth', { method: 'DELETE' }); router.push('/admin/login'); }} style={s.logoutBtn}>{t('common.logout')}</button>
        </div>
      </nav>
      <div style={s.content}>
        <h1 style={s.h1}>{t('settings.title')}</h1>
        {loading ? <p style={s.muted}>{t('common.loading')}</p> : (
          <form onSubmit={handleSave}>
            <section style={s.section}>
              <h2 style={s.h2}>{t('settings.apiSettings')}</h2>
              <label style={s.label}>{t('settings.apiUrl')}</label>
              <input value={form.apiBaseUrl} onChange={set('apiBaseUrl')} style={s.input} placeholder="https://api.example.com" />
              <p style={s.hint}>{t('settings.apiUrlHint')}</p>

              <label style={s.label}>{t('settings.serverKey')}</label>
              <input value={form.apiKey} onChange={set('apiKey')} style={s.input} placeholder="sk-... （留空保持不變）" type="password" />
              <p style={s.hint}>{t('settings.serverKeyHint')}</p>

              <div style={s.checkRow}>
                <label style={s.checkLabel}>
                  <input type="checkbox" checked={form.enableEnvKey} onChange={set('enableEnvKey')} />
                  {' '}{t('settings.enableServerKey')}
                </label>
              </div>
            </section>

            <section style={s.section}>
              <h2 style={s.h2}>{t('settings.rateLimit')}</h2>
              <div style={s.row3}>
                <div>
                  <label style={s.label}>{t('settings.perMinute')}</label>
                  <input type="number" value={form.rateLimitPerMinute} onChange={set('rateLimitPerMinute')} style={s.input} min={1} />
                </div>
                <div>
                  <label style={s.label}>{t('settings.burstLimit')}</label>
                  <input type="number" value={form.rateLimitBurst} onChange={set('rateLimitBurst')} style={s.input} min={1} />
                </div>
                <div>
                  <label style={s.label}>{t('settings.burstWindow')}</label>
                  <input type="number" value={form.rateLimitBurstWindow} onChange={set('rateLimitBurstWindow')} style={s.input} min={1000} step={1000} />
                </div>
              </div>
            </section>

            {error && <p style={s.error}>{error}</p>}
            {success && <p style={s.success}>{success}</p>}
            <button type="submit" disabled={saving} style={s.saveBtn}>{saving ? `${t('common.save')}中...` : t('common.save')}</button>
          </form>
        )}

        <section style={{...s.section, marginTop: 40}}>
          <h2 style={s.h2}>{t('settings.changePassword')}</h2>
          <form onSubmit={handleChangePassword}>
            <label style={s.label}>{t('settings.currentPassword')}</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} style={s.input} />
            <label style={s.label}>{t('settings.newPassword')}</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} style={s.input} />
            <label style={s.label}>{t('settings.confirmPassword')}</label>
            <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({...f, confirmPassword: e.target.value}))} style={s.input} />
            {pwError && <p style={s.error}>{pwError}</p>}
            {pwSuccess && <p style={s.success}>{pwSuccess}</p>}
            <button type="submit" disabled={pwSaving} style={{...s.saveBtn, marginTop: 12}}>{pwSaving ? `${t('common.save')}中...` : t('settings.updatePassword')}</button>
          </form>
        </section>
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
  content: { maxWidth: 720, margin: '0 auto', padding: '40px 24px' },
  h1: { fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginBottom: 32 },
  h2: { fontSize: 18, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 },
  section: { background: '#1e293b', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #334155' },
  label: { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 4, marginTop: 14 },
  input: { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' },
  hint: { color: '#475569', fontSize: 12, marginTop: 4 },
  checkRow: { marginTop: 14 },
  checkLabel: { color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  error: { color: '#f87171', fontSize: 13, marginBottom: 8 },
  success: { color: '#4ade80', fontSize: 13, marginBottom: 8 },
  muted: { color: '#64748b' },
  saveBtn: { padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 15 },
};

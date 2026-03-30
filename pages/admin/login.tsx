import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '../../lib/useTranslation';

export default function AdminLogin() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('login.loginFailed')); return; }
      const redirect = (router.query.redirect as string) || '/admin';
      router.push(redirect);
    } catch {
      setError(t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLanguage = (newLocale: string) => {
    router.push(router.asPath, router.asPath, { locale: newLocale });
  };

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.langSwitcher}>
          <button
            onClick={() => handleChangeLanguage('zh-TW')}
            style={{...styles.langBtn, opacity: locale === 'zh-TW' ? 1 : 0.5}}
          >
            繁體中文
          </button>
          <button
            onClick={() => handleChangeLanguage('en')}
            style={{...styles.langBtn, opacity: locale === 'en' ? 1 : 0.5}}
          >
            English
          </button>
        </div>
        <h1 style={styles.title}>🔐 {t('admin.title')}</h1>
        <p style={styles.sub}>{t('login.title')}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('login.password')}
            style={styles.input}
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading || !password} style={styles.btn}>
            {loading ? `${t('login.login')}中...` : t('login.login')}
          </button>
        </form>
        <a href="/" style={styles.back}>← {t('common.dashboard')}</a>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bg: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { background: '#1e293b', borderRadius: 12, padding: '40px 48px', width: '100%', maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  langSwitcher: { display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' },
  langBtn: { padding: '6px 12px', borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' },
  sub: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 8 },
  error: { color: '#f87171', fontSize: 13, marginBottom: 8 },
  btn: { width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  back: { display: 'block', textAlign: 'center', marginTop: 20, color: '#64748b', fontSize: 13, textDecoration: 'none' },
};

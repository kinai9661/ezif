import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { useTranslation } from '../../lib/useTranslation';

export default function AdminLogin() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('login.loginFailed'));
        return;
      }
      router.push('/admin');
    } catch {
      setError(t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signIn('google', { redirect: false });
      if (result?.ok) {
        router.push('/admin');
      } else {
        setError(result?.error || t('login.loginFailed'));
      }
    } catch {
      setError(t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.bg}>
      <div style={s.container}>
        <div style={s.card}>
          <h1 style={s.title}>{t('admin.title')}</h1>
          <p style={s.subtitle}>{t('login.title')}</p>

          {error && <p style={s.error}>{error}</p>}

          {/* Google 登入 */}
          <button onClick={handleGoogleSignIn} disabled={loading} style={s.googleBtn}>
            <span style={s.googleIcon}>🔐</span>
            {loading ? t('common.loading') : 'Sign in with Google'}
          </button>

          <div style={s.divider}>
            <span style={s.dividerText}>or</span>
          </div>

          {/* 密碼登入 */}
          <form onSubmit={handlePasswordSubmit}>
            <label style={s.label}>{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={s.input}
              placeholder={t('login.password')}
              disabled={loading}
            />
            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? t('common.loading') : t('login.login')}
            </button>
          </form>

          <p style={s.hint}>
            {locale === 'en' 
              ? 'Use your admin password or Google account to login'
              : '使用管理員密碼或 Google 帳號登入'}
          </p>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  bg: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' },
  container: { width: '100%', maxWidth: 400, padding: '20px' },
  card: { background: '#fff', borderRadius: 12, padding: 40, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  title: { fontSize: 28, fontWeight: 700, color: '#1f2937', margin: '0 0 8px 0', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', margin: '0 0 24px 0' },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 16, padding: '10px 12px', background: '#fee2e2', borderRadius: 6, textAlign: 'center' },
  googleBtn: { width: '100%', padding: '12px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, transition: 'all 0.2s' },
  googleIcon: { fontSize: 18 },
  divider: { display: 'flex', alignItems: 'center', margin: '20px 0', gap: 12 },
  dividerText: { color: '#9ca3af', fontSize: 13, fontWeight: 600 },
  label: { display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 8 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px 16px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  hint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 16, margin: 0 },
};

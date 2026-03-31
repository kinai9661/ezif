import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from '../../lib/useTranslation';

interface DashboardData {
  modelCount: number;
  enabledCount: number;
  apiBaseUrl: string;
  rateLimitPerMinute: number;
  enableEnvKey: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/models').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
    ]).then(([modelsData, settingsData]) => {
      if (modelsData.error || settingsData.error) { router.push('/admin/login'); return; }
      setData({
        modelCount: modelsData.models?.length || 0,
        enabledCount: modelsData.models?.filter((m: { enabled: boolean }) => m.enabled).length || 0,
        apiBaseUrl: settingsData.settings?.apiBaseUrl || '-',
        rateLimitPerMinute: settingsData.settings?.rateLimitPerMinute || 0,
        enableEnvKey: settingsData.settings?.enableEnvKey || false,
      });
    }).catch(() => router.push('/admin/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
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
          <Link href="/admin/providers" style={s.navLink}>{t('common.providers')}</Link>
          <Link href="/admin/styles" style={s.navLink}>風格</Link>
          <Link href="/admin/settings" style={s.navLink}>{t('common.settings')}</Link>
          <Link href="/" style={s.navLink}>{t('common.dashboard')}</Link>
          <select value={locale} onChange={e => handleChangeLanguage(e.target.value)} style={s.langSelect}>
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
          </select>
          <button onClick={handleLogout} style={s.logoutBtn}>{t('common.logout')}</button>
        </div>
      </nav>
      <div style={s.content}>
        <h1 style={s.h1}>{t('dashboard.title')}</h1>
        {loading ? (
          <p style={s.muted}>{t('common.loading')}</p>
        ) : data ? (
          <div style={s.grid}>
            <StatCard label={t('dashboard.modelsCount')} value={`${data.modelCount} ${locale === 'zh-TW' ? '個' : ''}`} icon="🤖" />
            <StatCard label={t('dashboard.enabledCount')} value={`${data.enabledCount} ${locale === 'zh-TW' ? '個' : ''}`} icon="✅" />
            <StatCard label={t('dashboard.rateLimit')} value={`${data.rateLimitPerMinute} ${locale === 'zh-TW' ? '次' : ''}`} icon="⚡" />
            <StatCard label={t('dashboard.serverKey')} value={data.enableEnvKey ? (locale === 'zh-TW' ? '已啟用' : 'Enabled') : (locale === 'zh-TW' ? '已停用' : 'Disabled')} icon="🔑" />
            <div style={{...s.card, gridColumn: '1 / -1'}}>
              <div style={s.cardLabel}>{t('dashboard.apiUrl')}</div>
              <div style={s.cardValue}>{data.apiBaseUrl}</div>
            </div>
          </div>
        ) : null}
        <div style={s.actions}>
          <Link href="/admin/models" style={s.actionBtn}>{t('dashboard.manageModels')}</Link>
          <Link href="/admin/settings" style={s.actionBtn}>{t('dashboard.editSettings')}</Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={s.card}>
      <div style={s.cardIcon}>{icon}</div>
      <div style={s.cardLabel}>{label}</div>
      <div style={s.cardValue}>{value}</div>
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
  h1: { fontSize: 28, fontWeight: 700, marginBottom: 32, color: '#f1f5f9' },
  muted: { color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 },
  card: { background: '#1e293b', borderRadius: 12, padding: '20px 24px', border: '1px solid #334155' },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardLabel: { color: '#64748b', fontSize: 13, marginBottom: 4 },
  cardValue: { color: '#f1f5f9', fontSize: 20, fontWeight: 700, wordBreak: 'break-all' },
  actions: { display: 'flex', gap: 12 },
  actionBtn: { padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 },
};

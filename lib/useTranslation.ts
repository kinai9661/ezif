import { useRouter } from 'next/router';
import en from './i18n/en.json';
import zhTW from './i18n/zh-TW.json';

const translations = { en, 'zh-TW': zhTW };

export function useTranslation() {
  const router = useRouter();
  const locale = (router.locale || 'zh-TW') as keyof typeof translations;

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    for (const k of keys) {
      value = value?.[k];
    }
    return typeof value === 'string' ? value : key;
  };

  return { t, locale };
}

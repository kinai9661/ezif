/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['zh-TW', 'en'],
    defaultLocale: 'zh-TW',
  },
  images: {
    domains: ['oaidalleapiprodscus.blob.core.windows.net'],
    unoptimized: true,
  },
};

module.exports = nextConfig;

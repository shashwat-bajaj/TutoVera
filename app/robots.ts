import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tutovera.com').replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/dashboard',
        '/account',
        '/settings',
        '/history',
        '/login',
        '/forgot-password',
        '/reset-password'
      ]
    },
    sitemap: `${base}/sitemap.xml`
  };
}
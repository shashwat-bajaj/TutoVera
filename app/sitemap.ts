import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tutovera.com').replace(/\/$/, '');
  const lastModified = new Date();

  const routes = [
    '/',
    '/subjects',
    '/about',
    '/contact',
    '/pricing',
    '/privacy',
    '/terms',

    '/tutor',
    '/parents',
    '/learning-tools',

    '/math',
    '/math/tutor',
    '/math/parents',
    '/math/about',

    '/physics',
    '/physics/tutor',
    '/physics/parents',
    '/physics/about',

    '/chemistry',
    '/chemistry/tutor',
    '/chemistry/parents',
    '/chemistry/about',

    '/biology',
    '/biology/tutor',
    '/biology/parents',
    '/biology/about'
  ];

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified
  }));
}
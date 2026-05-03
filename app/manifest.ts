import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TutoVera',
    short_name: 'TutoVera',
    description:
      'Solve. Understand. Improve. A calm AI learning platform for Math, Physics, Chemistry, and Biology.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0B1D3A',
    theme_color: '#0B1D3A',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/brand/exact/tutovera-app-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/brand/transparent/tutovera-app-icon-transparent.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
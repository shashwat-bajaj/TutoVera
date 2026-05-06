import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import AuthNav from '@/components/AuthNav';
import ThemeToggle from '@/components/ThemeToggle';
import BrandMark from '@/components/BrandMark';
import RouteShell from '@/components/RouteShell';
import SiteBackdrop from '@/components/SiteBackdrop';
import AdaptivePrimaryLinks from '@/components/AdaptivePrimaryLinks';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tutovera.com').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TutoVera',
    template: '%s | TutoVera'
  },
  description:
    'Solve. Understand. Improve. TutoVera is a calm AI learning platform for Math, Physics, Chemistry, and Biology, with student and parent workspaces, saved history, and guided learning support.',
  applicationName: 'TutoVera',
  authors: [{ name: 'TutoVera' }],
  creator: 'TutoVera',
  publisher: 'TutoVera',
  keywords: [
    'TutoVera',
    'Solve Understand Improve',
    'AI tutor',
    'AI learning platform',
    'math tutor',
    'physics tutor',
    'chemistry tutor',
    'biology tutor',
    'parent learning support',
    'student workspace',
    'homework help',
    'guided learning'
  ],
  category: 'education',
  alternates: {
    canonical: '/'
  },
  icons: {
    icon: [
      {
        url: '/brand/exact/tutovera-app-icon.png?v=5',
        type: 'image/png',
        sizes: '512x512',
        media: '(prefers-color-scheme: light)'
      },
      {
        url: '/brand/dark-mode/tutovera-app-icon-dark-mode.png?v=5',
        type: 'image/png',
        sizes: '512x512',
        media: '(prefers-color-scheme: dark)'
      },
      {
        url: '/brand/exact/tutovera-app-icon.svg?v=5',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)'
      },
      {
        url: '/brand/dark-mode/tutovera-app-icon-dark-mode.svg?v=5',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)'
      }
    ],
    apple: [
      {
        url: '/brand/exact/tutovera-app-icon.png?v=5',
        type: 'image/png',
        sizes: '512x512'
      }
    ]
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'TutoVera',
    title: 'TutoVera — Solve. Understand. Improve.',
    description:
      'A calm AI learning platform for Math, Physics, Chemistry, and Biology, built around student and parent workspaces.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'TutoVera — Solve. Understand. Improve.'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TutoVera — Solve. Understand. Improve.',
    description: 'A calm AI learning platform for Math, Physics, Chemistry, and Biology.',
    images: ['/twitter-image']
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F8FF' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1D3A' }
  ]
};

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/subjects', label: 'Subjects' },
  { href: '/contact', label: 'Contact' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/settings', label: 'Settings' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Use' }
];

const themeBootstrapScript = `
(function () {
  try {
    var saved = localStorage.getItem('tutovera-theme') || 'system';
    var resolved =
      saved === 'system'
        ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : saved;

    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
    document.body && document.body.setAttribute('data-theme', resolved);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
    document.body && document.body.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="/brand/exact/tutovera-app-icon.svg?v=5"
          type="image/svg+xml"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/brand/dark-mode/tutovera-app-icon-dark-mode.svg?v=5"
          type="image/svg+xml"
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="icon"
          href="/brand/exact/tutovera-app-icon.png?v=5"
          type="image/png"
          sizes="512x512"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/brand/dark-mode/tutovera-app-icon-dark-mode.png?v=5"
          type="image/png"
          sizes="512x512"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="apple-touch-icon" href="/brand/exact/tutovera-app-icon.png?v=5" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>

      <body>
        <SiteBackdrop />

        <div className="siteChrome">
          <header className="topbar">
            <div className="headerShell">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr)',
                  alignItems: 'center',
                  gap: 28
                }}
              >
                <div className="headerBrand">
                  <BrandMark />
                </div>

                <div
                  className="headerNavWrap"
                  style={{
                    minWidth: 0,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    paddingLeft: 12
                  }}
                >
                  <nav
                    className="mainNav"
                    aria-label="Primary navigation"
                    style={{
                      justifyContent: 'flex-end',
                      marginLeft: 'auto',
                      width: 'auto',
                      maxWidth: '100%'
                    }}
                  >
                    <AdaptivePrimaryLinks />
                    <AuthNav />
                  </nav>
                </div>
              </div>
            </div>
          </header>

          <main
            className="container"
            style={{
              paddingTop: 22,
              paddingBottom: 22
            }}
          >
            <RouteShell>{children}</RouteShell>
          </main>

          <footer
            className="siteFooter"
            style={{
              borderTop: '1px solid var(--border)',
              marginTop: 8
            }}
          >
            <div
              className="container"
              style={{
                display: 'grid',
                gap: 18,
                paddingTop: 22,
                paddingBottom: 34
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 18,
                  alignItems: 'start'
                }}
              >
                <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
                  <p className="small" style={{ margin: 0 }}>
                    <strong>TutoVera</strong> is being shaped into a calmer AI learning platform
                    across Math, Physics, Chemistry, and Biology.
                  </p>
                  <p className="small" style={{ margin: 0, maxWidth: 720 }}>
                    Each subject branch has its own learning workspace while sharing the same
                    account, settings, history foundation, deployment, and backend structure.
                  </p>
                </div>

                <ThemeToggle />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 14,
                  flexWrap: 'wrap'
                }}
              >
                <div className="buttonRow" style={{ gap: 14 }}>
                  {footerLinks.map((link) => (
                    <a key={link.href} href={link.href} className="small">
                      {link.label}
                    </a>
                  ))}
                </div>

                <p className="small" style={{ margin: 0 }}>
                  Since 2026 · Solve. Understand. Improve.
                </p>
              </div>
            </div>
          </footer>
        </div>

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
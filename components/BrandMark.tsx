'use client';

import { usePathname } from 'next/navigation';

type BrandContext = 'platform' | 'math' | 'physics' | 'chemistry' | 'biology';

function getBrandContext(pathname: string): BrandContext {
  if (pathname === '/math' || pathname.startsWith('/math/')) return 'math';
  if (pathname === '/physics' || pathname.startsWith('/physics/')) return 'physics';
  if (pathname === '/chemistry' || pathname.startsWith('/chemistry/')) return 'chemistry';
  if (pathname === '/biology' || pathname.startsWith('/biology/')) return 'biology';
  return 'platform';
}

function getBrandSubtitle(context: BrandContext) {
  switch (context) {
    case 'math':
      return 'Clearer math, step by step';
    case 'physics':
      return 'Concepts, units, and motion';
    case 'chemistry':
      return 'Reactions made clearer';
    case 'biology':
      return 'Systems, cells, and life';
    case 'platform':
    default:
      return 'Solve. Understand. Improve.';
  }
}

export default function BrandMark() {
  const pathname = usePathname();
  const context = getBrandContext(pathname);

  return (
    <a
      href="/"
      className="brandLink"
      aria-label="TutoVera home"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 0,
        textDecoration: 'none'
      }}
    >
      <span
        className="brandBadge"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto',
          padding: 0
        }}
      >
        <img
          src="/brand/exact/tutovera-app-icon.png"
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            borderRadius: 'inherit'
          }}
        />
      </span>

      <span
        className="brandText"
        style={{
          display: 'grid',
          gap: 2,
          minWidth: 0
        }}
      >
        <span
          className="brandTitle"
          style={{
            display: 'block',
            lineHeight: 1
          }}
        >
          <img
            src="/brand/transparent/tutovera-wordmark-transparent.svg"
            alt="TutoVera"
            style={{
              display: 'block',
              height: 28,
              width: 'auto',
              maxWidth: 178
            }}
          />
        </span>

        <span className="brandSubtitle">{getBrandSubtitle(context)}</span>
      </span>
    </a>
  );
}
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

function BadgeIcon({ context }: { context: BrandContext }) {
  if (context === 'math') {
    return (
      <span
        style={{
          position: 'relative',
          fontSize: '1rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1
        }}
      >
        ∑
      </span>
    );
  }

  if (context === 'physics') {
    return (
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ position: 'relative', display: 'block' }}
      >
        <circle cx="12" cy="12" r="1.9" fill="currentColor" />
        <ellipse
          cx="12"
          cy="12"
          rx="8.6"
          ry="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="8.6"
          ry="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="8.6"
          ry="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          transform="rotate(120 12 12)"
        />
      </svg>
    );
  }

  if (context === 'chemistry') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ position: 'relative', display: 'block' }}
      >
        <path
          d="M9 3h6M10 3v5.3L5.7 17.1A2.7 2.7 0 0 0 8.1 21h7.8a2.7 2.7 0 0 0 2.4-3.9L14 8.3V3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 16h8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="10" cy="18.2" r="0.8" fill="currentColor" />
        <circle cx="14.5" cy="17.5" r="0.7" fill="currentColor" />
      </svg>
    );
  }

  if (context === 'biology') {
    return (
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ position: 'relative', display: 'block' }}
      >
        <path
          d="M18.5 5.5c-5.9.2-10.2 3.2-11.7 8.2-1.1 3.5 1.1 5.7 4.4 4.6 5-1.6 7.9-5.9 7.3-12.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.3 17.1c2.4-3.4 5.1-5.9 8.5-7.7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        display: 'inline-grid',
        placeItems: 'center',
        width: 25,
        height: 25,
        lineHeight: 1
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: 4,
          fontSize: '0.72rem',
          fontWeight: 850,
          letterSpacing: '-0.08em'
        }}
      >
        T
      </span>
      <span
        style={{
          position: 'absolute',
          right: 4,
          bottom: 2,
          fontSize: '0.82rem',
          fontWeight: 850,
          letterSpacing: '-0.08em'
        }}
      >
        V
      </span>
    </span>
  );
}

export default function BrandMark() {
  const pathname = usePathname();
  const context = getBrandContext(pathname);

  return (
    <a href="/" className="brandLink" aria-label="TutoVera home">
      <span
        className="brandBadge"
        style={{
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.24), transparent 36%), linear-gradient(135deg, rgba(255,255,255,0.18), transparent 58%)',
            pointerEvents: 'none'
          }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 7,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.14)',
            pointerEvents: 'none'
          }}
        />

        <BadgeIcon context={context} />
      </span>

      <span className="brandText">
        <span className="brandTitle">TutoVera</span>
        <span className="brandSubtitle">{getBrandSubtitle(context)}</span>
      </span>
    </a>
  );
}
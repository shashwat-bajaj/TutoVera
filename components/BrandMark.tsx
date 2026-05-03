'use client';

import Link from 'next/link';

export default function BrandMark() {
  return (
    <Link href="/" className="brandLink" aria-label="TutoVera home">
      <span
        className="brandBadge"
        aria-hidden="true"
        style={{
          width: 58,
          height: 58,
          borderRadius: 0,
          background: 'transparent',
          border: 0,
          boxShadow: 'none',
          overflow: 'visible'
        }}
      >
        <img
          src="/brand/exact/tutovera-app-icon.png"
          alt=""
          className="brandIconAsset brandAssetLight"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: 0
          }}
        />
        <img
          src="/brand/dark-mode/tutovera-app-icon-dark-mode.png"
          alt=""
          className="brandIconAsset brandAssetDark"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: 0
          }}
        />
      </span>

      <span className="brandText">
        <span className="brandTitle">
          <img
            src="/brand/transparent/tutovera-primary-logo-transparent.svg"
            alt="TutoVera"
            className="brandWordmarkAsset brandAssetLight"
            style={{
              height: 46,
              width: 'auto',
              maxWidth: 'min(300px, 64vw)'
            }}
          />
          <img
            src="/brand/transparent/tutovera-primary-logo-dark-mode-transparent.svg"
            alt="TutoVera"
            className="brandWordmarkAsset brandAssetDark"
            style={{
              height: 46,
              width: 'auto',
              maxWidth: 'min(300px, 64vw)'
            }}
          />
        </span>
      </span>
    </Link>
  );
}
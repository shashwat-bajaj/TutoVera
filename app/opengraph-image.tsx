import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 18% 16%, rgba(123, 108, 255, 0.34), transparent 28%), radial-gradient(circle at 82% 18%, rgba(77, 196, 154, 0.24), transparent 26%), linear-gradient(135deg, #101426 0%, #171d35 52%, #10291f 100%)',
          color: '#f8f3ea',
          padding: '64px'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 36,
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 40
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            zIndex: 2
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.34), transparent 32%), linear-gradient(135deg, #6a5cff 0%, #2e376d 48%, #14503f 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)'
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 850,
                  letterSpacing: '-0.08em'
                }}
              >
                TV
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 42, fontWeight: 850, letterSpacing: '-0.045em' }}>
                TutoVera
              </div>
              <div style={{ fontSize: 22, color: 'rgba(248,243,234,0.72)' }}>
                Since 2026
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
            <div
              style={{
                fontSize: 74,
                lineHeight: 0.96,
                letterSpacing: '-0.06em',
                fontWeight: 880
              }}
            >
              Solve. Understand. Improve.
            </div>

            <div
              style={{
                fontSize: 27,
                lineHeight: 1.35,
                color: 'rgba(248,243,234,0.76)',
                maxWidth: 840
              }}
            >
              A calm AI learning platform with student and parent workspaces for Math, Physics,
              Chemistry, and Biology.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {['Math', 'Physics', 'Chemistry', 'Biology'].map((item) => (
              <div
                key={item}
                style={{
                  padding: '10px 16px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.09)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: 20,
                  color: 'rgba(248,243,234,0.82)'
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
import React from 'react';

export function NovaGateBrandLogo({ size = 28 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldHex" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8d7c0" />
            <stop offset="50%" stopColor="#c5a880" />
            <stop offset="100%" stopColor="#8d6e3f" />
          </linearGradient>
          <linearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1c1d27" />
            <stop offset="100%" stopColor="#0c0d12" />
          </linearGradient>
        </defs>

        {/* Mercury-inspired geometric shield with gold border */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          fill="url(#shieldBg)"
          stroke="url(#goldHex)"
          strokeWidth="1.2"
        />

        {/* Double-Entry Symmetric Balance Lines & Diamond */}
        <path
          d="M10 16L16 10L22 16L16 22L10 16Z"
          stroke="url(#goldHex)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="2.5" fill="#0abf53" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#f5f5f7',
              lineHeight: 1.1,
            }}
          >
            NOVAGATE
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'rgba(10, 191, 83, 0.15)',
              color: '#0abf53',
              fontWeight: 700,
              letterSpacing: '0.04em',
              border: '1px solid rgba(10, 191, 83, 0.3)',
            }}
          >
            CORE
          </span>
        </div>
        <span
          style={{
            fontSize: '0.62rem',
            color: '#8b8e9b',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Banking & Payments
        </span>
      </div>
    </div>
  );
}

export function NovaBotAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1b1c24 0%, #0d0e13 100%)',
        border: '1.5px solid rgba(197, 168, 128, 0.4)',
        boxShadow: '0 0 16px rgba(197, 168, 128, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 36 36" fill="none">
        <rect x="2" y="14" width="4" height="10" rx="2" fill="#c5a880" />
        <rect x="30" y="14" width="4" height="10" rx="2" fill="#c5a880" />
        <path d="M4 14C4 8.47715 8.47715 4 14 4H22C27.5228 4 32 8.47715 32 14" stroke="#c5a880" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="6" y="8" width="24" height="20" rx="6" fill="#14151e" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <rect x="9" y="12" width="18" height="11" rx="4" fill="#0b1a13" />
        <circle cx="14" cy="17" r="2.2" fill="#0abf53" />
        <circle cx="22" cy="17" r="2.2" fill="#0abf53" />
        <path d="M16 20.5C16.8 21.2 19.2 21.2 20 20.5" stroke="#0abf53" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function VietQrBadge({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '3px 9px',
        borderRadius: '6px',
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <svg width={size} height={size * 0.7} viewBox="0 0 40 28" fill="none">
        <rect width="40" height="28" rx="4" fill="#003B70" />
        <path d="M8 6H16V14H8V6Z" fill="#EE2E24" />
        <rect x="10" y="8" width="4" height="4" fill="#FFFFFF" />
        <path d="M24 6H32V14H24V6Z" fill="#EE2E24" />
        <rect x="26" y="8" width="4" height="4" fill="#FFFFFF" />
        <path d="M8 16H16V22H8V16Z" fill="#EE2E24" />
        <rect x="10" y="18" width="4" height="2" fill="#FFFFFF" />
        <path d="M20 16H32V22H20V16Z" fill="#00C1DE" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#003B70', letterSpacing: '-0.02em' }}>
          VIETQR
        </span>
        <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#EE2E24' }}>
          NAPAS 247
        </span>
      </div>
    </div>
  );
}

export function VisaIcon({ width = 36, height = 24 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 36 24" fill="none">
      <rect width="36" height="24" rx="4" fill="#1A1F71" />
      <path
        d="M13.5 16.5L15.3 7.5H17.6L15.8 16.5H13.5ZM21.5 7.7C21 7.5 20.2 7.3 19.3 7.3C16.8 7.3 15.1 8.6 15.1 10.4C15.1 11.8 16.3 12.6 17.3 13.1C18.3 13.6 18.7 13.9 18.7 14.4C18.7 15.1 17.8 15.5 17 15.5C16.1 15.5 15.6 15.3 14.8 15L14.5 14.8L14.1 16.7C14.7 17 15.8 17.2 16.8 17.2C19.5 17.2 21.2 15.9 21.2 13.9C21.2 12.8 20.4 12 18.8 11.2C18 10.8 17.5 10.5 17.5 10C17.5 9.5 18 9 19 9C19.7 9 20.3 9.1 20.8 9.3L21.1 9.4L21.5 7.7ZM25.2 16.5H27.3L25.4 7.5H23.5C23.1 7.5 22.7 7.7 22.5 8.1L19.4 16.5H21.8L22.3 15.2H25L25.2 16.5ZM22.9 13.4L24 10.2L24.7 13.4H22.9ZM12.2 7.5L10 13.7L9.8 12.7C9.4 11.4 8.2 9.9 6.8 9.2L8.7 16.5H11.1L14.6 7.5H12.2Z"
        fill="#FFFFFF"
      />
      <path d="M8.3 7.5H4.5L4.4 7.7C7.4 8.5 9.9 10.4 10.7 12.7L9.9 8.2C9.8 7.7 9.4 7.5 8.3 7.5Z" fill="#F7B600" />
    </svg>
  );
}

export function MastercardIcon({ width = 36, height = 24 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 36 24" fill="none">
      <rect width="36" height="24" rx="4" fill="#0A0A0A" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <circle cx="14" cy="12" r="7" fill="#EB001B" />
      <circle cx="22" cy="12" r="7" fill="#F79E1B" fillOpacity="0.85" />
    </svg>
  );
}

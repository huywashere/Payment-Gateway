import React from 'react';

export interface BankLogoProps {
  code: string;
  size?: number;
  className?: string;
}

export function BankLogo({ code, size = 24 }: BankLogoProps) {
  const bank = code.toUpperCase();

  switch (bank) {
    case 'MB':
    case 'MBBANK':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* MB Star Icon */}
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#ED1C24" />
            <path
              d="M16 6L18.5 13.5H26L20 18L22.5 25.5L16 21L9.5 25.5L12 18L6 13.5H13.5L16 6Z"
              fill="#FFFFFF"
            />
          </svg>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#002B49', letterSpacing: '-0.02em' }}>
            MB
          </span>
        </div>
      );

    case 'ACB':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#0054A6" />
            <path
              d="M16 8L8 24H13L16 18L19 24H24L16 8Z"
              fill="#FFFFFF"
            />
            <circle cx="16" cy="14" r="2.5" fill="#00C1DE" />
          </svg>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0054A6', letterSpacing: '0.04em' }}>
            ACB
          </span>
        </div>
      );

    case 'BIDV':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#006B68" />
            <path
              d="M16 7L24 16L16 25L8 16L16 7Z"
              fill="#F9A01B"
            />
            <path
              d="M16 11L20.5 16L16 21L11.5 16L16 11Z"
              fill="#006B68"
            />
          </svg>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#006B68' }}>
            BIDV
          </span>
        </div>
      );

    case 'VIETCOMBANK':
    case 'VCB':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#006341" />
            <path
              d="M16 7C11.0294 7 7 11.0294 7 16C7 20.9706 11.0294 25 16 25C20.9706 25 25 20.9706 25 16C25 11.0294 20.9706 7 16 7ZM16 21.5C12.9624 21.5 10.5 19.0376 10.5 16C10.5 12.9624 12.9624 10.5 16 10.5C19.0376 10.5 21.5 12.9624 21.5 16C21.5 19.0376 19.0376 21.5 16 21.5Z"
              fill="#A4D233"
            />
          </svg>
          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#006341' }}>
            Vietcombank
          </span>
        </div>
      );

    case 'TECHCOMBANK':
    case 'TCB':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#E31837" />
            <rect x="9" y="9" width="6" height="6" fill="#FFFFFF" />
            <rect x="17" y="17" width="6" height="6" fill="#FFFFFF" />
            <rect x="9" y="17" width="6" height="6" fill="#000000" />
            <rect x="17" y="9" width="6" height="6" fill="#000000" />
          </svg>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#E31837' }}>
            TCB
          </span>
        </div>
      );

    case 'TPBANK':
    case 'TPB':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#6A2A82" />
            <path
              d="M16 8L25 24H7L16 8Z"
              fill="#F37021"
            />
            <path
              d="M16 13L21 22H11L16 13Z"
              fill="#6A2A82"
            />
          </svg>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#6A2A82' }}>
            TPBank
          </span>
        </div>
      );

    case 'VPBANK':
    case 'VPB':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#00A859" />
            <circle cx="16" cy="16" r="6" fill="#ED1C24" />
            <path
              d="M16 8C19 12 21 16 21 16C21 16 17 19 16 24C15 19 11 16 11 16C11 16 13 12 16 8Z"
              fill="#FFFFFF"
            />
          </svg>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#00A859' }}>
            VPBank
          </span>
        </div>
      );

    case 'VIB':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#004990" />
            <path
              d="M11 10L16 18L21 10H25L16 24L7 10H11Z"
              fill="#F37021"
            />
          </svg>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#F37021' }}>
            VIB
          </span>
        </div>
      );

    case 'SACOMBANK':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#005082" />
            <path
              d="M9 13C9 10.5 12 9 16 9C20 9 23 10.5 23 13C23 18 10 16 10 20C10 22 13 23 16 23C20 23 23 21.5 23 19"
              stroke="#F37021"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#005082' }}>
            Sacombank
          </span>
        </div>
      );

    case 'VIETINBANK':
    case 'CTG':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#004B87" />
            <circle cx="16" cy="16" r="8" stroke="#ED1C24" strokeWidth="2.5" />
            <circle cx="16" cy="16" r="3" fill="#004B87" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#004B87' }}>
            VietinBank
          </span>
        </div>
      );

    case 'OCB':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#008744" />
            <circle cx="16" cy="16" r="7" stroke="#F9A01B" strokeWidth="3" fill="#FFFFFF" />
          </svg>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#008744' }}>
            OCB
          </span>
        </div>
      );

    case 'SHINHAN':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#004696" />
            <path
              d="M16 9C12 9 9 12 9 16C9 20 12 23 16 23C20 23 23 20 23 16"
              stroke="#D4AF37"
              strokeWidth="2.5"
            />
            <circle cx="16" cy="14" r="2.5" fill="#D4AF37" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#004696' }}>
            Shinhan Bank
          </span>
        </div>
      );

    case 'MSB':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#ED1B24" />
            <circle cx="12" cy="16" r="4" fill="#FFFFFF" />
            <circle cx="20" cy="16" r="4" fill="#F9A01B" />
          </svg>
          <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#ED1B24' }}>
            MSB
          </span>
        </div>
      );

    case 'COOPBANK':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#B32025" />
            <circle cx="16" cy="16" r="6" stroke="#FFFFFF" strokeWidth="2.5" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#B32025' }}>
            Co-opBank
          </span>
        </div>
      );

    default:
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#27272A" />
            <circle cx="16" cy="16" r="5" fill="#A1A1AA" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#3F3F46' }}>
            {code}
          </span>
        </div>
      );
  }
}

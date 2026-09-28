import Image from 'next/image';

export interface BankLogoProps {
  code: string;
  size?: number;
  className?: string;
}

type BankBrand = {
  assetCode: string;
  name: string;
};

const BANK_BRANDS: Record<string, BankBrand> = {
  ACB: { assetCode: 'ACB', name: 'ACB' },
  BIDV: { assetCode: 'BIDV', name: 'BIDV' },
  COOPBANK: { assetCode: 'COOPBANK', name: 'Co-opBank' },
  CTG: { assetCode: 'ICB', name: 'VietinBank' },
  ICB: { assetCode: 'ICB', name: 'VietinBank' },
  MB: { assetCode: 'MB', name: 'MBBank' },
  MBBANK: { assetCode: 'MB', name: 'MBBank' },
  MSB: { assetCode: 'MSB', name: 'MSB' },
  NCB: { assetCode: 'NCB', name: 'NCB' },
  OCB: { assetCode: 'OCB', name: 'OCB' },
  SACOMBANK: { assetCode: 'STB', name: 'Sacombank' },
  SHBVN: { assetCode: 'SHBVN', name: 'Shinhan Bank' },
  SHINHAN: { assetCode: 'SHBVN', name: 'Shinhan Bank' },
  STB: { assetCode: 'STB', name: 'Sacombank' },
  TCB: { assetCode: 'TCB', name: 'Techcombank' },
  TECHCOMBANK: { assetCode: 'TCB', name: 'Techcombank' },
  TPB: { assetCode: 'TPB', name: 'TPBank' },
  TPBANK: { assetCode: 'TPB', name: 'TPBank' },
  VCB: { assetCode: 'VCB', name: 'Vietcombank' },
  VIETCOMBANK: { assetCode: 'VCB', name: 'Vietcombank' },
  VIB: { assetCode: 'VIB', name: 'VIB' },
  VIETINBANK: { assetCode: 'ICB', name: 'VietinBank' },
  VPB: { assetCode: 'VPB', name: 'VPBank' },
  VPBANK: { assetCode: 'VPB', name: 'VPBank' },
};

export function BankLogo({ code, size = 24, className }: BankLogoProps) {
  const normalizedCode = code.trim().toUpperCase();
  const brand = BANK_BRANDS[normalizedCode];

  if (!brand) {
    return (
      <span
        className={className}
        aria-label={`Ngân hàng ${code}`}
        style={{
          alignItems: 'center',
          background: '#ffffff',
          border: '1px solid rgba(15, 23, 42, 0.12)',
          borderRadius: Math.max(5, Math.round(size * 0.3)),
          color: '#334155',
          display: 'inline-flex',
          fontSize: Math.max(10, Math.round(size * 0.55)),
          fontWeight: 800,
          height: size,
          justifyContent: 'center',
          lineHeight: 1,
          minWidth: Math.round(size * 2.65),
          padding: '0 8px',
          whiteSpace: 'nowrap',
        }}
      >
        {normalizedCode || 'BANK'}
      </span>
    );
  }

  return (
    <span
      className={className}
      title={brand.name}
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        borderRadius: Math.max(5, Math.round(size * 0.3)),
        display: 'inline-flex',
        flexShrink: 0,
        height: size,
        lineHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Image
        src={`/banks/${brand.assetCode}.png`}
        alt={`Logo ${brand.name}`}
        width={831}
        height={311}
        sizes={`${Math.round(size * 2.67)}px`}
        style={{ display: 'block', height: size, objectFit: 'contain', width: 'auto' }}
      />
    </span>
  );
}

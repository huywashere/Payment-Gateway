'use client';

import { usePathname } from 'next/navigation';
import { AdyenFooter, AdyenHeader } from '@/components/AdyenChrome';
import { MerchantPortalShell } from '@/components/MerchantPortalShell';
import { PortalSessionBadge } from '@/components/PortalSessionBadge';

const PORTAL_PREFIXES = [
  '/dashboard',
  '/operations',
  '/payment-links',
  '/transactions',
  '/developers',
  '/organization',
  '/acquirer',
  '/platform',
  '/banks',
  '/billing',
  '/audit-logs',
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPortal = PORTAL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isPortal) {
    return <MerchantPortalShell>{children}</MerchantPortalShell>;
  }

  if (pathname === '/login') {
    return <main className="auth-page-shell">{children}</main>;
  }

  return (
    <div className="site-shell">
      <AdyenHeader />
      <PortalSessionBadge />
      <main>{children}</main>
      <AdyenFooter />
    </div>
  );
}

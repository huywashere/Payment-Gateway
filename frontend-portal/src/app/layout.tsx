import type { Metadata } from 'next';
import './globals.css';
import { AdyenFooter, AdyenHeader } from '@/components/AdyenChrome';
import { PortalSessionBadge } from '@/components/PortalSessionBadge';

export const metadata: Metadata = {
  title: 'ApiPay | Unified Payments & Financial Technology Platform',
  description: 'Hạ tầng thanh toán, dữ liệu và sản phẩm tài chính hợp nhất cho doanh nghiệp hiện đại.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <div className="site-shell">
          <AdyenHeader />
          <PortalSessionBadge />
          <main>{children}</main>
          <AdyenFooter />
        </div>
      </body>
    </html>
  );
}

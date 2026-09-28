import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { SiteChrome } from '@/components/SiteChrome';

export const metadata: Metadata = {
  title: 'ApiPay | Unified Payments & Financial Technology Platform',
  description: 'Hạ tầng thanh toán, dữ liệu và sản phẩm tài chính hợp nhất cho doanh nghiệp hiện đại.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <Suspense fallback={<main className="app-shell-fallback">{children}</main>}>
          <SiteChrome>{children}</SiteChrome>
        </Suspense>
      </body>
    </html>
  );
}

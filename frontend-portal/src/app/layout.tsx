import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { ApipayBrandLogo } from '@/components/PaymentIcons';

export const metadata: Metadata = {
  title: 'Cổng API thanh toán ngân hàng Việt Nam | ApiPay',
  description: 'ApiPay là nền tảng Open Banking API giúp tự động hóa thanh toán chuyển khoản ngân hàng. Kết nối ngân hàng, nhận biến động số dư tức thì, webhook real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        {/* Isometric Pattern Background & Hero Ambient Glow */}
        <div className="pattern-grid" />
        <div className="hero-glow" />

        {/* Outer Container with 1px border like apipay.vn */}
        <div
          style={{
            position: 'relative',
            maxWidth: '1200px',
            margin: '0 auto',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            minHeight: '100vh',
            background: 'var(--bg-black)',
            zIndex: 1,
          }}
        >
          {/* Header Bar */}
          <header
            id="apipay-header"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              backgroundColor: 'rgba(9, 9, 11, 0.85)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0 28px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
              <Link
                href="/"
                id="apipay-brand-logo"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                <ApipayBrandLogo size={28} />
              </Link>

              {/* Main Navigation Links */}
              <nav
                id="apipay-desktop-nav"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                <Link href="#features" className="nav-item" style={{ transition: 'color 0.15s ease' }}>
                  Giới Thiệu ▾
                </Link>
                <Link href="#technology" className="nav-item" style={{ transition: 'color 0.15s ease' }}>
                  Công Nghệ ▾
                </Link>
                <Link href="/checkout" className="nav-item" style={{ transition: 'color 0.15s ease' }}>
                  Tích hợp ▾
                </Link>
                <Link href="/store" className="nav-item" style={{ transition: 'color 0.15s ease' }}>
                  Bảng giá & Demo
                </Link>
                <a
                  href="http://localhost:8080/swagger-ui.html"
                  target="_blank"
                  rel="noreferrer"
                  className="nav-item"
                  style={{ transition: 'color 0.15s ease' }}
                >
                  Tài liệu API
                </a>
              </nav>
            </div>

            {/* Right Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                href="/dashboard"
                id="btn-nav-dashboard"
                className="btn-apipay-dark"
                style={{ padding: '7px 18px', fontSize: '0.85rem' }}
              >
                Dashboard
              </Link>

              <Link
                href="/checkout"
                id="btn-nav-signup"
                className="btn-apipay-white"
                style={{ padding: '7px 18px', fontSize: '0.85rem' }}
              >
                Đăng ký
              </Link>

              {/* Language Switcher */}
              <button
                type="button"
                id="btn-lang-selector"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  color: '#ffffff',
                }}
              >
                <span>🇻🇳</span>
                <span>VN ▾</span>
              </button>

              {/* Theme Toggle Button */}
              <button
                type="button"
                id="btn-theme-toggle"
                style={{
                  padding: '7px',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Toggle theme"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
              </button>
            </div>
          </header>

          {/* Main Body */}
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}

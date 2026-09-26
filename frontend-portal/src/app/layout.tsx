import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { ApipayBrandLogo } from '@/components/PaymentIcons';

export const metadata: Metadata = {
  title: 'ApiPay | Next-Gen Banking & Unified Payments Platform',
  description:
    'Nền tảng thanh toán và ngân hàng số cho doanh nghiệp hiện đại. Kết hợp kiến trúc Treasury của Mercury và hạ tầng định tuyến thanh toán toàn cầu của Adyen.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        {/* Ambient Warm Champagne Glow & Subtle FinTech Mesh */}
        <div className="ambient-glow-top" />
        <div className="ambient-grid" />

        {/* Outer Layout Wrapper */}
        <div
          style={{
            position: 'relative',
            maxWidth: '1360px',
            margin: '0 auto',
            borderLeft: '1px solid var(--border-frosted)',
            borderRight: '1px solid var(--border-frosted)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-obsidian)',
            zIndex: 1,
          }}
        >
          {/* Mercury-Inspired Floating Frosted Header */}
          <header
            id="mercury-navbar"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              backgroundColor: 'rgba(8, 8, 10, 0.82)',
              borderBottom: '1px solid var(--border-frosted)',
              padding: '0 32px',
              height: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left Brand Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
              <Link
                href="/"
                id="brand-logo-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                <ApipayBrandLogo size={30} />
              </Link>

              {/* Main Desktop Navigation */}
              <nav
                id="desktop-nav-menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '26px',
                  fontSize: '0.88rem',
                }}
              >
                <Link href="/" className="nav-link-active">
                  Nền Tảng
                </Link>
                <Link href="/dashboard" className="nav-link">
                  Treasury & Sổ Cái
                </Link>
                <Link href="/checkout" className="nav-link">
                  Unified Checkout
                </Link>
                <Link href="/store" className="nav-link">
                  Cửa Hàng Demo
                </Link>
                <a
                  href="http://localhost:8080/swagger-ui.html"
                  target="_blank"
                  rel="noreferrer"
                  className="nav-link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  API Docs
                  <span style={{ fontSize: '0.7rem', color: 'var(--mercury-gold)' }}>↗</span>
                </a>
              </nav>
            </div>

            {/* Right Side: Adyen Live Network Indicator & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Adyen Live Latency Ticker */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(10, 191, 83, 0.08)',
                  border: '1px solid rgba(10, 191, 83, 0.22)',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--adyen-green-neon)',
                }}
              >
                <span className="adyen-pulse-dot" />
                <span>ROUTING 12MS</span>
              </div>

              <Link
                href="/dashboard"
                id="btn-nav-dashboard"
                className="btn-glass"
                style={{ padding: '8px 18px', fontSize: '0.84rem' }}
              >
                Merchant Console
              </Link>

              <Link
                href="/checkout"
                id="btn-nav-getstarted"
                className="btn-mercury-gold"
                style={{ padding: '8px 20px', fontSize: '0.84rem' }}
              >
                Mở Tài Khoản
              </Link>
            </div>
          </header>

          {/* Main Viewport Content */}
          <main style={{ flex: 1 }}>{children}</main>

          {/* Adyen + Mercury Style Enterprise Footer */}
          <footer
            style={{
              borderTop: '1px solid var(--border-frosted)',
              background: 'rgba(9, 10, 14, 0.95)',
              padding: '48px 32px 36px 32px',
              marginTop: '80px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '36px',
                marginBottom: '40px',
              }}
            >
              {/* Brand Column */}
              <div>
                <ApipayBrandLogo size={26} />
                <p
                  style={{
                    color: 'var(--text-dim)',
                    fontSize: '0.84rem',
                    lineHeight: 1.6,
                    marginTop: '16px',
                    maxWidth: '300px',
                  }}
                >
                  Hạ tầng tài chính & thanh toán hợp nhất, thiết kế theo tiêu chuẩn Mercury Treasury và công nghệ định tuyến Adyen Commerce.
                </p>
              </div>

              {/* Products */}
              <div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                  }}
                >
                  SẢN PHẨM & CÔNG NGHỆ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Link href="/dashboard" style={{ transition: 'color 0.15s' }}>Sổ Cái Kép Bất Biến (Double-Entry)</Link>
                  <Link href="/checkout" style={{ transition: 'color 0.15s' }}>VietQR Open Banking Napas 24/7</Link>
                  <Link href="/dashboard" style={{ transition: 'color 0.15s' }}>RabbitMQ Transactional Outbox</Link>
                  <Link href="/dashboard" style={{ transition: 'color 0.15s' }}>Redisson Idempotency Shield</Link>
                </div>
              </div>

              {/* Developers */}
              <div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                  }}
                >
                  NHÀ PHÁT TRIỂN
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer">OpenAPI / Swagger Spec ↗</a>
                  <a href="https://github.com/huywashere/Payment-Gateway" target="_blank" rel="noreferrer">Mã nguồn GitHub ↗</a>
                  <Link href="/api/prisma/overview" target="_blank">Prisma Database Insights ↗</Link>
                  <a href="http://localhost:15672" target="_blank" rel="noreferrer">RabbitMQ Cluster Monitor ↗</a>
                </div>
              </div>

              {/* Compliance & Standards */}
              <div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                  }}
                >
                  TIÊU CHUẨN AN TOÀN
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--adyen-green)' }}>✓</span> PCI-DSS Level 1 Card Vault
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--adyen-green)' }}>✓</span> AES-256-GCM Hardware Encrypted
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--adyen-green)' }}>✓</span> HMAC-SHA256 Webhook Signatures
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--adyen-green)' }}>✓</span> Redis Distributed Lock Protection
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar with Status Indicator */}
            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="adyen-pulse-dot" />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Tất cả hệ thống hoạt động bình thường • Spring Boot 3.3.4 (Port 8080) • PostgreSQL 16 • Redis 7 • RabbitMQ 3.13
                </span>
              </div>

              <div>
                © {new Date().getFullYear()} ApiPay Financial Technologies Inc. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

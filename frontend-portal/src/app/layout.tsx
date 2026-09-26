import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { AdyenParticleDome } from '@/components/AdyenShowcase';

export const metadata: Metadata = {
  title: 'ApiPay | Unified Payments & Financial Technology Platform',
  description:
    'Hạ tầng thanh toán hợp nhất và luân chuyển dòng tiền thông minh cho doanh nghiệp hiện đại. Thiết kế theo tiêu chuẩn Adyen Unified Commerce.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body style={{ backgroundColor: '#00112c', color: '#ffffff' }}>
        {/* Full width container matching Adyen navy */}
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#00112c',
          }}
        >
          {/* Adyen Signature Navbar */}
          <header
            id="adyen-header"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              backgroundColor: '#00112c',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '0 32px',
              height: '76px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left: Adyen Exact White Capsule Logo Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  height: '42px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Link
                  href="/"
                  id="adyen-brand-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-sans, sans-serif)',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                      color: '#0abf53',
                      lineHeight: 1,
                    }}
                  >
                    apipay
                  </span>
                </Link>

                {/* Vertical Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '20px',
                    background: '#cbd5e1',
                  }}
                />

                {/* Hamburger Menu Icon */}
                <button
                  type="button"
                  id="btn-header-menu"
                  aria-label="Toggle navigation menu"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ width: '16px', height: '2px', background: '#00112c', borderRadius: '1px' }} />
                  <span style={{ width: '16px', height: '2px', background: '#00112c', borderRadius: '1px' }} />
                  <span style={{ width: '16px', height: '2px', background: '#00112c', borderRadius: '1px' }} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav
                id="adyen-nav-links"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '28px',
                  fontSize: '0.9rem',
                }}
              >
                <Link href="/" className="nav-link-active" style={{ color: '#ffffff', fontWeight: 600 }}>
                  Nền Tảng
                </Link>
                <Link href="/dashboard" className="nav-link">
                  Treasury & Sổ Cái
                </Link>
                <Link href="/checkout" className="nav-link">
                  Cổng Thanh Toán
                </Link>
                <Link href="/store" className="nav-link">
                  Cửa Hàng Demo
                </Link>
                <a
                  href="http://localhost:8080/swagger-ui.html"
                  target="_blank"
                  rel="noreferrer"
                  className="nav-link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  API Docs ↗
                </a>
              </nav>
            </div>

            {/* Right: Adyen Electric Green Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link
                href="/dashboard"
                id="btn-header-dashboard"
                style={{
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '8px 14px',
                }}
                className="nav-link"
              >
                Merchant Console
              </Link>

              <Link
                href="/checkout"
                id="btn-header-contact"
                className="btn-adyen-cta"
              >
                Liên hệ hợp tác
              </Link>
            </div>
          </header>

          {/* Main Body */}
          <main style={{ flex: 1 }}>{children}</main>

          {/* Adyen Exact Footer Structure from Screenshot 3 */}
          <footer
            id="adyen-footer"
            style={{
              backgroundColor: '#00112c',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '64px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 32px' }}>
              {/* Row 1: ABOUT, PRODUCTS, SUBSCRIBE TO NEWSLETTER */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.2fr',
                  gap: '48px',
                  marginBottom: '48px',
                }}
              >
                {/* Column 1: ABOUT */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#64748b',
                      marginBottom: '18px',
                      textTransform: 'uppercase',
                    }}
                  >
                    VỀ CHÚNG TÔI (ABOUT)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                    <Link href="/" className="nav-link">Báo chí & Truyền thông</Link>
                    <Link href="/" className="nav-link">Cơ hội nghề nghiệp (Careers)</Link>
                    <Link href="/" className="nav-link">Quan hệ nhà đầu tư</Link>
                    <Link href="/" className="nav-link">Chương trình đối tác</Link>
                    <Link href="/checkout" className="nav-link">Liên hệ hỗ trợ</Link>
                  </div>
                </div>

                {/* Column 2: PRODUCTS */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#64748b',
                      marginBottom: '18px',
                      textTransform: 'uppercase',
                    }}
                  >
                    SẢN PHẨM (PRODUCTS)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                    <Link href="/checkout" className="nav-link">Cổng thanh toán hợp nhất (Unified Payments)</Link>
                    <Link href="/dashboard" className="nav-link">Quản trị rủi ro & Fraud Detection</Link>
                    <Link href="/checkout" className="nav-link">Xác thực 3D-Secure & OTP ngân hàng</Link>
                    <Link href="/dashboard" className="nav-link">Phát hành thẻ doanh nghiệp (Issuing)</Link>
                    <Link href="/store" className="nav-link">Bảng giá & Chiết khấu sàn</Link>
                  </div>
                </div>

                {/* Column 3: SUBSCRIBE TO NEWSLETTER */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#64748b',
                      marginBottom: '18px',
                      textTransform: 'uppercase',
                    }}
                  >
                    ĐĂNG KÝ BẢN TIN (SUBSCRIBE TO OUR NEWSLETTER)
                  </div>
                  <Link
                    href="/checkout"
                    id="btn-subscribe-newsletter"
                    className="btn-adyen-newsletter"
                  >
                    Đăng ký nhận bản tin công nghệ
                  </Link>
                </div>
              </div>

              {/* Row 2: RESOURCES & PLATFORM */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.2fr',
                  gap: '48px',
                  marginBottom: '20px',
                }}
              >
                {/* Column 1: RESOURCES */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#64748b',
                      marginBottom: '18px',
                      textTransform: 'uppercase',
                    }}
                  >
                    TÀI NGUYÊN (RESOURCES)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                    <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer" className="nav-link">
                      Tài liệu kỹ thuật API (Documentation)
                    </a>
                    <Link href="/dashboard" className="nav-link">Học viện Open Banking</Link>
                    <Link href="/api/prisma/overview" target="_blank" className="nav-link">Prisma Database Insights</Link>
                    <Link href="/" className="nav-link">Bản tin thị trường FinTech</Link>
                  </div>
                </div>

                {/* Column 2: PLATFORM */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#64748b',
                      marginBottom: '18px',
                      textTransform: 'uppercase',
                    }}
                  >
                    HẠ TẦNG & PHÁP LÝ (PLATFORM)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                    <Link href="/" className="nav-link">Hạ tầng phân tán (Spring Boot & Virtual Threads)</Link>
                    <Link href="/" className="nav-link">Giấy phép Open Banking Việt Nam</Link>
                    <Link href="/" className="nav-link">Pháp lý & Tiêu chuẩn tuân thủ</Link>
                    <Link href="/" className="nav-link">Điều khoản & Điều kiện sử dụng</Link>
                    <Link href="/" className="nav-link">Chứng nhận PCI-DSS Level 1 & AES-256</Link>
                    <Link href="/dashboard" className="nav-link" style={{ color: '#0abf53', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="adyen-pulse-dot" />
                      Trạng thái hoạt động 99.999% (Service Status)
                    </Link>
                  </div>
                </div>

                {/* Empty spacer for alignment */}
                <div />
              </div>
            </div>

            {/* Exact Curved Stippled Particle Hemisphere Dome from Screenshot 3 */}
            <AdyenParticleDome />

            {/* Bottom Bar: Legal & Language */}
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '24px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                fontSize: '0.76rem',
                color: '#8fa0be',
                fontFamily: 'monospace',
                backgroundColor: '#00112c',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', letterSpacing: '0.08em' }}>
                <span style={{ cursor: 'pointer' }}>BẢO MẬT (PRIVACY)</span>
                <span style={{ cursor: 'pointer' }}>COOKIES</span>
                <span style={{ cursor: 'pointer' }}>ĐIỀU KHOẢN (DISCLAIMER)</span>
                <span>© {new Date().getFullYear()} APIPAY TECHNOLOGIES</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Social Circle Pills matching Screenshot 3 */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#192841',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="Facebook"
                >
                  f
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#192841',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="LinkedIn"
                >
                  in
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#192841',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="X (Twitter)"
                >
                  𝕏
                </div>

                {/* Language Selector Pill matching Screenshot 3 */}
                <div
                  style={{
                    background: '#192841',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>Việt Nam (Tiếng Việt)</span>
                  <span>🌐</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

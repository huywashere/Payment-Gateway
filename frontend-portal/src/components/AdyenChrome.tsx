'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Globe2, Search, UserRound, X } from 'lucide-react';
import { AdyenParticleDome } from '@/components/AdyenShowcase';

const navigation = [
  ['Sản phẩm', '/checkout'],
  ['Doanh nghiệp', '/dashboard'],
  ['Về chúng tôi', '#about'],
  ['Tài nguyên', 'http://localhost:8080/swagger-ui.html'],
  ['Bảng giá', '/store'],
];

export function AdyenHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 48);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <>
      <header className={`adyen-site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="adyen-header-brand">
          <Link href="/" className="apipay-wordmark" aria-label="ApiPay - Trang chủ" style={{ color: '#00d474' }}>apipay</Link>
          <span className="adyen-header-divider" />
          <button
            type="button"
            className="adyen-menu-button"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <><i /><i /><i /></>}
          </button>
        </div>

        <nav className="adyen-desktop-nav" aria-label="Điều hướng chính">
          {navigation.map(([label, href]) => href.startsWith('http') ? (
            <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>
          ) : <Link key={label} href={href}>{label}</Link>)}
        </nav>

        <div className="adyen-header-actions">
          <button type="button" aria-label="Tìm kiếm"><Search size={19} /></button>
          <span className="adyen-action-divider" />
          <Link href="/dashboard" aria-label="Merchant Console"><UserRound size={19} /></Link>
          <Link href="/checkout" className="adyen-contact-button">Liên hệ</Link>
        </div>
      </header>

      <div className={`adyen-mobile-drawer ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <nav>
          {navigation.map(([label, href], index) => href.startsWith('http') ? (
            <a key={label} href={href} target="_blank" rel="noreferrer" style={{ '--item-index': index } as CSSProperties}>{label}<span>↗</span></a>
          ) : (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{ '--item-index': index } as CSSProperties}>{label}<span>→</span></Link>
          ))}
        </nav>
        <Link href="/checkout" className="adyen-contact-button" onClick={() => setMenuOpen(false)}>Liên hệ với đội ngũ</Link>
      </div>
    </>
  );
}

const footerGroups = [
  { title: 'VỀ CHÚNG TÔI', links: ['Báo chí & truyền thông', 'Tuyển dụng', 'Quan hệ nhà đầu tư', 'Đối tác cùng chúng tôi', 'Liên hệ'] },
  { title: 'SẢN PHẨM', links: ['Thanh toán hợp nhất', 'Quản trị rủi ro', 'Xác thực', 'Phát hành thẻ', 'Bảng giá'] },
  { title: 'TÀI NGUYÊN', links: ['Tài liệu API', 'Học viện', 'Knowledge Hub', 'Bản tin'] },
  { title: 'NỀN TẢNG', links: ['Hạ tầng', 'Giấy phép', 'Pháp lý', 'Điều khoản', 'Công bố trách nhiệm', 'Trạng thái dịch vụ'] },
];

export function AdyenFooter() {
  return (
    <footer id="about" className="adyen-site-footer">
      <div className="adyen-footer-top">
        <div className="adyen-footer-brand-row">
          <div className="adyen-footer-logo-pill"><span className="apipay-wordmark">apipay</span><span /><i /><i /><i /></div>
          <Link href="/checkout" className="adyen-contact-button">Liên hệ</Link>
        </div>
        <div className="adyen-footer-grid">
          {footerGroups.map((group) => (
            <section key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map((label) => <Link key={label} href={label === 'Tài liệu API' ? '/api/prisma/overview' : '/'}>{label}</Link>)}
            </section>
          ))}
          <section className="adyen-newsletter">
            <h2>ĐĂNG KÝ NHẬN BẢN TIN</h2>
            <Link href="/checkout">Đăng ký nhận bản tin</Link>
          </section>
        </div>
      </div>
      <AdyenParticleDome />
      <div className="adyen-footer-bottom">
        <div><span>RIÊNG TƯ</span><span>COOKIES</span><span>MIỄN TRỪ</span><span>© {new Date().getFullYear()} APIPAY</span></div>
        <div className="adyen-footer-social"><b>f</b><b>in</b><b>𝕏</b><span>Việt Nam (Tiếng Việt) <Globe2 size={16} /></span></div>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight, Globe2, Search, UserRound, X } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AdyenParticleDome } from '@/components/AdyenShowcase';

const navigation = [
  ['Sản phẩm', '/checkout'],
  ['Doanh nghiệp', '/dashboard'],
  ['Về chúng tôi', '#about'],
  ['Tài nguyên', 'http://localhost:8080/swagger-ui.html'],
  ['Bảng giá', '/store'],
];

export function AdyenHeader() {
  const headerRef = useRef<HTMLElement | null>(null);
  const brandRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const utilityRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      start: 72,
      end: 'max',
      onToggle: (self) => setScrolled(self.isActive),
      onRefresh: (self) => setScrolled(self.isActive),
    });
    return () => trigger.kill();
  }, []);

  useLayoutEffect(() => {
    let frame = 0;
    let footer: Element | null = null;
    let wasVisible = false;
    const updateHeaderVisibility = () => {
      if (!footer) return;
      const rect = footer.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible === wasVisible) return;
      wasVisible = isVisible;
      gsap.to(headerRef.current, {
        autoAlpha: isVisible ? 0 : 1,
        y: isVisible ? -18 : 0,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .35,
        ease: 'power2.out',
        overwrite: true,
      });
    };
    const connect = () => {
      footer = document.querySelector('.adyen-site-footer');
      if (!footer) {
        frame = window.requestAnimationFrame(connect);
        return;
      }
      window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
      window.addEventListener('resize', updateHeaderVisibility);
      updateHeaderVisibility();
    };
    frame = window.requestAnimationFrame(connect);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateHeaderVisibility);
      window.removeEventListener('resize', updateHeaderVisibility);
    };
  }, []);

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compact = scrolled || window.matchMedia('(max-width: 900px)').matches;
    const duration = reducedMotion ? 0 : .55;
    const context = gsap.context(() => {
      gsap.to(brandRef.current, {
        height: compact ? 48 : 72,
        paddingLeft: compact ? 22 : 0,
        paddingRight: compact ? 16 : 0,
        borderRadius: compact ? 7 : 0,
        backgroundColor: compact ? '#ffffff' : 'rgba(255,255,255,0)',
        boxShadow: compact ? '0 12px 36px rgba(0,17,44,.18)' : '0 0 0 rgba(0,17,44,0)',
        duration,
        ease: 'power3.out',
      });
      gsap.to(navRef.current, { autoAlpha: compact ? 0 : 1, x: compact ? -18 : 0, duration: duration * .7, ease: 'power2.out' });
      gsap.to(utilityRef.current?.querySelectorAll('[data-header-utility]') || [], {
        autoAlpha: compact ? 0 : 1,
        x: compact ? 12 : 0,
        duration: duration * .65,
        stagger: .025,
        ease: 'power2.out',
      });
    }, headerRef);
    return () => context.revert();
  }, [scrolled]);

  useLayoutEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    const items = drawer.querySelectorAll('[data-drawer-item]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      timeline
        .set(drawer, { visibility: 'visible', pointerEvents: 'auto' })
        .to(drawer, { autoAlpha: 1, yPercent: 0, duration: reducedMotion ? 0 : .45 })
        .fromTo(items, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: reducedMotion ? 0 : .045, duration: reducedMotion ? 0 : .5 }, '-=.22');
    } else {
      document.body.style.overflow = '';
      timeline
        .to(items, { autoAlpha: 0, y: -12, stagger: reducedMotion ? 0 : .018, duration: reducedMotion ? 0 : .18 })
        .to(drawer, { autoAlpha: 0, yPercent: -2, duration: reducedMotion ? 0 : .32 }, '-=.1')
        .set(drawer, { visibility: 'hidden', pointerEvents: 'none' });
    }
    return () => {
      timeline.kill();
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header ref={headerRef} className={`adyen-site-header ${scrolled ? 'is-scrolled' : ''} ${menuOpen ? 'menu-is-open' : ''}`}>
        <div ref={brandRef} className="adyen-header-brand">
          <Link href="/" className="novagate-wordmark" aria-label="NovaGate - Trang chủ" style={{ color: '#00d474' }}>novagate</Link>
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

        <nav ref={navRef} className="adyen-desktop-nav" aria-label="Điều hướng chính">
          {navigation.map(([label, href]) => href.startsWith('http') ? (
            <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>
          ) : <Link key={label} href={href}>{label}</Link>)}
        </nav>

        <div ref={utilityRef} className="adyen-header-actions">
          <button type="button" aria-label="Tìm kiếm" data-header-utility><Search size={19} /></button>
          <span className="adyen-action-divider" data-header-utility />
          <Link href="/dashboard" aria-label="Merchant Console" data-header-utility><UserRound size={19} /></Link>
          <Link href="/checkout" className="adyen-contact-button">Liên hệ</Link>
        </div>
      </header>

      <div ref={drawerRef} className="adyen-mobile-drawer" aria-hidden={!menuOpen}>
        <div className="adyen-drawer-intro" data-drawer-item>
          <span>NOVAGATE PLATFORM</span>
          <h2>Một nền tảng cho toàn bộ hành trình thanh toán.</h2>
        </div>
        <nav aria-label="Điều hướng mở rộng">
          {navigation.map(([label, href], index) => href.startsWith('http') ? (
            <a key={label} href={href} target="_blank" rel="noreferrer" data-drawer-item style={{ '--item-index': index } as CSSProperties}>{label}<ArrowUpRight size={18} /></a>
          ) : (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} data-drawer-item style={{ '--item-index': index } as CSSProperties}>{label}<ArrowUpRight size={18} /></Link>
          ))}
        </nav>
        <div className="adyen-drawer-meta" data-drawer-item>
          <span>Sandbox luôn sẵn sàng</span><span>API • Webhooks • VietQR • Ledger</span>
        </div>
        <Link href="/checkout" className="adyen-contact-button" data-drawer-item onClick={() => setMenuOpen(false)}>Liên hệ với đội ngũ</Link>
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
  const footerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const context = gsap.context(() => {
      gsap.from('[data-footer-reveal]', {
        y: reducedMotion ? 0 : 30,
        autoAlpha: reducedMotion ? 1 : 0,
        duration: reducedMotion ? 0 : .8,
        stagger: reducedMotion ? 0 : .07,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 78%',
          once: true,
        },
      });
    }, footerRef);
    return () => context.revert();
  }, []);

  return (
    <footer ref={footerRef} id="about" className="adyen-site-footer">
      <div className="adyen-footer-top">
        <div className="adyen-footer-brand-row" data-footer-reveal>
          <div className="adyen-footer-logo-pill">
            <span className="novagate-wordmark">novagate</span><span />
            <button type="button" aria-label="Quay lại đầu trang" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><i /><i /><i /></button>
          </div>
          <Link href="/checkout" className="adyen-contact-button">Liên hệ</Link>
        </div>
        <div className="adyen-footer-grid">
          {footerGroups.map((group) => (
            <section key={group.title} data-footer-reveal>
              <h2>{group.title}</h2>
              {group.links.map((label) => <Link key={label} href={label === 'Tài liệu API' ? '/api/prisma/overview' : '/'}>{label}</Link>)}
            </section>
          ))}
          <section className="adyen-newsletter" data-footer-reveal>
            <h2>ĐĂNG KÝ NHẬN BẢN TIN</h2>
            <Link href="/checkout">Đăng ký nhận bản tin</Link>
          </section>
        </div>
      </div>
      <AdyenParticleDome />
      <div className="adyen-footer-bottom" data-footer-reveal>
        <div><span>RIÊNG TƯ</span><span>COOKIES</span><span>MIỄN TRỪ</span><span>© {new Date().getFullYear()} NOVAGATE</span></div>
        <div className="adyen-footer-social">
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="LinkedIn">in</a>
          <a href="#" aria-label="X">𝕏</a>
          <span>Việt Nam (Tiếng Việt) <Globe2 size={16} /></span>
        </div>
      </div>
    </footer>
  );
}

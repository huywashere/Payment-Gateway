'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  Zap,
  ArrowRight,
  Play,
  Pause,
  CreditCard,
  QrCode,
  Building,
} from 'lucide-react';

import { AppiBotAvatar } from '@/components/PaymentIcons';
import { AdyenMoneyMovementSection, AdyenPlatformsSection } from '@/components/AdyenShowcase';

const CLIENT_BRANDS = [
  'Toast',
  'OpenAI',
  'lululemon',
  'ORACLE',
  'Spotify',
  'UNIQLO',
  'The Coffee House',
  'Shopee Mall',
  'FPT Retail',
];

export default function HomePage() {
  const [activeCliTab, setActiveCliTab] = useState<'npm' | 'unix' | 'win'>('npm');
  const [copiedCli, setCopiedCli] = useState(false);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '$ apipay payment-intent:create --amount=500000 --currency=VND',
    '✓ Initialized Spring Boot 3.3.4 Virtual Threads Engine',
    '✓ Idempotency Shield: Redis Redisson Lock Acquired',
    '✓ Double-Entry Ledger: Balanced Nợ/Có Entry Recorded',
    '✓ VietQR Napas 24/7 Dynamic Code Generated',
    '✓ Status: READY FOR CHECKOUT [200 OK]',
  ]);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const runLiveTerminalTest = async () => {
    setTerminalRunning(true);
    setTerminalLogs((prev) => [
      ...prev,
      '',
      '$ curl -X POST http://localhost:8080/v1/payment_intents \\',
      '    -H "Authorization: Bearer sk_test_demo_gateway_key_999" \\',
      '    -H "Idempotency-Key: idemp_' + Math.random().toString(36).substring(2, 8) + '" \\',
      '    -d \'{"amount": 500000, "currency": "VND"}\'',
    ]);

    try {
      const idemp = `cli_adyen_${crypto.randomUUID()}`;
      const res = await fetch('/api/gateway/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idemp,
        },
        body: JSON.stringify({
          amount: 500000,
          currency: 'VND',
          description: 'Adyen Exact Body Live Trigger',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTerminalLogs((prev) => [
          ...prev,
          `[200 OK] Created PaymentIntent: ${data.id}`,
          `✓ Client Secret: ${data.clientSecret.substring(0, 32)}...`,
          '✓ Trạng thái: REQUIRES_PAYMENT_METHOD',
          '✓ Sẵn sàng mở Hosted Checkout để xác nhận thanh toán',
        ]);
      } else {
        setTerminalLogs((prev) => [...prev, 'Lỗi kết nối từ Gateway Engine']);
      }
    } catch (err) {
      setTerminalLogs((prev) => [...prev, 'Không kết nối được Spring Boot Core: ' + err]);
    } finally {
      setTerminalRunning(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#00112c', minHeight: '100vh', color: '#ffffff' }}>
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: EXACT ADYEN VIDEO HERO (Matching Screenshot 2)            */}
      {/* ========================================================================= */}
      <section
        className="adyen-hero"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor: '#000000',
        }}
      >
        {/* Background Video directly from Adyen's CDN */}
        <video
          id="hero-bg-video"
          src="https://media.ffycdn.net/eu/adyen/tWdz1QtnMpB2yi7BNLam.mp4?format=mp4"
          poster="https://media.ffycdn.net/eu/adyen/tWdz1QtnMpB2yi7BNLam.mp4?format=webp"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.55,
            zIndex: 0,
          }}
        />

        {/* Ambient Dark Overlays matching Adyen */}
        <div
          className="adyen-hero-content"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(0, 17, 44, 0.4) 0%, rgba(0, 17, 44, 0.85) 100%)',
            zIndex: 1,
          }}
        />

        {/* Hero Content Container */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '900px',
            margin: '0 auto',
            padding: '80px 24px 60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Spotlight Pill Badge (Matching Screenshot 2) */}
          <Link
            className="adyen-spotlight"
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '8px 18px',
              borderRadius: '999px',
              marginBottom: '28px',
              transition: 'background 0.2s',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#0abf53',
                display: 'inline-block',
                borderRadius: '1px',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#0abf53',
                textTransform: 'uppercase',
              }}
            >
              THE SPOTLIGHT 2026
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>—</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: '#ffffff',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              ĐỘT PHÁ NỀN TẢNG THANH TOÁN DOANH NGHIỆP
            </span>
          </Link>

          {/* Big Headline (Matching Screenshot 2) */}
          <h1
            className="adyen-hero-title"
            id="hero-main-title"
            style={{
              fontSize: 'clamp(2.8rem, 5.5vw, 4.4rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              marginBottom: '22px',
            }}
          >
            Fintech you can bank on
          </h1>

          {/* Subtitle */}
          <p
            className="adyen-hero-subtitle"
            style={{
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.75)',
              lineHeight: 1.6,
              maxWidth: '680px',
              marginBottom: '36px',
            }}
          >
            Một nền tảng duy nhất cho thanh toán, dữ liệu và sản phẩm tài chính. Xây dựng để mở rộng cùng các doanh nghiệp hàng đầu.
          </p>

          {/* Center CTA Button (Matching Screenshot 2: Talk to our team) */}
          <div className="adyen-hero-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
            <Link
              href="/checkout"
              id="btn-hero-talk"
              style={{
                backgroundColor: '#0abf53',
                color: '#00112c',
                fontWeight: 700,
                fontSize: '0.98rem',
                padding: '14px 32px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                transition: 'background-color 0.15s ease, transform 0.15s ease',
                boxShadow: '0 4px 20px rgba(10, 191, 83, 0.35)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff84';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#0abf53';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Tư vấn giải pháp ngay</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/store"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '14px 26px',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              Trải nghiệm Cửa hàng Demo
            </Link>
          </div>
        </div>

        {/* Bottom Marquee of Client Logos (Matching Screenshot 2) */}
        <div
          className="adyen-client-strip"
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '20px 32px',
            backgroundColor: 'rgba(0, 17, 44, 0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="marquee-container" style={{ flex: 1 }}>
            <div className="marquee-track">
              {CLIENT_BRANDS.concat(CLIENT_BRANDS).map((brand, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'rgba(255, 255, 255, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: '#0abf53', fontSize: '0.8rem' }}>●</span>
                  <span>{brand}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pause / Play Video Indicator Icon */}
          <button
            type="button"
            onClick={() => {
              const vid = document.getElementById('hero-bg-video') as HTMLVideoElement | null;
              if (vid) {
                if (isVideoPlaying) vid.pause();
                else vid.play();
                setIsVideoPlaying(!isVideoPlaying);
              }
            }}
            style={{
              marginLeft: '24px',
              padding: '8px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isVideoPlaying ? 'Tạm dừng video' : 'Tiếp tục phát'}
          >
            {isVideoPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECTION MÀU TRẮNG: UNIFIED COMMERCE & 3 VALUE PILLARS (Clean White)    */}
      {/* ========================================================================= */}
      <section className="section-white reveal-on-scroll">
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ maxWidth: '840px', marginBottom: '56px' }}>
            <div
              style={{
                fontSize: '0.76rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#0abf53',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              UNIFIED COMMERCE • NỀN TẢNG THANH TOÁN TOÀN DIỆN
            </div>
            <h2
              style={{
                fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
                fontWeight: 800,
                color: '#00112c',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                marginBottom: '18px',
              }}
            >
              Một giải pháp toàn diện cho mọi kênh thanh toán
            </h2>
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Kết nối doanh nghiệp của bạn với mọi điểm chạm khách hàng: từ Online Checkout, VietQR Napas 24/7 đến máy POS tại điểm bán thực tế.
            </p>
          </div>

          {/* 3 White Feature Cards with green accents */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '28px',
              marginBottom: '56px',
            }}
          >
            {/* Card 1: Online Payments */}
            <div className="card-white">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(10, 191, 83, 0.1)',
                  color: '#0abf53',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <CreditCard size={22} />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(10, 191, 83, 0.12)',
                  color: '#0abf53',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '14px',
                }}
              >
                +28% TỶ LỆ CHUYỂN ĐỔI
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#00112c', marginBottom: '12px' }}>
                Thanh Toán Trực Tuyến (Online Payments)
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Tối ưu hóa giỏ hàng với Hosted Checkout mượt mà, hỗ trợ thanh toán 1-click, tokenization an toàn chuẩn PCI-DSS và hạn chế tối đa rớt đơn.
              </p>
              <Link
                href="/checkout"
                style={{
                  color: '#00112c',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Tìm hiểu Hosted Checkout</span>
                <ArrowRight size={14} color="#0abf53" />
              </Link>
            </div>

            {/* Card 2: VietQR & In-Person */}
            <div className="card-white">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(10, 191, 83, 0.1)',
                  color: '#0abf53',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <QrCode size={22} />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(10, 191, 83, 0.12)',
                  color: '#0abf53',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '14px',
                }}
              >
                &lt; 1.5S XÁC NHẬN BIẾN ĐỘNG
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#00112c', marginBottom: '12px' }}>
                VietQR & Open Banking Tức Thời
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Tự động sinh mã VietQR động theo từng đơn hàng. Đồng bộ trực tiếp với hệ thống ngân hàng Napas 24/7 và thông báo webhook IPN ngay khi tiền vào.
              </p>
              <Link
                href="/dashboard"
                style={{
                  color: '#00112c',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Khám phá Open Banking</span>
                <ArrowRight size={14} color="#0abf53" />
              </Link>
            </div>

            {/* Card 3: Payouts & Double-Entry Ledger */}
            <div className="card-white">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(10, 191, 83, 0.1)',
                  color: '#0abf53',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Building size={22} />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(10, 191, 83, 0.12)',
                  color: '#0abf53',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '14px',
                }}
              >
                100% ĐỐI SOÁT TỰ ĐỘNG
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#00112c', marginBottom: '12px' }}>
                Quản Trị Vốn & Chi Trả (Payouts)
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Tự động hóa giải ngân cho đối tác, chi lương và quản lý dòng tiền qua hệ thống Sổ Cái Kép đối xứng. Bất biến dữ liệu, không bao giờ lệch 1 đồng.
              </p>
              <Link
                href="/dashboard"
                style={{
                  color: '#00112c',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Xem giải pháp Sổ Cái Kép</span>
                <ArrowRight size={14} color="#0abf53" />
              </Link>
            </div>
          </div>

          {/* Testimonial Banner */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid rgba(0, 17, 44, 0.08)',
              borderRadius: '16px',
              padding: '36px 40px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px',
            }}
          >
            <div style={{ maxWidth: '820px' }}>
              <p style={{ fontSize: '1.15rem', fontStyle: 'italic', color: '#00112c', lineHeight: 1.6, marginBottom: '12px' }}>
                &ldquo;ApiPay giúp chúng tôi tự động hóa 100% dòng tiền chuyển khoản VietQR và xử lý đối soát tức thời, giải phóng hoàn toàn gánh nặng kế toán thủ công.&rdquo;
              </p>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0abf53' }}>
                TechStore Vietnam Corp • Đơn vị phân phối công nghệ hàng đầu
              </div>
            </div>

            <Link
              href="/store"
              style={{
                backgroundColor: '#00112c',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              Trải nghiệm Cửa hàng Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PHẦN 1: QUẢ CẦU 3D & LUÂN CHUYỂN DÒNG TIỀN (Midnight Navy #00112c)      */}
      {/* ========================================================================= */}
      <AdyenMoneyMovementSection />

      {/* ========================================================================= */}
      {/* 4. PHẦN 2: KIẾN TRÚC XẾP TẦNG 3D & NỀN TẢNG DOANH NGHIỆP (Clean White)   */}
      {/* ========================================================================= */}
      <AdyenPlatformsSection />

      {/* ========================================================================= */}
      {/* 4. SECTION SÁNG: HẠ TẦNG KỸ THUẬT & DEVELOPER TERMINAL (#f6f8fb)          */}
      {/* ========================================================================= */}
      <section className="section-light reveal-on-scroll">
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 56px auto' }}>
            <div
              style={{
                fontSize: '0.76rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#0abf53',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              HẠ TẦNG KỸ THUẬT CHỊU TẢI CAO (CORE ENGINE)
            </div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
                fontWeight: 800,
                color: '#00112c',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                marginBottom: '16px',
              }}
            >
              Xây dựng trên Spring Boot 3.3.4, PostgreSQL 16 & Redis
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Kiến trúc Virtual Threads giúp xử lý hàng ngàn giao dịch đồng thời mà không nghẽn luồng. Kết hợp khóa phân tán Redisson chống double-charge 100%.
            </p>
          </div>

          {/* 4 Performance Metric Cards in Light Theme */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '48px',
            }}
          >
            <div className="card-white">
              <div style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                TỔNG KHỐI LƯỢNG HỆ THỐNG
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#00112c', letterSpacing: '-0.02em' }}>
                ₫500B+
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '6px' }}>
                Xử lý giao dịch liên tục qua Napas 24/7
              </div>
            </div>

            <div className="card-white">
              <div style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                ĐỘ TRỄ ĐỊNH TUYẾN
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0abf53', letterSpacing: '-0.02em' }}>
                &lt; 15ms
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '6px' }}>
                Java 23 Virtual Threads phản hồi tức thì
              </div>
            </div>

            <div className="card-white">
              <div style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                ĐỘ SẴN SÀNG HẠ TẦNG (SLA)
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#00112c', letterSpacing: '-0.02em' }}>
                99.999%
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '6px' }}>
                PostgreSQL 16 & Cụm Redis phân tán
              </div>
            </div>

            <div className="card-white">
              <div style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                CHỐNG DOUBLE-CHARGE
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0abf53', letterSpacing: '-0.02em' }}>
                100% Khóa
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '6px' }}>
                Redisson Distributed Lock (TTL 24h)
              </div>
            </div>
          </div>

          {/* Interactive Developer Terminal Running Live */}
          <div
            style={{
              background: '#041328',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 17, 44, 0.2)',
            }}
          >
            {/* Header Bar */}
            <div
              style={{
                background: '#091b35',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ marginLeft: '12px', color: '#8fa0be', fontFamily: 'monospace' }}>
                  apipay-core-terminal • Port 8080 Live Runner
                </span>
              </div>

              {/* CLI Tabs */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveCliTab('npm')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: activeCliTab === 'npm' ? '#00112c' : 'transparent',
                    color: activeCliTab === 'npm' ? '#ffffff' : '#64748b',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  npm
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCliTab('unix')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: activeCliTab === 'unix' ? '#00112c' : 'transparent',
                    color: activeCliTab === 'unix' ? '#ffffff' : '#64748b',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  curl / bash
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCliTab('win')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: activeCliTab === 'win' ? '#00112c' : 'transparent',
                    color: activeCliTab === 'win' ? '#ffffff' : '#64748b',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  PowerShell
                </button>
              </div>
            </div>

            {/* Copy Command */}
            <div
              style={{
                padding: '12px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: '#cbd5e1',
                background: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <code>
                {activeCliTab === 'npm' && 'npm install -g apipay-gateway-cli'}
                {activeCliTab === 'unix' && 'curl -fsSL https://apipay.vn/install.sh | bash'}
                {activeCliTab === 'win' && 'iwr -useb https://apipay.vn/install.ps1 | iex'}
              </code>
              <button
                type="button"
                onClick={() =>
                  copyCommand(
                    activeCliTab === 'npm'
                      ? 'npm install -g apipay-gateway-cli'
                      : 'curl -fsSL https://apipay.vn/install.sh | bash'
                  )
                }
                style={{ color: copiedCli ? '#0abf53' : '#64748b', cursor: 'pointer' }}
                title="Sao chép"
              >
                {copiedCli ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {/* Terminal Logs */}
            <div style={{ padding: '24px', fontSize: '0.86rem', fontFamily: 'monospace', lineHeight: 1.7 }}>
              {terminalLogs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    color: log.startsWith('$')
                      ? '#ffffff'
                      : log.startsWith('✓')
                      ? '#0abf53'
                      : log.includes('200 OK')
                      ? '#00ff84'
                      : '#8fa0be',
                  }}
                >
                  {log}
                </div>
              ))}

              <div style={{ marginTop: '24px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  id="btn-live-terminal-run"
                  onClick={runLiveTerminalTest}
                  disabled={terminalRunning}
                  style={{
                    backgroundColor: '#0abf53',
                    color: '#00112c',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    padding: '10px 22px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#00ff84')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0abf53')}
                >
                  <Zap size={16} />
                  <span>{terminalRunning ? 'Đang gọi Spring Boot Core...' : 'Chạy thử API tạo PaymentIntent'}</span>
                </button>

                <Link
                  href="/dashboard"
                  style={{
                    background: '#091b35',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    padding: '10px 22px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Xem Sổ Cái Dashboard</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Concierge Chatbot */}
      <div
        className="floating-bot"
        id="adyen-concierge-widget"
        onClick={() =>
          alert(
            'ApiPay Financial Engine: Đang kết nối trực tiếp với Spring Boot 3.3.4 (Port 8080), PostgreSQL 16 (Port 5433), Redis (Port 6379) và RabbitMQ 3.13!'
          )
        }
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          background: '#041328',
          border: '1px solid #0abf53',
          borderRadius: '999px',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8)',
          cursor: 'pointer',
          zIndex: 100,
        }}
      >
        <AppiBotAvatar size={34} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.65rem', color: '#0abf53', letterSpacing: '0.08em', fontWeight: 700 }}>
            APIPAY CONCIERGE
          </span>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
            Hỗ trợ kỹ thuật 24/7
          </span>
        </div>
      </div>
    </div>
  );
}

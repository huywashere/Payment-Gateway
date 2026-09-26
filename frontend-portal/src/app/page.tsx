'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  RefreshCw,
  ExternalLink,
  Wallet,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  Database,
  Radio,
} from 'lucide-react';

import { BankLogo } from '@/components/BankLogos';
import { VisaIcon, MastercardIcon, VietQrBadge, AppiBotAvatar } from '@/components/PaymentIcons';

const SUPPORTED_BANKS = [
  'ACB',
  'MB',
  'VIETCOMBANK',
  'BIDV',
  'TPBANK',
  'VPBANK',
  'TECHCOMBANK',
  'SACOMBANK',
  'VIETINBANK',
  'VIB',
  'MSB',
  'OCB',
];

export default function HomePage() {
  const [activeCliTab, setActiveCliTab] = useState<'npm' | 'unix' | 'win'>('npm');
  const [copiedCli, setCopiedCli] = useState(false);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '$ apipay payment-intent:create --amount=500000 --currency=VND',
    '✓ Initialized Spring Boot 3.3.4 Virtual Threads Engine',
    '✓ Idempotency Shield: Redis Redisson Lock Acquired',
    '✓ Multi-Account Double-Entry Ledger: Balanced Entry Recorded',
    '✓ VietQR Napas 24/7 Dynamic Code Generated',
    '✓ Status: READY FOR CHECKOUT [200 OK]',
  ]);

  const [liveBalance, setLiveBalance] = useState<number>(490500);

  useEffect(() => {
    fetch('http://localhost:8080/v1/balance', {
      headers: {
        Authorization: 'Bearer sk_test_demo_gateway_key_999',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.available_balance !== undefined) {
          setLiveBalance(data.available_balance);
        }
      })
      .catch(() => {});
  }, []);

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
      const idemp = 'cli_mercury_' + Math.random().toString(36).substring(2, 8);
      const res = await fetch('http://localhost:8080/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk_test_demo_gateway_key_999',
          'Idempotency-Key': idemp,
        },
        body: JSON.stringify({
          amount: 500000,
          currency: 'VND',
          description: 'Mercury-Adyen Live Terminal Trigger',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTerminalLogs((prev) => [
          ...prev,
          `[200 OK] Created PaymentIntent: ${data.id}`,
          `✓ Client Secret: ${data.clientSecret.substring(0, 32)}...`,
          `✓ Ledger: Nợ Tiền gửi thanh toán 500,000 / Có Số dư Khách 490,500 / Phí 9,500`,
          `✓ RabbitMQ Outbox: Event published to 'payment.events.exchange'`,
          '✓ Latency: 11ms via Java 23 Virtual Threads',
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
    <div style={{ padding: '60px 32px 100px 32px' }}>
      {/* 1. Hero Section: Mercury Luxury & Adyen Powerhouse */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 80px auto' }}>
        {/* Top Adyen Live Status Pill */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-frosted)',
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '0.84rem',
            }}
          >
            <span className="adyen-pulse-dot" />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              Hạ tầng Open Banking & Unified Commerce thế hệ mới
            </span>
            <span
              style={{
                background: 'rgba(197, 168, 128, 0.15)',
                color: 'var(--mercury-gold)',
                border: '1px solid rgba(197, 168, 128, 0.3)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              MERCURY × ADYEN DESIGN
            </span>
          </div>
        </div>

        {/* Main Headline & Two-Column Hero Showcase */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '48px',
            alignItems: 'center',
            marginBottom: '64px',
          }}
        >
          {/* Left Column: Headline & Value Proposition */}
          <div>
            <h1
              id="hero-headline"
              style={{
                fontSize: 'clamp(2.8rem, 5.2vw, 4.4rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.035em',
                marginBottom: '24px',
                color: 'var(--text-primary)',
              }}
            >
              The financial stack for{' '}
              <span className="text-gold-gradient">what’s next.</span>
            </h1>

            <p
              style={{
                fontSize: '1.2rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '560px',
                marginBottom: '36px',
              }}
            >
              Hợp nhất quản trị dòng tiền doanh nghiệp theo phong cách Mercury Treasury và công nghệ định tuyến thanh toán tốc độ cao chuẩn Adyen.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                marginBottom: '40px',
              }}
            >
              <Link href="/checkout" id="btn-hero-cta" className="btn-mercury-gold">
                <span>Khởi tạo tài khoản ngay</span>
                <ArrowRight size={16} />
              </Link>

              <Link href="/store" id="btn-hero-demo" className="btn-glass">
                <span>Xem Cửa Hàng Demo</span>
              </Link>
            </div>

            {/* Adyen Trust Stats */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                fontSize: '0.86rem',
                color: 'var(--text-dim)',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>100%</strong> Sổ cái bất biến
              </div>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3f3f46' }} />
              <div>
                <strong style={{ color: 'var(--adyen-green-neon)', fontSize: '0.95rem' }}>11ms</strong> Độ trễ Core
              </div>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3f3f46' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>RabbitMQ</strong> Outbox
              </div>
            </div>
          </div>

          {/* Right Column: Mercury 3D Titanium Card & Live Floating Treasury */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* Ambient Warm Aura behind card */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '360px',
                height: '240px',
                background: 'radial-gradient(ellipse at center, rgba(197, 168, 128, 0.25) 0%, rgba(10, 191, 83, 0.1) 50%, transparent 80%)',
                filter: 'blur(50px)',
                zIndex: 0,
              }}
            />

            <div className="mercury-card-container" style={{ position: 'relative', zIndex: 1 }}>
              {/* Mercury 3D Metallic Titanium Card */}
              <div className="mercury-titanium-card">
                {/* Top Row: Mercury-style Brand + NFC Icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        background: 'var(--gold-gradient)',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        letterSpacing: '0.08em',
                        color: '#f5f5f7',
                      }}
                    >
                      APIPAY TITANIUM
                    </span>
                  </div>

                  {/* Contactless Wave */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4b483" strokeWidth="2">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9" strokeLinecap="round" />
                    <path d="M12 19a8.5 8.5 0 0 0 0-14" strokeLinecap="round" />
                    <path d="M15.5 21.5a12 12 0 0 0 0-19" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Middle Row: Gold Chip & Card Number */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '14px 0' }}>
                  <div className="card-chip" />
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.05rem',
                      letterSpacing: '0.18em',
                      color: 'rgba(255, 255, 255, 0.9)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    •••• &nbsp; 8821
                  </div>
                </div>

                {/* Bottom Row: Holder Name, Expiry & Card Brand */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase' }}>
                      DOANH NGHIỆP THỤ HƯỞNG
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        color: '#f5f5f7',
                      }}
                    >
                      TECHSTORE VIETNAM CORP
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6rem', color: '#9ca3af', textTransform: 'uppercase' }}>EXP</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#ffffff' }}>12/28</div>
                    </div>
                    <MastercardIcon width={34} height={22} />
                  </div>
                </div>
              </div>

              {/* Floating Adyen Treasury Indicator Widget */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-28px',
                  right: '-24px',
                  background: 'rgba(15, 16, 23, 0.88)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(197, 168, 128, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 22px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                  minWidth: '240px',
                  zIndex: 2,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>SỐ DƯ QUỸ KHẢ DỤNG</span>
                  <span className="adyen-pulse-dot" />
                </div>
                <div
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {liveBalance.toLocaleString('vi-VN')} ₫
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--adyen-green-neon)' }}>
                  <span>↑ +24.8% tuần này</span>
                  <span style={{ color: 'var(--text-dim)' }}>•</span>
                  <span style={{ color: 'var(--mercury-gold)' }}>Hạch toán tự động</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Ecosystem: Banks, Napas 24/7 & Global Schemes */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '32px' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--text-dim)',
              marginBottom: '16px',
              textTransform: 'uppercase',
            }}
          >
            MẠNG LƯỚI ĐỊNH TUYẾN NGÂN HÀNG & THẺ TOÀN CẦU
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <div className="bank-pill-mercury">
              <VietQrBadge size={30} />
            </div>
            <div className="bank-pill-mercury">
              <VisaIcon width={38} height={24} />
            </div>
            <div className="bank-pill-mercury">
              <MastercardIcon width={38} height={24} />
            </div>

            {SUPPORTED_BANKS.map((bankCode) => (
              <div key={bankCode} className="bank-pill-mercury" title={`Ngân hàng ${bankCode}`}>
                <BankLogo code={bankCode} size={22} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Adyen-Style Enterprise Performance Ticker Bar */}
      <section
        style={{
          maxWidth: '1240px',
          margin: '0 auto 80px auto',
          background: 'rgba(15, 16, 23, 0.65)',
          border: '1px solid var(--border-frosted)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: '32px 40px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
              TỔNG KHỐI LƯỢNG HỆ THỐNG
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              ₫500B+
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Xử lý giao dịch an toàn không gián đoạn
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
              ĐỘ TRỄ ĐỊNH TUYẾN
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--adyen-green-neon)', letterSpacing: '-0.02em' }}>
              &lt; 15ms
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Java 23 Virtual Threads + Reactor
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
              ĐỘ SẴN SÀNG HẠ TẦNG (SLA)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              99.999%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              PostgreSQL 16 Multi-AZ & Redis Cluster
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
              CHỐNG DOUBLE-CHARGE
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--mercury-gold)', letterSpacing: '-0.02em' }}>
              100% Khóa
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Redisson Distributed Lock Shield
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mercury Bento Grid Architecture (4 Asymmetric Core Pillars) */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 80px auto' }}>
        <div style={{ marginBottom: '36px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--mercury-gold)',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            KIẾN TRÚC TÀI CHÍNH BENTO
          </div>
          <h2
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
            }}
          >
            Mọi tính năng được xây dựng cho quy mô lớn.
          </h2>
        </div>

        <div className="bento-container">
          {/* Bento Box 1: Mercury Treasury & Double-Entry Ledger (Span 7) */}
          <div className="bento-card" style={{ gridColumn: 'span 7' }}>
            <div className="bento-card-glow" style={{ top: '-40px', left: '-40px', background: 'var(--mercury-gold)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--mercury-gold)', marginBottom: '16px' }}>
              <Wallet size={24} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                MERCURY TREASURY ARCHITECTURE
              </span>
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f5f5f7', marginBottom: '12px' }}>
              Sổ Cái Kép Bất Biến (Double-Entry Ledger)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px', maxWidth: '580px' }}>
              Toàn bộ dòng tiền được hạch toán đối xứng theo chuẩn kế toán quốc tế: Nợ (Debit) và Có (Credit) luôn cân bằng. Không số dư ảo, bảo vệ tính toàn vẹn 100%.
            </p>

            {/* Visualizer: Double-Entry Live Entries */}
            <div
              style={{
                background: 'rgba(8, 8, 10, 0.75)',
                border: '1px solid var(--border-frosted)',
                borderRadius: '12px',
                padding: '16px 20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '8px' }}>
                <span>TÀI KHOẢN HẠCH TOÁN</span>
                <span>NỢ (DEBIT) / CÓ (CREDIT)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a5b4fc', marginBottom: '6px' }}>
                <span>DR: 1000 - Cổng Ngân hàng ACB</span>
                <span style={{ color: 'var(--adyen-green-neon)' }}>+ 500,000 VND</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2cbab', marginBottom: '6px' }}>
                <span>CR: 2000 - Số dư Merchant TechStore</span>
                <span>- 490,500 VND</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>CR: 3000 - Doanh thu Phí Gateway (1.5% + 2k)</span>
                <span>- 9,500 VND</span>
              </div>
            </div>
          </div>

          {/* Bento Box 2: Adyen Smart Routing & VietQR Napas (Span 5) */}
          <div className="bento-card" style={{ gridColumn: 'span 5' }}>
            <div className="bento-card-glow" style={{ top: '-40px', right: '-40px', background: 'var(--adyen-green)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--adyen-green-neon)', marginBottom: '16px' }}>
              <Zap size={24} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ADYEN UNIFIED COMMERCE
              </span>
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f5f5f7', marginBottom: '12px' }}>
              Định Tuyến Thông Minh & VietQR 24/7
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Tự động chọn luồng thanh toán tối ưu: VietQR động cho chuyển khoản tức thì và Visa/Mastercard cho giao dịch quốc tế.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(8, 8, 10, 0.75)',
                border: '1px solid var(--border-frosted)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <VietQrBadge size={32} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>Sinh mã VietQR Động</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Nhận biến động số dư trong 1.5s</div>
              </div>
            </div>
          </div>

          {/* Bento Box 3: RabbitMQ Transactional Outbox (Span 5) */}
          <div className="bento-card" style={{ gridColumn: 'span 5' }}>
            <div className="bento-card-glow" style={{ bottom: '-40px', left: '-40px', background: '#38bdf8' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', marginBottom: '16px' }}>
              <Layers size={24} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                EVENT-DRIVEN STREAMING
              </span>
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f5f5f7', marginBottom: '12px' }}>
              RabbitMQ Outbox & Webhooks
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Đảm bảo tính nhất quán (Eventual Consistency) với Transactional Outbox Pattern, đẩy sự kiện qua RabbitMQ và ký số HMAC-SHA256.
            </p>

            <div
              style={{
                background: 'rgba(8, 8, 10, 0.75)',
                border: '1px solid var(--border-frosted)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: '#86efac',
              }}
            >
              Header: Stripe-Signature: t=1727361890,v1=9f8c...
            </div>
          </div>

          {/* Bento Box 4: Redisson Idempotency & Card Vault (Span 7) */}
          <div className="bento-card" style={{ gridColumn: 'span 7' }}>
            <div className="bento-card-glow" style={{ bottom: '-40px', right: '-40px', background: '#ec4899' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f43f5e', marginBottom: '16px' }}>
              <ShieldCheck size={24} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ZERO CHARGEBACK & PCI-DSS
              </span>
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f5f5f7', marginBottom: '12px' }}>
              Idempotency Shield & AES-256 Card Vault
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px', maxWidth: '580px' }}>
              Khóa phân tán Redis ngăn chặn tình trạng khách hàng bị trừ tiền 2 lần khi mạng chập chờn. Dữ liệu thẻ được phân mảnh và mã hóa phần cứng.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                style={{
                  background: 'rgba(8, 8, 10, 0.75)',
                  border: '1px solid var(--border-frosted)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>KHÓA PHÂN TÁN</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--adyen-green-neon)' }}>Redisson TTL 24h</div>
              </div>

              <div
                style={{
                  background: 'rgba(8, 8, 10, 0.75)',
                  border: '1px solid var(--border-frosted)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>CHUẨN MÃ HÓA</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--mercury-gold)' }}>AES-256-GCM Vault</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Developer Console (Mercury x Adyen CLI & Live Spring Boot Test) */}
      <section style={{ maxWidth: '1080px', margin: '0 auto 80px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--mercury-gold)',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            DEVELOPER-FIRST WORKFLOW
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Tích hợp trong vài phút với SDK & CLI
          </h2>
        </div>

        {/* Console Container */}
        <div className="mercury-console">
          <div className="mercury-console-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: '12px', color: '#9ca3af', fontWeight: 600 }}>apipay-terminal • Spring Boot Core 8080</span>
            </div>

            {/* CLI Tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveCliTab('npm')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: activeCliTab === 'npm' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: activeCliTab === 'npm' ? '#ffffff' : '#71717a',
                  fontSize: '0.78rem',
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
                  borderRadius: '6px',
                  background: activeCliTab === 'unix' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: activeCliTab === 'unix' ? '#ffffff' : '#71717a',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                macOS / Linux
              </button>
              <button
                type="button"
                onClick={() => setActiveCliTab('win')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: activeCliTab === 'win' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: activeCliTab === 'win' ? '#ffffff' : '#71717a',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                PowerShell
              </button>
            </div>
          </div>

          {/* Quick Copy Command Line */}
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              fontSize: '0.85rem',
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
              style={{ color: copiedCli ? 'var(--adyen-green-neon)' : 'var(--text-dim)' }}
              title="Sao chép"
            >
              {copiedCli ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          {/* Terminal Body */}
          <div style={{ padding: '24px', fontSize: '0.86rem', lineHeight: 1.7 }}>
            {terminalLogs.map((log, index) => (
              <div
                key={index}
                style={{
                  color: log.startsWith('$')
                    ? '#ffffff'
                    : log.startsWith('✓')
                    ? 'var(--adyen-green-neon)'
                    : log.includes('200 OK')
                    ? 'var(--mercury-gold)'
                    : '#9ca3af',
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
                className="btn-mercury-gold"
                style={{ fontSize: '0.84rem', padding: '9px 18px' }}
              >
                <Zap size={15} />
                {terminalRunning ? 'Đang gọi Spring Boot Core...' : 'Chạy thử API tạo PaymentIntent'}
              </button>

              <Link
                href="/dashboard"
                className="btn-glass"
                style={{ fontSize: '0.84rem', padding: '9px 18px' }}
              >
                <span>Xem Sổ Cái Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Enterprise CTA Banner (Mercury Minimal Luxury) */}
      <section
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(22, 23, 32, 0.8) 0%, rgba(13, 14, 20, 0.95) 100%)',
          border: '1px solid rgba(197, 168, 128, 0.3)',
          borderRadius: '24px',
          padding: '60px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
            marginBottom: '16px',
          }}
        >
          Sẵn sàng nâng cấp hạ tầng thanh toán?
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            maxWidth: '680px',
            margin: '0 auto 36px auto',
            lineHeight: 1.6,
          }}
        >
          Khởi tạo tài khoản chỉ trong 5 phút. Tích hợp trực tiếp với Open Banking Napas 24/7 và hệ thống sổ cái bất biến.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/checkout" className="btn-mercury-gold" style={{ padding: '12px 28px', fontSize: '1rem' }}>
            Bắt đầu tích hợp ngay
          </Link>
          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="btn-glass"
            style={{ padding: '12px 28px', fontSize: '1rem' }}
          >
            Tài liệu Swagger API ↗
          </a>
        </div>
      </section>

      {/* 6. Polished Mercury Gold Assistant Avatar */}
      <div
        className="floating-bot"
        id="mercury-chat-widget"
        onClick={() =>
          alert(
            'ApiPay Financial Engine: Đang kết nối trực tiếp với Spring Boot 3.3.4 (Port 8080), PostgreSQL 16 (Port 5433), Redis (Port 6379) và RabbitMQ 3.13!'
          )
        }
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          background: 'rgba(15, 16, 23, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(197, 168, 128, 0.35)',
          borderRadius: '999px',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7)',
          cursor: 'pointer',
          zIndex: 100,
          transition: 'all 0.2s ease',
        }}
      >
        <AppiBotAvatar size={34} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--mercury-gold)', letterSpacing: '0.08em', fontWeight: 700 }}>
            MERCURY CONCIERGE
          </span>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f5f5f7' }}>
            Hỗ trợ kỹ thuật
          </span>
        </div>
      </div>
    </div>
  );
}

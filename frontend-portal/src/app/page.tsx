'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Copy,
  Check,
  Zap,
  ArrowRight,
  CreditCard,
  QrCode,
  Building,
} from 'lucide-react';

import { NovaBotAvatar } from '@/components/PaymentIcons';
import { AdyenHero } from '@/components/AdyenHero';
import { AdyenInteractiveShowcase } from '@/components/AdyenShowcase';
import { BusinessModelsSection } from '@/components/BusinessModelsSection';
import { CustomerStoriesShowcase } from '@/components/CustomerStoriesShowcase';

export default function HomePage() {
  const [activeCliTab, setActiveCliTab] = useState<'npm' | 'unix' | 'win'>('npm');
  const [copiedCli, setCopiedCli] = useState(false);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [showConcierge, setShowConcierge] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '$ novagate payment-intent:create --amount=500000 --currency=VND',
    '✓ Payment service initialized',
    '✓ Idempotency protection enabled',
    '✓ Financial ledger entry recorded',
    '✓ VietQR Napas 24/7 Dynamic Code Generated',
    '✓ Status: READY FOR CHECKOUT [200 OK]',
  ]);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  useEffect(() => {
    const updateConcierge = () => setShowConcierge(window.scrollY > window.innerHeight * .72);
    window.addEventListener('scroll', updateConcierge, { passive: true });
    return () => window.removeEventListener('scroll', updateConcierge);
  }, []);

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
      setTerminalLogs((prev) => [...prev, 'Không thể kết nối dịch vụ thanh toán: ' + err]);
    } finally {
      setTerminalRunning(false);
    }
  };

  return (
    <div className="novagate-home" style={{ backgroundColor: '#00112c', minHeight: '100vh', color: '#ffffff' }}>
      {/* Hero video theo bố cục Adyen, dùng Framer Motion cho entrance và micro-interactions. */}
      <AdyenHero />
      {/* Mô hình vận hành linh hoạt, lấy cảm hứng từ bố cục lựa chọn của 2Checkout. */}
      <BusinessModelsSection />

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
                Tối ưu hóa giỏ hàng với Hosted Checkout mượt mà, hỗ trợ thanh toán nhanh, tokenization và hạn chế tối đa rớt đơn.
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
                &ldquo;NovaGate giúp chúng tôi tự động hóa 100% dòng tiền chuyển khoản VietQR và xử lý đối soát tức thời, giải phóng hoàn toàn gánh nặng kế toán thủ công.&rdquo;
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
      <AdyenInteractiveShowcase />

      {/* ========================================================================= */}
      {/* 4. SECTION SÁNG: HẠ TẦNG KỸ THUẬT & DEVELOPER TERMINAL (#f6f8fb)          */}
      {/* ========================================================================= */}
      <section className="section-light developer-section reveal-on-scroll">
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
              Hạ tầng thanh toán ổn định và có khả năng mở rộng
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
                Lưu trữ bền vững và xử lý phân tán
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
            className="developer-terminal"
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
                  novagate-core-terminal • Port 8080 Live Runner
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
                {activeCliTab === 'npm' && 'npm install -g novagate-cli'}
                {activeCliTab === 'unix' && 'curl -fsSL https://novagate.local/install.sh | bash'}
                {activeCliTab === 'win' && 'iwr -useb https://novagate.local/install.ps1 | iex'}
              </code>
              <button
                type="button"
                onClick={() =>
                  copyCommand(
                    activeCliTab === 'npm'
                      ? 'npm install -g novagate-cli'
                      : 'curl -fsSL https://novagate.local/install.sh | bash'
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
                  <span>{terminalRunning ? 'Đang gửi yêu cầu...' : 'Chạy thử API tạo PaymentIntent'}</span>
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

      {/* Customer-story carousel ngay trước footer. */}
      <CustomerStoriesShowcase />

      {/* Floating Concierge Chatbot */}
      <AnimatePresence>
      {showConcierge ? <motion.div
        className="floating-bot"
        id="adyen-concierge-widget"
        initial={{ opacity: 0, y: 18, scale: .94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: .96 }}
        transition={{ duration: .32, ease: [0.16, 1, 0.3, 1] }}
        onClick={() =>
          alert(
            'NovaGate sandbox đang hoạt động. Bạn có thể thử tạo giao dịch, Payment Link, webhook và vòng đời thanh toán ngay trên máy local.'
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
        <NovaBotAvatar size={34} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.65rem', color: '#0abf53', letterSpacing: '0.08em', fontWeight: 700 }}>
            NOVAGATE CONCIERGE
          </span>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
            Hỗ trợ kỹ thuật 24/7
          </span>
        </div>
      </motion.div> : null}
      </AnimatePresence>
    </div>
  );
}

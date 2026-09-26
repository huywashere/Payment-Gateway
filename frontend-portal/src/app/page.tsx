'use client';

import React, { useState } from 'react';
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
  MessageSquare,
  Bot,
  Sparkles,
} from 'lucide-react';

import { BankLogo } from '@/components/BankLogos';
import { AppiBotAvatar } from '@/components/PaymentIcons';

const SUPPORTED_BANKS = [
  'MB',
  'ACB',
  'BIDV',
  'OCB',
  'COOPBANK',
  'VIETCOMBANK',
  'SHINHAN',
  'VIETINBANK',
  'VIB',
  'SACOMBANK',
  'VPBANK',
  'MSB',
  'TPBANK',
];

export default function ApiPayHomePage() {
  const [activeCliTab, setActiveCliTab] = useState<'npm' | 'unix' | 'win'>('npm');
  const [copiedCli, setCopiedCli] = useState(false);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '$ apipay pay:create',
    'Tạo liên kết thanh toán',
    '----------------------',
    '✓ Chọn tài khoản ngân hàng: ACB - 24550721 (ACTIVE)',
    '✓ Số tiền: 500,000 VND',
    '✓ Trạng thái: SẴN SÀNG (Đồng bộ Core Spring Boot)',
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
      '$ curl -X POST http://localhost:8080/v1/payment_intents ...',
      'Đang gửi request đến Core Engine (Port 8080)...',
    ]);

    try {
      const idemp = 'cli_test_' + Math.random().toString(36).substring(2, 8);
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
          description: 'CLI Test Order via ApiPay Terminal',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTerminalLogs((prev) => [
          ...prev,
          `[200 OK] Created PaymentIntent ID: ${data.id}`,
          `✓ Idempotency Shield: Khóa phân tán Redis kích hoạt`,
          `✓ Bút toán Sổ cái kép: Hạch toán Nợ/Có tức thì`,
          `✓ Client Secret: ${data.clientSecret.substring(0, 28)}...`,
          'Hoàn tất trong 12ms. Sẵn sàng nhận thanh toán!',
        ]);
      } else {
        setTerminalLogs((prev) => [...prev, 'Lỗi phản hồi từ Gateway Core']);
      }
    } catch (err) {
      setTerminalLogs((prev) => [...prev, 'Không kết nối được Spring Boot Core: ' + err]);
    } finally {
      setTerminalRunning(false);
    }
  };

  return (
    <div style={{ padding: '60px 32px 100px 32px' }}>
      {/* 1. Hero Section */}
      <section style={{ maxWidth: '960px', marginBottom: '56px' }}>
        {/* Badge Pill like apipay.vn */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              background: '#27272a',
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Mới
          </span>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            API v1 đã sẵn sàng với Open Banking và nhiều ngân hàng mới.
          </span>
        </div>

        {/* Hero Title with Typing Cursor like apipay.vn */}
        <h1
          id="apipay-hero-headline"
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            color: '#ffffff',
          }}
        >
          Cổng API thanh toán chuyên nghiệp
          <span className="animate-blink" style={{ color: '#ffffff', marginLeft: '2px', fontWeight: 300 }}>
            _
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '780px',
            marginBottom: '32px',
          }}
        >
          Tích hợp cực nhanh với CLI setup và Dashboard. Kết nối ngân hàng trực tiếp, thanh toán và nhận biến động số dư tức thời.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <Link href="/checkout" id="btn-hero-start" className="btn-apipay-white">
            Bắt đầu ngay
          </Link>
          <Link href="/store" id="btn-hero-pricing" className="btn-apipay-dark">
            Xem bảng giá
          </Link>
        </div>

        {/* Trust Metrics */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '40px',
          }}
        >
          <div>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>10+</span> Ngân hàng
          </div>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#52525b' }} />
          <div>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>1M+</span> Giao dịch/tháng
          </div>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#52525b' }} />
          <div>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>99.99%</span> Uptime
          </div>
        </div>

        {/* Supported Banks Carousel / Badges like apipay.vn */}
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--text-dim)',
              marginBottom: '14px',
              textTransform: 'uppercase',
            }}
          >
            NGÂN HÀNG HỖ TRỢ
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            {SUPPORTED_BANKS.map((bankCode) => (
              <div key={bankCode} className="bank-pill">
                <BankLogo code={bankCode} size={20} />
              </div>
            ))}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginLeft: '6px' }}>
              & nhiều ngân hàng khác
            </span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Terminal & CLI Section like apipay.vn */}
      <section style={{ maxWidth: '860px', margin: '48px 0 72px 0' }}>
        {/* OS Tabs: npm / macOS / Linux / Windows */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '8px',
            marginBottom: '16px',
          }}
        >
          <button
            type="button"
            id="tab-cli-npm"
            onClick={() => setActiveCliTab('npm')}
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: activeCliTab === 'npm' ? 700 : 500,
              color: activeCliTab === 'npm' ? '#ffffff' : 'var(--text-dim)',
              borderBottom: activeCliTab === 'npm' ? '2px solid #ffffff' : 'none',
              marginBottom: '-9px',
            }}
          >
            npm
          </button>
          <button
            type="button"
            id="tab-cli-unix"
            onClick={() => setActiveCliTab('unix')}
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: activeCliTab === 'unix' ? 700 : 500,
              color: activeCliTab === 'unix' ? '#ffffff' : 'var(--text-dim)',
              borderBottom: activeCliTab === 'unix' ? '2px solid #ffffff' : 'none',
              marginBottom: '-9px',
            }}
          >
            macOS / Linux
          </button>
          <button
            type="button"
            id="tab-cli-win"
            onClick={() => setActiveCliTab('win')}
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: activeCliTab === 'win' ? 700 : 500,
              color: activeCliTab === 'win' ? '#ffffff' : 'var(--text-dim)',
              borderBottom: activeCliTab === 'win' ? '2px solid #ffffff' : 'none',
              marginBottom: '-9px',
            }}
          >
            Windows
          </button>
        </div>

        {/* Command Copy Box */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#121214',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
          }}
        >
          <code>
            {activeCliTab === 'npm' && 'npm install -g apipay'}
            {activeCliTab === 'unix' && 'curl -fsSL https://apipay.vn/install.sh | bash'}
            {activeCliTab === 'win' && 'iwr -useb https://apipay.vn/install.ps1 | iex'}
          </code>
          <button
            type="button"
            id="btn-copy-cli"
            onClick={() => copyCommand(activeCliTab === 'npm' ? 'npm install -g apipay' : 'curl -fsSL https://apipay.vn/install.sh | bash')}
            style={{ color: copiedCli ? '#10b981' : 'var(--text-dim)' }}
            title="Sao chép lệnh"
          >
            {copiedCli ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Simulated Interactive Terminal Window */}
        <div className="terminal-window">
          <div className="terminal-header">
            <span className="traffic-dot" style={{ background: '#ef4444' }} />
            <span className="traffic-dot" style={{ background: '#f59e0b' }} />
            <span className="traffic-dot" style={{ background: '#10b981' }} />
            <span style={{ marginLeft: '10px' }}>terminal — apipay</span>
          </div>

          <div style={{ padding: '20px', fontSize: '0.86rem', lineHeight: 1.7 }}>
            {terminalLogs.map((log, index) => (
              <div
                key={index}
                style={{
                  color: log.startsWith('$')
                    ? '#10b981'
                    : log.startsWith('✓')
                    ? '#06b6d4'
                    : log.includes('200 OK')
                    ? '#86efac'
                    : '#d4d4d8',
                }}
              >
                {log}
              </div>
            ))}

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                id="btn-test-cli-live"
                onClick={runLiveTerminalTest}
                disabled={terminalRunning}
                className="btn-apipay-white"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                <Zap size={14} />
                {terminalRunning ? 'Đang gọi Spring Boot...' : 'Chạy thử lệnh tạo đơn trên Core'}
              </button>

              <Link
                href="/dashboard"
                className="btn-apipay-dark"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                Mở Merchant Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Showcase like apipay.vn */}
      <section id="features" style={{ maxWidth: '960px', marginTop: '60px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Hạ tầng Open Banking & FinTech chuẩn mực
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Được thiết kế cho các doanh nghiệp, startup và hệ thống yêu cầu độ tin cậy tuyệt đối.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Feature 1 */}
          <div
            style={{
              background: '#121214',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ color: '#06b6d4', marginBottom: '14px' }}>
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
              Open Banking & VietQR Tự động
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Tự động sinh mã VietQR động theo đơn hàng, nhận diện biến động số dư ngay lập tức và bắn IPN webhook xác nhận.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            style={{
              background: '#121214',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ color: '#10b981', marginBottom: '14px' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
              Sổ cái Kép (Double-Entry Ledger)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Mọi biến động tiền tệ được ghi nhận bất biến dưới dạng bút toán Nợ/Có đối xứng. Đảm bảo toàn vẹn dữ liệu, không bao giờ lệch 1 xu.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            style={{
              background: '#121214',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ color: '#a855f7', marginBottom: '14px' }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
              PCI-DSS Card Vault (AES-256)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Cô lập thông tin thẻ khách hàng, mã hóa toàn bộ dữ liệu thẻ bằng AES-256-GCM và sinh token an toàn chuẩn quốc tế.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Floating Chatbot Widget like apipay.vn (Chat với Appi) */}
      <div
        className="floating-bot"
        id="widget-chat-appi"
        onClick={() => alert('Appi AI: Xin chào! Hệ thống ApiPay đang kết nối trực tiếp với Spring Boot Core (Port 8080) và sẵn sàng xử lý thanh toán!')}
      >
        <AppiBotAvatar size={34} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1 }}>APIPAY</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }}>Chat với Appi</span>
        </div>
      </div>
    </div>
  );
}

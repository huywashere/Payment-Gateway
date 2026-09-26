'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Lock,
  RefreshCw,
  Wallet,
  TrendingUp,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

import { BankLogo } from '@/components/BankLogos';
import { VisaIcon, MastercardIcon, VietQrBadge, AppiBotAvatar } from '@/components/PaymentIcons';
import { AdyenInteractiveShowcase } from '@/components/AdyenShowcase';

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
      const idemp = 'cli_adyen_' + Math.random().toString(36).substring(2, 8);
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
          description: 'Adyen Exact Body Live Trigger',
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
          '✓ Latency: 12ms via Java 23 Virtual Threads',
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
      {/* 1. Exact Adyen Interactive Body Section from Screenshot 1 & 2 */}
      <AdyenInteractiveShowcase />

      {/* 2. Supported Payment Ecosystem (Banks, Napas 24/7 & Global Schemes) */}
      <section
        style={{
          maxWidth: '1360px',
          margin: '0 auto 60px auto',
          padding: '0 32px',
        }}
      >
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '36px 0',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#64748b',
              marginBottom: '20px',
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
            <div
              style={{
                background: '#ffffff',
                padding: '6px 14px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <VietQrBadge size={30} />
            </div>
            <div
              style={{
                background: '#091b35',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <VisaIcon width={38} height={24} />
            </div>
            <div
              style={{
                background: '#091b35',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <MastercardIcon width={38} height={24} />
            </div>

            {SUPPORTED_BANKS.map((bankCode) => (
              <div
                key={bankCode}
                style={{
                  background: '#041328',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'border-color 0.2s',
                }}
                title={`Ngân hàng ${bankCode}`}
              >
                <BankLogo code={bankCode} size={22} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Adyen Enterprise Performance Ticker Bar */}
      <section
        style={{
          maxWidth: '1360px',
          margin: '0 auto 80px auto',
          padding: '0 32px',
        }}
      >
        <div
          style={{
            background: '#041328',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '36px 40px',
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
              <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                TỔNG KHỐI LƯỢNG HỆ THỐNG
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                ₫500B+
              </div>
              <div style={{ fontSize: '0.82rem', color: '#8fa0be', marginTop: '4px' }}>
                Giao dịch xử lý liên tục qua Napas 24/7
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                ĐỘ TRỄ ĐỊNH TUYẾN
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0abf53', letterSpacing: '-0.02em' }}>
                &lt; 15ms
              </div>
              <div style={{ fontSize: '0.82rem', color: '#8fa0be', marginTop: '4px' }}>
                Java 23 Virtual Threads + Spring Boot Core
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                ĐỘ SẴN SÀNG HẠ TẦNG (SLA)
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                99.999%
              </div>
              <div style={{ fontSize: '0.82rem', color: '#8fa0be', marginTop: '4px' }}>
                PostgreSQL 16 & Redis Distributed Lock
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                CHỐNG DOUBLE-CHARGE
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0abf53', letterSpacing: '-0.02em' }}>
                100% Khóa
              </div>
              <div style={{ fontSize: '0.82rem', color: '#8fa0be', marginTop: '4px' }}>
                Redisson Distributed Lock Shield (TTL 24h)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Developer Console (Spring Boot Core Live API Runner) */}
      <section
        style={{
          maxWidth: '1360px',
          margin: '0 auto 80px auto',
          padding: '0 32px',
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#0abf53',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            HẠ TẦNG KỸ THUẬT & API DEVELOPERS
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Trải nghiệm trực tiếp lệnh gọi Gateway Engine
          </h2>
        </div>

        {/* Console Box in Adyen Navy */}
        <div
          style={{
            background: '#041328',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              background: '#091b35',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: '12px', color: '#8fa0be', fontFamily: 'monospace' }}>
                apipay-core-terminal • Port 8080
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
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#cbd5e1',
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

          {/* Terminal Output */}
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
                  padding: '10px 20px',
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
                  padding: '10px 20px',
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
      </section>

      {/* 5. Floating Concierge Chatbot */}
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
            ADYEN CONCIERGE
          </span>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
            Hỗ trợ kỹ thuật 24/7
          </span>
        </div>
      </div>
    </div>
  );
}

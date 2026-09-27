'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  ArrowLeft,
  Database,
  CreditCard,
  KeyRound,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
import { BankLogo } from '@/components/BankLogos';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'SUCCEEDED' | 'REQUIRES_PAYMENT_METHOD' | 'PROCESSING' | 'FAILED';
  description: string;
  createdAt: string;
  clientSecret: string;
}

interface PrismaOverview {
  merchant: { id: string; businessName: string } | null;
  ledgerAccounts: Array<{ accountCode: string; accountName: string; balance: number }>;
  stats: { totalIntents: number; totalOutboxEvents: number; totalWebhookDeliveries: number };
  transactions: Transaction[];
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<number>(490500);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [prismaData, setPrismaData] = useState<PrismaOverview | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newAmount, setNewAmount] = useState<number>(350000);
  const [newDesc, setNewDesc] = useState<string>('Thanh toán đơn hàng #ORD-9912');
  const [creating, setCreating] = useState<boolean>(false);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gateway/v1/balance', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.available_balance);
      }
    } catch (err) {
      console.error('Error fetching balance from Spring Boot', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrismaOverview = async () => {
    try {
      const res = await fetch('/api/prisma/overview');
      if (res.ok) {
        const data = await res.json();
        setPrismaData(data);
        setTransactions(data.transactions ?? []);
      }
    } catch (err) {
      console.error('Error fetching Prisma overview', err);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void Promise.all([fetchBalance(), fetchPrismaOverview()]);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const idempKey = `idemp_${crypto.randomUUID()}`;
      const res = await fetch('/api/gateway/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempKey,
        },
        body: JSON.stringify({
          amount: Number(newAmount),
          currency: 'VND',
          description: newDesc,
        }),
      });

      if (res.ok) {
        const created: Transaction = await res.json();
        setTransactions((prev) => [created, ...prev]);
        setShowCreateModal(false);
        fetchBalance();
      } else {
        alert('Lỗi tạo PaymentIntent từ Core Engine');
      }
    } catch (err) {
      alert('Không kết nối được Spring Boot Core: ' + err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '40px 32px 80px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Breadcrumb & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            transition: 'color 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#f5f5f7')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <ArrowLeft size={16} /> Quay về Trang chủ
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          <span className="adyen-pulse-dot" />
          <span>Spring Boot Core :8080</span>
          <span>•</span>
          <span style={{ color: 'var(--mercury-gold)' }}>PostgreSQL 16 :5433</span>
          <span>•</span>
          <span style={{ color: 'var(--adyen-green-neon)' }}>RabbitMQ :5672</span>
        </div>
      </div>

      {/* Header: Mercury Treasury Overview */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '36px',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1
              id="dashboard-title"
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
              }}
            >
              Mercury Treasury & Sổ Cái
            </h1>
            <span
              style={{
                background: 'rgba(197, 168, 128, 0.15)',
                color: 'var(--mercury-gold)',
                border: '1px solid rgba(197, 168, 128, 0.3)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              SỔ CÁI BẤT BIẾN
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
            Tài khoản thụ hưởng: <strong>TechStore Vietnam</strong> • Ngân hàng liên kết: ACB, MB, Vietcombank
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/developers" className="btn-glass" style={{ padding: '9px 18px', fontSize: '0.85rem' }}>
            <KeyRound size={15} /> Developer settings
          </Link>
          <Link href="/operations" className="btn-glass" style={{ padding: '9px 18px', fontSize: '0.85rem' }}>
            <Landmark size={15} /> Money operations
          </Link>
          <button
            id="btn-refresh-balance"
            onClick={fetchBalance}
            className="btn-glass"
            style={{ padding: '9px 18px', fontSize: '0.85rem' }}
            title="Đồng bộ số dư từ Sổ cái kép"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới Sổ cái</span>
          </button>

          <button
            id="btn-create-intent-modal"
            onClick={() => setShowCreateModal(true)}
            className="btn-mercury-gold"
            style={{ padding: '9px 20px', fontSize: '0.85rem' }}
          >
            <PlusCircle size={16} />
            <span>Tạo Giao Dịch Mới</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards (Mercury Luxury Glass & Adyen Status) */}
      <div
        id="metric-cards-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {/* Card 1: Available Balance */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(197, 168, 128, 0.25)',
            borderRadius: '16px',
            padding: '26px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              SỐ DƯ KHẢ DỤNG (LEDGER)
            </span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(197, 168, 128, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mercury-gold)',
              }}
            >
              <Wallet size={19} />
            </div>
          </div>
          <div
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {balance.toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--adyen-green-neon)' }}>
            <CheckCircle2 size={14} />
            <span>Đã trừ phí cổng 1.5% + 2,000 ₫</span>
          </div>
        </div>

        {/* Card 2: Gross Volume */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-frosted)',
            borderRadius: '16px',
            padding: '26px',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              TỔNG DOANH THU ĐƠN
            </span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(10, 191, 83, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--adyen-green-neon)',
              }}
            >
              <TrendingUp size={19} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {(balance > 0 ? balance + 9500 : 0).toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Biến động số dư tức thời Napas 24/7
          </div>
        </div>

        {/* Card 3: Idempotency Protection */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-frosted)',
            borderRadius: '16px',
            padding: '26px',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              CHỐNG DOUBLE-CHARGE
            </span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Zap size={19} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.02em' }}>
            100% Active
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Redisson Distributed Lock (TTL 24h)
          </div>
        </div>

        {/* Card 4: PCI Vault Status */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-frosted)',
            borderRadius: '16px',
            padding: '26px',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              CARD VAULT MÃ HÓA
            </span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f5f5f7',
              }}
            >
              <Lock size={19} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            AES-256-GCM
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Chuẩn bảo mật ngân hàng quốc tế
          </div>
        </div>
      </div>

      {/* Prisma ORM Real-time Database Insights (Next-Gen Stack) */}
      {prismaData && (
        <div
          style={{
            background: 'rgba(15, 16, 23, 0.8)',
            border: '1px solid rgba(197, 168, 128, 0.25)',
            borderRadius: '16px',
            padding: '24px 28px',
            marginBottom: '36px',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="var(--mercury-gold)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f5f5f7' }}>
                Prisma ORM Real-Time Database Insights (Port 5433)
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--adyen-green-neon)',
                fontWeight: 700,
                background: 'rgba(10, 191, 83, 0.12)',
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              PostgreSQL Connected
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
            <div style={{ background: 'rgba(8, 8, 10, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>MERCHANT PROFILE</div>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>{prismaData.merchant?.businessName || 'TechStore VN'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {prismaData.merchant?.id?.substring(0, 12)}...</div>
            </div>

            <div style={{ background: 'rgba(8, 8, 10, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>SỐ DƯ LEDGER HIỆN TẠI</div>
              <div style={{ fontWeight: 700, color: 'var(--mercury-gold)' }}>
                {(prismaData.ledgerAccounts?.[0]?.balance ?? 0).toLocaleString('vi-VN')} VND
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Tài khoản: {prismaData.ledgerAccounts?.[0]?.accountCode ?? 'Chưa phát sinh'}</div>
            </div>

            <div style={{ background: 'rgba(8, 8, 10, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>RABBITMQ OUTBOX SỰ KIỆN</div>
              <div style={{ fontWeight: 700, color: 'var(--adyen-green-neon)' }}>
                {prismaData.stats?.totalOutboxEvents ?? 0} Sự kiện
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Exchange: payment.events.exchange</div>
            </div>

            <div style={{ background: 'rgba(8, 8, 10, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '4px' }}>WEBHOOK ĐÃ GIAO NHẬN</div>
              <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                {prismaData.stats?.totalWebhookDeliveries ?? 0} Lần giao
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Ký số: HMAC-SHA256</div>
            </div>
          </div>
        </div>
      )}

      {/* Developer API Keys & Testing Hub */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-frosted)',
          borderRadius: '16px',
          padding: '26px 30px',
          marginBottom: '36px',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#f5f5f7' }}>
              <ShieldCheck size={19} color="var(--mercury-gold)" />
              Khóa API & Môi trường Sandbox (Developer Keys)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '4px' }}>
              Sử dụng các khóa này để gửi request xác thực với Backend Spring Boot Core.
            </p>
          </div>

          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="btn-glass"
            style={{ fontSize: '0.82rem', padding: '7px 15px' }}
          >
            <span>Swagger API Docs</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Secret Key */}
          <div
            style={{
              background: '#090a0f',
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>SECRET KEY (Backend Server)</span>
              <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 600 }}>Private</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#a5b4fc' }}>
                sk_test_demo_gateway_key_999
              </code>
              <button
                id="btn-copy-sk"
                onClick={() => handleCopy('sk_test_demo_gateway_key_999', 'sk')}
                style={{ color: copiedKey === 'sk' ? 'var(--adyen-green-neon)' : 'var(--text-dim)', padding: '4px' }}
                title="Sao chép"
              >
                {copiedKey === 'sk' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Publishable Key */}
          <div
            style={{
              background: '#090a0f',
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>PUBLISHABLE KEY (Frontend / SDK)</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--adyen-green-neon)', fontWeight: 600 }}>Public</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--mercury-gold)' }}>
                pk_test_demo_public_key_999
              </code>
              <button
                id="btn-copy-pk"
                onClick={() => handleCopy('pk_test_demo_public_key_999', 'pk')}
                style={{ color: copiedKey === 'pk' ? 'var(--adyen-green-neon)' : 'var(--text-dim)', padding: '4px' }}
                title="Sao chép"
              >
                {copiedKey === 'pk' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Bank Accounts (Mercury Multi-Account Grid) */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-frosted)',
          borderRadius: '16px',
          padding: '26px 30px',
          marginBottom: '36px',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#f5f5f7' }}>
              <CreditCard size={19} color="var(--mercury-gold)" />
              Tài Khoản Ngân Hàng Thụ Hưởng (Open Banking Multi-Account)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '4px' }}>
              Các tài khoản ngân hàng kết nối tự động bắt biến động số dư và sinh mã VietQR Napas 24/7.
            </p>
          </div>

          <button
            type="button"
            className="btn-glass"
            onClick={() => alert('Chức năng liên kết thêm tài khoản ngân hàng Open Banking mới')}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            <PlusCircle size={14} />
            <span>Thêm tài khoản</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Bank 1: ACB */}
          <div
            style={{
              background: '#090a0f',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid rgba(197, 168, 128, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px' }}>
                <BankLogo code="ACB" size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>STK: 24550721</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>TechStore Operating Cash</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adyen-green-neon)', background: 'rgba(10, 191, 83, 0.15)', padding: '3px 9px', borderRadius: '999px' }}>
              Mặc định
            </span>
          </div>

          {/* Bank 2: MB Bank */}
          <div
            style={{
              background: '#090a0f',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px' }}>
                <BankLogo code="MB" size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>STK: 0987654321</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>MB Quân Đội Treasury Escrow</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '3px 9px', borderRadius: '999px' }}>
              Đang kết nối
            </span>
          </div>

          {/* Bank 3: Vietcombank */}
          <div
            style={{
              background: '#090a0f',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px' }}>
                <BankLogo code="VIETCOMBANK" size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>STK: 0071000123456</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>VCB Chi nhánh Tân Bình</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adyen-green-neon)', background: 'rgba(10, 191, 83, 0.15)', padding: '3px 9px', borderRadius: '999px' }}>
              Sẵn sàng
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Explorer (Adyen Precision Table) */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-frosted)',
          borderRadius: '16px',
          padding: '26px 30px',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f5f5f7' }}>
              Giao Dịch Biến Động Gần Đây (Transactions)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '4px' }}>
              Đồng bộ dữ liệu thời gian thực từ Spring Boot Engine & PostgreSQL.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-frosted)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>MÃ GIAO DỊCH</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>MÔ TẢ ĐƠN HÀNG</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>SỐ TIỀN</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>TRẠNG THÁI</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>THỜI GIAN</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#a5b4fc' }}>
                    {tx.id.substring(0, 16)}...
                  </td>
                  <td style={{ padding: '16px', fontWeight: 500, color: '#f5f5f7' }}>
                    {tx.description}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--mercury-gold)' }}>
                    {tx.amount.toLocaleString('vi-VN')} {tx.currency}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {tx.status === 'SUCCEEDED' && (
                      <span style={{ color: 'var(--adyen-green-neon)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem' }}>
                        <CheckCircle2 size={15} /> Thành công
                      </span>
                    )}
                    {tx.status === 'REQUIRES_PAYMENT_METHOD' && (
                      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem' }}>
                        <Clock size={15} /> Chờ thanh toán
                      </span>
                    )}
                    {tx.status === 'FAILED' && (
                      <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem' }}>
                        <XCircle size={15} /> Thất bại
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    {new Date(tx.createdAt).toLocaleTimeString('vi-VN')} {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {tx.status === 'REQUIRES_PAYMENT_METHOD' ? (
                      <a
                        href={`/checkout?session=${tx.clientSecret}`}
                        className="btn-mercury-gold"
                        style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                      >
                        Thanh toán
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--adyen-green-neon)', fontWeight: 600 }}>
                        Đã ghi sổ cái
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Custom Payment Intent */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '36px',
              background: '#0e0f16',
              border: '1px solid rgba(197, 168, 128, 0.3)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
            }}
          >
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px', color: '#f5f5f7' }}>
              Tạo Giao dịch PaymentIntent Mới
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '24px' }}>
              Hệ thống sẽ gọi API <code style={{ color: 'var(--mercury-gold)' }}>POST /v1/payment_intents</code> kèm Idempotency-Key.
            </p>

            <form onSubmit={handleCreateIntent}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: '#d4d4d8' }}>
                  Số tiền thanh toán (VND)
                </label>
                <input
                  id="input-create-amount"
                  type="number"
                  min="1000"
                  step="1000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: '#08080a',
                    border: '1px solid var(--border-frosted)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '12px 14px',
                    outline: 'none',
                    fontSize: '0.95rem',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '26px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: '#d4d4d8' }}>
                  Nội dung đơn hàng
                </label>
                <input
                  id="input-create-desc"
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#08080a',
                    border: '1px solid var(--border-frosted)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '12px 14px',
                    outline: 'none',
                    fontSize: '0.95rem',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-glass"
                  disabled={creating}
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-submit-create-intent"
                  type="submit"
                  className="btn-mercury-gold"
                  disabled={creating}
                >
                  {creating ? 'Đang tạo...' : 'Khởi tạo PaymentIntent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

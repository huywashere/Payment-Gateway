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

export default function DashboardPage() {
  const [balance, setBalance] = useState<number>(490500);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '07929bbd-442c-40ff-a861-19b65d9a6c10',
      amount: 500000,
      currency: 'VND',
      status: 'SUCCEEDED',
      description: 'Đơn hàng giày sneaker #8821',
      createdAt: new Date().toISOString(),
      clientSecret: 'pi_c575898f00df47f8b71ce7373419c662_secret_5a4d86f9af6347a3',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newAmount, setNewAmount] = useState<number>(350000);
  const [newDesc, setNewDesc] = useState<string>('Thanh toán đơn hàng #ORD-9912');
  const [creating, setCreating] = useState<boolean>(false);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/v1/balance', {
        headers: {
          Authorization: 'Bearer sk_test_demo_gateway_key_999',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.available_balance);
      }
    } catch (err) {
      console.error('Error connecting to backend balance API', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
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
      const idempKey = 'idemp_' + Math.random().toString(36).substring(2, 10);
      const res = await fetch('http://localhost:8080/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk_test_demo_gateway_key_999',
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
    <div style={{ padding: '36px 28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} /> Quay về Trang chủ ApiPay
        </Link>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              id="dashboard-merchant-title"
              style={{
                fontSize: '1.85rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              ApiPay Merchant Dashboard
            </h1>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              Open Banking Active
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Tài khoản liên kết: TechStore Vietnam • Ngân hàng: ACB, MB, Vietcombank
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            id="btn-refresh-balance"
            onClick={fetchBalance}
            className="btn-apipay-dark"
            title="Đồng bộ số dư từ Sổ cái kép"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới Sổ cái
          </button>

          <button
            id="btn-create-intent-modal"
            onClick={() => setShowCreateModal(true)}
            className="btn-apipay-white"
          >
            <PlusCircle size={18} />
            Tạo Giao dịch mới
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div
        id="metric-cards-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Card 1: Available Balance */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              SỐ DƯ KHẢ DỤNG (LEDGER)
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {balance.toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.8rem', color: '#10b981' }}>
            <CheckCircle2 size={14} />
            <span>Đã trừ phí sàn 1.5% + 2,000 ₫</span>
          </div>
        </div>

        {/* Card 2: Gross Volume */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              DOANH THU QUA CỔNG
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {(balance > 0 ? balance + 9500 : 0).toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Biến động số dư tức thời
          </div>
        </div>

        {/* Card 3: Idempotency Protection */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              CHỐNG DOUBLE-CHARGE
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06b6d4',
              }}
            >
              <Zap size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#06b6d4', letterSpacing: '-0.02em' }}>
            100% Active
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Redisson Distributed Lock (TTL 24h)
          </div>
        </div>

        {/* Card 4: PCI Vault Status */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              CARD VAULT MÃ HÓA
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Lock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
            AES-256-GCM
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Chuẩn bảo mật ngân hàng
          </div>
        </div>
      </div>

      {/* Developer API Keys & Testing Hub */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px 28px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
              <ShieldCheck size={18} color="#10b981" />
              Khóa API & Môi trường Sandbox (Developer Keys)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Sử dụng các khóa này để gửi request xác thực với Backend Spring Boot.
            </p>
          </div>

          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="btn-apipay-dark"
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            <span>Swagger API Docs</span>
            <ExternalLink size={14} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Secret Key */}
          <div
            style={{
              background: '#09090b',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SECRET KEY (Dành cho Server Backend)</span>
              <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 600 }}>Private</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#a5b4fc' }}>
                sk_test_demo_gateway_key_999
              </code>
              <button
                id="btn-copy-sk"
                onClick={() => handleCopy('sk_test_demo_gateway_key_999', 'sk')}
                style={{ color: copiedKey === 'sk' ? '#10b981' : '#71717a', padding: '4px' }}
                title="Sao chép Secret Key"
              >
                {copiedKey === 'sk' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Publishable Key */}
          <div
            style={{
              background: '#09090b',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PUBLISHABLE KEY (Dành cho Frontend / SDK)</span>
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Public</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#86efac' }}>
                pk_test_demo_public_key_999
              </code>
              <button
                id="btn-copy-pk"
                onClick={() => handleCopy('pk_test_demo_public_key_999', 'pk')}
                style={{ color: copiedKey === 'pk' ? '#10b981' : '#71717a', padding: '4px' }}
                title="Sao chép Publishable Key"
              >
                {copiedKey === 'pk' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Bank Accounts (Open Banking / Napas 247) */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px 28px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
              <TrendingUp size={18} color="#38bdf8" />
              Tài Khoản Ngân Hàng Thụ Hưởng (Open Banking Link)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Các tài khoản ngân hàng kết nối tự động bắt biến động số dư và sinh mã VietQR.
            </p>
          </div>

          <button
            type="button"
            className="btn-apipay-dark"
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
              background: '#09090b',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '8px' }}>
                <BankLogo code="ACB" size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>STK: 24550721</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>TechStore Main Account</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '999px' }}>
              Mặc định
            </span>
          </div>

          {/* Bank 2: MB Bank */}
          <div
            style={{
              background: '#09090b',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '8px' }}>
                <BankLogo code="MB" size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>STK: 0987654321</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>MB Quân Đội Backup</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '999px' }}>
              Đang kết nối
            </span>
          </div>

          {/* Bank 3: Vietcombank */}
          <div
            style={{
              background: '#09090b',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '8px' }}>
                <BankLogo code="VIETCOMBANK" size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>STK: 0071000123456</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>VCB Chi nhánh Tân Bình</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '999px' }}>
              Sẵn sàng
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Explorer */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Giao dịch biến động gần đây (Transactions)</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Đồng bộ dữ liệu thời gian thực từ Spring Boot Engine & PostgreSQL.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
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
                  <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#a5b4fc' }}>
                    {tx.id.substring(0, 16)}...
                  </td>
                  <td style={{ padding: '16px', fontWeight: 500, color: '#ffffff' }}>
                    {tx.description}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#ffffff' }}>
                    {tx.amount.toLocaleString('vi-VN')} {tx.currency}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {tx.status === 'SUCCEEDED' && (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                        <CheckCircle2 size={14} /> Thành công
                      </span>
                    )}
                    {tx.status === 'REQUIRES_PAYMENT_METHOD' && (
                      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                        <Clock size={14} /> Chờ thanh toán
                      </span>
                    )}
                    {tx.status === 'FAILED' && (
                      <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                        <XCircle size={14} /> Thất bại
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {new Date(tx.createdAt).toLocaleTimeString('vi-VN')} {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {tx.status === 'REQUIRES_PAYMENT_METHOD' ? (
                      <a
                        href={`/checkout?session=${tx.clientSecret}`}
                        className="btn-apipay-white"
                        style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                      >
                        Thanh toán
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
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
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
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
              padding: '32px',
              background: '#121214',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
              Tạo Giao dịch PaymentIntent Mới
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Hệ thống sẽ gọi API <code style={{ color: '#a5b4fc' }}>POST /v1/payment_intents</code> kèm Idempotency-Key.
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
                    background: '#09090b',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '10px 14px',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
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
                    background: '#09090b',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '10px 14px',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-apipay-dark"
                  disabled={creating}
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-submit-create-intent"
                  type="submit"
                  className="btn-apipay-white"
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

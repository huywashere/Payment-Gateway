'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { VisaIcon, MastercardIcon, VietQrBadge } from '@/components/PaymentIcons';
import { BankLogo } from '@/components/BankLogos';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const session = searchParams.get('session') || 'pi_c575898f00df47f8b71ce7373419c662_secret_5a4d86f9af6347a3';

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'vietqr'>('vietqr');
  const [amount, setAmount] = useState<number>(500000);
  const [description, setDescription] = useState<string>('Đơn hàng giày sneaker #8821');
  const [selectedBank, setSelectedBank] = useState<string>('ACB');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [holderName, setHolderName] = useState<string>('NGUYEN VAN A');
  const [expDate, setExpDate] = useState<string>('12/28');
  const [cvc, setCvc] = useState<string>('123');

  // Processing States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    if (session) {
      fetch(`/api/gateway/v1/checkout/${encodeURIComponent(session)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.amount) {
            setAmount(data.amount);
            if (data.description) setDescription(data.description);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handleQuickFill = (cardType: 'success' | 'insufficient' | 'declined') => {
    setErrorMessage(null);
    if (cardType === 'success') {
      setCardNumber('4242 4242 4242 4242');
      setHolderName('NGUYEN VAN A');
      setExpDate('12/28');
      setCvc('123');
    } else if (cardType === 'insufficient') {
      setCardNumber('4000 0000 0000 0002');
      setHolderName('LE VAN B (INSUFFICIENT)');
      setExpDate('08/27');
      setCvc('456');
    } else if (cardType === 'declined') {
      setCardNumber('4000 0000 0000 0005');
      setHolderName('TRAN VAN C (DECLINED)');
      setExpDate('05/26');
      setCvc('789');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    const parts = expDate.split('/');
    const expM = parts[0] ? parseInt(parts[0], 10) : 12;
    const expY = parts[1] ? 2000 + parseInt(parts[1], 10) : 2028;

    try {
      const res = await fetch(`/api/gateway/v1/checkout/${encodeURIComponent(session)}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: cardNumber.replace(/\s+/g, ''),
          holderName: holderName,
          expMonth: expM,
          expYear: expY,
          cvc: cvc,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'SUCCEEDED') {
        setPaymentSuccess(true);
      } else {
        setErrorMessage(data.failureMessage || data.error?.message || 'Giao dịch bị từ chối');
      }
    } catch (err) {
      setErrorMessage('Không kết nối được Spring Boot Core: ' + err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* Top back link */}
      <div style={{ marginBottom: '28px' }}>
        <Link
          href="/dashboard"
          id="link-back-dashboard"
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
          <ArrowLeft size={16} /> Quay lại Merchant Dashboard
        </Link>
      </div>

      {paymentSuccess ? (
        <div
          style={{
            maxWidth: '580px',
            margin: '40px auto',
            padding: '48px 40px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(14, 15, 22, 0.95) 100%)',
            border: '1px solid rgba(10, 191, 83, 0.4)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'rgba(10, 191, 83, 0.15)',
              color: 'var(--adyen-green-neon)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 30px rgba(10, 191, 83, 0.3)',
            }}
          >
            <CheckCircle2 size={44} />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f5f5f7', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Thanh Toán Thành Công!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px' }}>
            Giao dịch đã được hạch toán an toàn vào Sổ Cái Kép và sinh sự kiện Outbox qua RabbitMQ.
          </p>

          <div
            style={{
              background: 'rgba(8, 8, 10, 0.7)',
              padding: '22px',
              borderRadius: '16px',
              marginBottom: '32px',
              textAlign: 'left',
              border: '1px solid var(--border-frosted)',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Số tiền thanh toán:</span>
              <span style={{ fontWeight: 800, color: 'var(--mercury-gold)' }}>{amount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Phương thức:</span>
              <span style={{ fontWeight: 600, color: '#f5f5f7' }}>
                {paymentMethod === 'card' ? 'Thẻ Quốc tế (Mã hóa PCI Vault)' : 'VietQR Napas 24/7'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Hạch toán Sổ cái:</span>
              <span style={{ color: 'var(--adyen-green-neon)', fontWeight: 600 }}>Tự động ghi Nợ/Có tức thì</span>
            </div>
          </div>

          <Link href="/dashboard" className="btn-mercury-gold" style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}>
            Về Merchant Dashboard xem Số dư mới
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '32px',
          }}
        >
          {/* Left Column: Order Summary & Quick Test Card Badges */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-frosted)',
              borderRadius: '20px',
              padding: '36px',
              height: 'fit-content',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--adyen-green-neon)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '20px' }}>
              <ShieldCheck size={16} />
              <span>ADYEN UNIFIED COMMERCE SECURED</span>
            </div>

            <span style={{ fontSize: '0.86rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              SỐ TIỀN CẦN THANH TOÁN
            </span>
            <div
              style={{
                fontSize: '2.6rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: '6px 0 16px 0',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {amount.toLocaleString('vi-VN')} ₫
            </div>

            <div style={{ borderTop: '1px solid var(--border-frosted)', paddingTop: '20px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Đơn hàng</span>
                <span style={{ fontWeight: 600, color: '#f5f5f7' }}>{description}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Doanh nghiệp</span>
                <span style={{ fontWeight: 600, color: '#f5f5f7' }}>TechStore Vietnam Corp</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Tiêu chuẩn</span>
                <span style={{ fontWeight: 600, color: 'var(--mercury-gold)' }}>PCI-DSS Level 1 & AES-256</span>
              </div>
            </div>

            {/* Quick Test Cards Palette (Adyen Sandbox Presets) */}
            <div
              style={{
                marginTop: '32px',
                padding: '20px',
                background: 'rgba(15, 16, 23, 0.85)',
                borderRadius: '14px',
                border: '1px solid rgba(197, 168, 128, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--mercury-gold)', marginBottom: '12px' }}>
                <Sparkles size={14} />
                <span>BẢNG THẺ TEST NHANH (1-CLICK FILL)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  id="btn-test-card-success"
                  onClick={() => handleQuickFill('success')}
                  style={{
                    background: 'rgba(10, 191, 83, 0.12)',
                    color: 'var(--adyen-green-neon)',
                    border: '1px solid rgba(10, 191, 83, 0.3)',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  🟢 Thẻ Thành công (4242 4242...)
                </button>
                <button
                  type="button"
                  id="btn-test-card-insufficient"
                  onClick={() => handleQuickFill('insufficient')}
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    color: '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  🔴 Thẻ Hết tiền (4000...0002)
                </button>
                <button
                  type="button"
                  id="btn-test-card-declined"
                  onClick={() => handleQuickFill('declined')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  ⛔ Thẻ Bị khóa (4000...0005)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Form (Adyen Sleek Experience) */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-frosted)',
              borderRadius: '20px',
              padding: '36px',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Payment Method Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: '#090a0f',
                padding: '5px',
                borderRadius: '12px',
                marginBottom: '26px',
                border: '1px solid var(--border-frosted)',
              }}
            >
              <button
                type="button"
                id="tab-method-vietqr"
                onClick={() => setPaymentMethod('vietqr')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: paymentMethod === 'vietqr' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: paymentMethod === 'vietqr' ? '1px solid rgba(197, 168, 128, 0.3)' : '1px solid transparent',
                  color: paymentMethod === 'vietqr' ? '#ffffff' : 'var(--text-dim)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <VietQrBadge size={22} />
              </button>

              <button
                type="button"
                id="tab-method-card"
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: paymentMethod === 'card' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: paymentMethod === 'card' ? '1px solid rgba(197, 168, 128, 0.3)' : '1px solid transparent',
                  color: paymentMethod === 'card' ? '#ffffff' : 'var(--text-dim)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <VisaIcon width={32} height={20} />
                <MastercardIcon width={32} height={20} />
              </button>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fda4af',
                  fontSize: '0.88rem',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {paymentMethod === 'card' ? (
              <form onSubmit={handlePay}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '8px', color: '#d4d4d8' }}>
                    Số thẻ tín dụng / ghi nợ
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="input-card-number"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      style={{
                        width: '100%',
                        background: '#090a0f',
                        border: '1px solid var(--border-frosted)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        padding: '12px 14px',
                        paddingRight: '80px',
                        outline: 'none',
                        fontSize: '0.95rem',
                      }}
                      required
                    />
                    <div style={{ position: 'absolute', right: '12px', top: '12px', display: 'flex', gap: '6px' }}>
                      <VisaIcon width={30} height={18} />
                      <MastercardIcon width={30} height={18} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '8px', color: '#d4d4d8' }}>
                      Hạn thẻ (MM/YY)
                    </label>
                    <input
                      id="input-card-exp"
                      type="text"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      placeholder="12/28"
                      style={{
                        width: '100%',
                        background: '#090a0f',
                        border: '1px solid var(--border-frosted)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        padding: '12px 14px',
                        outline: 'none',
                        fontSize: '0.95rem',
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '8px', color: '#d4d4d8' }}>
                      CVC / CVV
                    </label>
                    <input
                      id="input-card-cvc"
                      type="password"
                      maxLength={4}
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      placeholder="•••"
                      style={{
                        width: '100%',
                        background: '#090a0f',
                        border: '1px solid var(--border-frosted)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        padding: '12px 14px',
                        outline: 'none',
                        fontSize: '0.95rem',
                      }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '8px', color: '#d4d4d8' }}>
                    Tên chủ thẻ
                  </label>
                  <input
                    id="input-card-holder"
                    type="text"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="NGUYEN VAN A"
                    style={{
                      width: '100%',
                      background: '#090a0f',
                      border: '1px solid var(--border-frosted)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      padding: '12px 14px',
                      outline: 'none',
                      fontSize: '0.95rem',
                    }}
                    required
                  />
                </div>

                <button
                  id="btn-submit-payment"
                  type="submit"
                  className="btn-mercury-gold"
                  style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                  disabled={isProcessing}
                >
                  <Lock size={18} />
                  {isProcessing ? 'Đang gọi Spring Boot Engine...' : `Thanh toán ngay ${amount.toLocaleString('vi-VN')} ₫`}
                </button>
              </form>
            ) : (
              /* Enhanced VietQR Experience */
              <div>
                {/* Bank Selector Pills */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                    CHỌN NGÂN HÀNG THỤ HƯỞNG (OPEN BANKING):
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['ACB', 'MB', 'BIDV', 'VIETCOMBANK'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        style={{
                          background: selectedBank === b ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                          border: selectedBank === b ? '2px solid var(--mercury-gold)' : '1px solid var(--border-frosted)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transform: selectedBank === b ? 'scale(1.03)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <BankLogo code={b} size={18} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* QR Display Card */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '24px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <VietQrBadge size={28} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                      <Clock size={14} color="#f59e0b" />
                      <span>Hết hạn trong 14:59</span>
                    </div>
                  </div>

                  <Image
                    id="img-vietqr-code"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=247PAY_${selectedBank}_${amount}_APIPAY8821`}
                    alt="VietQR Code"
                    width={200}
                    height={200}
                    style={{ width: '200px', height: '200px', margin: '0 auto', display: 'block', borderRadius: '8px' }}
                  />

                  <p style={{ color: '#475569', fontSize: '0.84rem', marginTop: '12px', fontWeight: 500 }}>
                    Mở App Ngân hàng bất kỳ & quét mã VietQR tự động điền số tiền
                  </p>
                </div>

                {/* Transfer Info with Copy Buttons */}
                <div
                  style={{
                    background: '#090a0f',
                    border: '1px solid var(--border-frosted)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    fontSize: '0.85rem',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Số tài khoản ({selectedBank}):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('24550721', 'acc')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#f8fafc',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      24550721
                      {copiedField === 'acc' ? <Check size={14} color="var(--adyen-green-neon)" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Số tiền:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(amount.toString(), 'amount')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--mercury-gold)',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {amount.toLocaleString('vi-VN')} ₫
                      {copiedField === 'amount' ? <Check size={14} color="var(--adyen-green-neon)" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Nội dung chuyển khoản:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('APIPAY ORD8821', 'memo')}
                      style={{
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        color: '#fbbf24',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      APIPAY ORD8821
                      {copiedField === 'memo' ? <Check size={14} color="var(--adyen-green-neon)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Simulate Bank Webhook Auto-confirm */}
                <button
                  type="button"
                  id="btn-simulate-webhook"
                  onClick={() => {
                    setIsProcessing(true);
                    setTimeout(() => {
                      setIsProcessing(false);
                      setPaymentSuccess(true);
                    }, 1000);
                  }}
                  className="btn-adyen-green"
                  style={{ width: '100%', padding: '15px', fontSize: '0.95rem' }}
                >
                  <Sparkles size={16} />
                  {isProcessing ? 'Đang nhận diện biến động số dư...' : '⚡ Giả lập Bank Webhook Báo Có'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Đang tải Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

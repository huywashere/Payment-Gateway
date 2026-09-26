'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  QrCode,
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

  // Load session from backend if valid clientSecret
  useEffect(() => {
    if (session) {
      fetch(`http://localhost:8080/v1/checkout/${session}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.amount) {
            setAmount(data.amount);
            if (data.description) setDescription(data.description);
          }
        })
        .catch(() => {
          // Use default demo amount if offline
        });
    }
  }, [session]);

  const handleQuickFill = (cardType: 'success' | 'insufficient' | 'declined' | '3ds') => {
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
    } else if (cardType === '3ds') {
      setCardNumber('4000 0000 0000 3000');
      setHolderName('HOANG VAN D (3D-SECURE)');
      setExpDate('11/29');
      setCvc('321');
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
      const res = await fetch(`http://localhost:8080/v1/checkout/${session}/pay`, {
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
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Top back link */}
      <div style={{ marginBottom: '28px' }}>
        <Link
          href="/"
          id="link-back-dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            transition: 'color 0.2s ease',
          }}
        >
          <ArrowLeft size={16} /> Quay lại Merchant Dashboard
        </Link>
      </div>

      {paymentSuccess ? (
        <div
          className="glass-card animate-fade-in"
          style={{
            maxWidth: '560px',
            margin: '40px auto',
            padding: '48px 36px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
            }}
          >
            <CheckCircle2 size={42} />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
            Thanh toán Thành công!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px' }}>
            Giao dịch đã được xác thực an toàn qua Mock Bank và tự động hạch toán vào Sổ cái kép.
          </p>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '32px',
              textAlign: 'left',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Số tiền:</span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>{amount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Phương thức:</span>
              <span style={{ fontWeight: 600, color: '#a5b4fc' }}>VISA (Đã Tokenize qua Vault)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Bút toán Sổ cái:</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Tự động ghi Nợ/Có đối xứng</span>
            </div>
          </div>

          <Link href="/" className="btn-primary" style={{ width: '100%' }}>
            Về Dashboard xem số dư mới
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
          {/* Left Column: Order Summary */}
          <div className="glass-card" style={{ padding: '36px', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.82rem', fontWeight: 700, marginBottom: '20px' }}>
              <ShieldCheck size={16} />
              CỔNG THANH TOÁN BẢO MẬT 256-BIT
            </div>

            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Số tiền cần thanh toán</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '4px 0 16px 0', color: '#ffffff' }}>
              {amount.toLocaleString('vi-VN')} ₫
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Đơn hàng</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>{description}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Người bán</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>TechStore Vietnam</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Tiêu chuẩn</span>
                <span style={{ fontWeight: 600, color: '#a5b4fc' }}>PCI-DSS Level 1 Encrypted</span>
              </div>
            </div>

            {/* Quick Test Cards Palette */}
            <div
              style={{
                marginTop: '32px',
                padding: '18px',
                background: 'rgba(99, 102, 241, 0.08)',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '12px' }}>
                <Sparkles size={14} />
                BẢNG THẺ TEST NHANH (1-CLICK)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  id="btn-test-card-success"
                  onClick={() => handleQuickFill('success')}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  🟢 Thẻ Thành công (4242 4242...)
                </button>
                <button
                  type="button"
                  id="btn-test-card-insufficient"
                  onClick={() => handleQuickFill('insufficient')}
                  style={{
                    background: 'rgba(244, 63, 94, 0.12)',
                    color: '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  🔴 Thẻ Hết tiền (4000...0002)
                </button>
                <button
                  type="button"
                  id="btn-test-card-declined"
                  onClick={() => handleQuickFill('declined')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  ⛔ Thẻ Bị khóa (4000...0005)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Form */}
          <div className="glass-card" style={{ padding: '36px' }}>
            {/* Payment Method Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                id="tab-method-vietqr"
                onClick={() => setPaymentMethod('vietqr')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: paymentMethod === 'vietqr' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: paymentMethod === 'vietqr' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  color: paymentMethod === 'vietqr' ? '#ffffff' : 'var(--text-muted)',
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
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: paymentMethod === 'card' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: paymentMethod === 'card' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  color: paymentMethod === 'card' ? '#ffffff' : 'var(--text-muted)',
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
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(244, 63, 94, 0.15)',
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: '#cbd5e1' }}>
                    Số thẻ tín dụng / ghi nợ
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="input-card-number"
                      type="text"
                      className="input-field"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      style={{ paddingRight: '80px' }}
                      required
                    />
                    <div style={{ position: 'absolute', right: '12px', top: '10px', display: 'flex', gap: '6px' }}>
                      <VisaIcon width={30} height={18} />
                      <MastercardIcon width={30} height={18} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: '#cbd5e1' }}>
                      Hạn thẻ (MM/YY)
                    </label>
                    <input
                      id="input-card-exp"
                      type="text"
                      className="input-field"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      placeholder="12/28"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: '#cbd5e1' }}>
                      CVC / CVV
                    </label>
                    <input
                      id="input-card-cvc"
                      type="password"
                      maxLength={4}
                      className="input-field"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      placeholder="•••"
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: '#cbd5e1' }}>
                    Tên in trên thẻ
                  </label>
                  <input
                    id="input-card-holder"
                    type="text"
                    className="input-field"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="NGUYEN VAN A"
                    required
                  />
                </div>

                <button
                  id="btn-submit-payment"
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}
                  disabled={isProcessing}
                >
                  <Lock size={18} />
                  {isProcessing ? 'Đang xác thực qua Mock Bank...' : `Thanh toán ngay ${amount.toLocaleString('vi-VN')} ₫`}
                </button>
              </form>
            ) : (
              /* Enhanced VietQR Experience */
              <div>
                {/* Bank Selector Pills */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    CHỌN NGÂN HÀNG THỤ HƯỞNG:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['ACB', 'MB', 'BIDV', 'VIETCOMBANK'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        style={{
                          background: selectedBank === b ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                          border: selectedBank === b ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.15)',
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
                    padding: '20px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <VietQrBadge size={28} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                      <Clock size={14} color="#f59e0b" />
                      <span>Hết hạn trong 14:59</span>
                    </div>
                  </div>

                  <img
                    id="img-vietqr-code"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=247PAY_${selectedBank}_${amount}_APIPAY8821`}
                    alt="VietQR Code"
                    style={{ width: '200px', height: '200px', margin: '0 auto', display: 'block', borderRadius: '8px' }}
                  />

                  <p style={{ color: '#475569', fontSize: '0.82rem', marginTop: '10px', fontWeight: 500 }}>
                    Mở App Ngân hàng bất kỳ & quét mã VietQR tự động điền số tiền
                  </p>
                </div>

                {/* Transfer Info with Copy Buttons */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '0.85rem',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Số tài khoản ({selectedBank}):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('24550721', 'acc')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
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
                      {copiedField === 'acc' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Số tiền:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(amount.toString(), 'amount')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: '#38bdf8',
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
                      {copiedField === 'amount' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
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
                      {copiedField === 'memo' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
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
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
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

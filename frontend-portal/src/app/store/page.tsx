'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  rating: number;
  badge: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'prod-headphones',
    name: 'Sony WH-1000XM5 Noise Canceling',
    price: 7990000,
    description: 'Tai nghe chống ồn không dây hàng đầu với 8 micro và bộ xử lý âm thanh V1 kép.',
    rating: 4.9,
    badge: 'Bán chạy nhất',
  },
  {
    id: 'prod-keyboard',
    name: 'Keychron Q1 Pro Custom Keyboard',
    price: 4490000,
    description: 'Bàn phím cơ CNC Aluminum nguyên khối, Bluetooth 5.1 & firmware QMK/VIA.',
    rating: 4.8,
    badge: 'Hàng mới',
  },
  {
    id: 'prod-mouse',
    name: 'Logitech MX Master 3S Performance',
    price: 2290000,
    description: 'Chuột công thái học cao cấp với con lăn siêu tốc MagSpeed và cảm biến 8000 DPI.',
    rating: 4.9,
    badge: 'Được đánh giá cao',
  },
];

export default function DemoStorePage() {
  const router = useRouter();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handleBuyNow = async (product: Product) => {
    setPurchasingId(product.id);
    try {
      const idempKey = `store_mercury_${crypto.randomUUID()}`;
      const res = await fetch('/api/gateway/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempKey,
        },
        body: JSON.stringify({
          amount: product.price,
          currency: 'VND',
          description: `Đơn hàng ${product.name}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/checkout?session=${data.clientSecret}`);
      } else {
        alert('Lỗi tạo phiên thanh toán từ Gateway Core');
      }
    } catch (err) {
      alert('Không kết nối được Spring Boot Core: ' + err);
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '48px 24px 80px 24px' }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: '24px' }}>
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
          <ArrowLeft size={16} /> Quay về Trang chủ ApiPay
        </Link>
      </div>

      {/* Store Banner */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(197, 168, 128, 0.12)',
            color: 'var(--mercury-gold)',
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '16px',
            border: '1px solid rgba(197, 168, 128, 0.3)',
          }}
        >
          <ShoppingBag size={14} />
          MÔ PHỎNG THỰC TẾ: E-COMMERCE TÍCH HỢP APIPAY CORE
        </div>

        <h1
          id="store-main-title"
          style={{
            fontSize: 'clamp(2.4rem, 4vw, 3.2rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '16px',
            color: 'var(--text-primary)',
          }}
        >
          TechGear Vietnam Store
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.08rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
          Bấm <strong>&quot;Mua ngay với ApiPay&quot;</strong> để trải nghiệm toàn bộ hành trình gọi API Spring Boot, định tuyến Checkout Adyen và ghi nhận Sổ cái kép Mercury.
        </p>
      </div>

      {/* Product Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '28px',
        }}
      >
        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-frosted)',
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
          >
            {/* Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
                {product.badge}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
                <Star size={14} fill="#f59e0b" />
                <span>{product.rating}</span>
              </div>
            </div>

            {/* Product Details */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '10px', color: '#f5f5f7' }}>
                {product.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, minHeight: '48px' }}>
                {product.description}
              </p>
            </div>

            {/* Price & Action */}
            <div style={{ borderTop: '1px solid var(--border-frosted)', paddingTop: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                Giá niêm yết
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--mercury-gold)', marginBottom: '20px' }}>
                {product.price.toLocaleString('vi-VN')} ₫
              </div>

              <button
                id={`btn-buy-product-${product.id}`}
                onClick={() => handleBuyNow(product)}
                disabled={purchasingId === product.id}
                className="btn-mercury-gold"
                style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
              >
                {purchasingId === product.id ? (
                  <span>Đang khởi tạo cổng...</span>
                ) : (
                  <>
                    <span>Mua ngay với ApiPay</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

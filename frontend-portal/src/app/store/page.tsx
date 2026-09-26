'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, ShieldCheck, ArrowRight, Star } from 'lucide-react';

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
    description: 'Tai nghe chống ồn không dây hàng đầu với 8 micro và bộ xử lý V1 kép.',
    rating: 4.9,
    badge: 'Bán chạy nhất',
  },
  {
    id: 'prod-keyboard',
    name: 'Keychron Q1 Pro Custom Keyboard',
    price: 4490000,
    description: 'Bàn phím cơ CNC Aluminum nguyên khối, Bluetooth 5.1 & QMK/VIA.',
    rating: 4.8,
    badge: 'Hàng mới',
  },
  {
    id: 'prod-mouse',
    name: 'Logitech MX Master 3S Performance',
    price: 2290000,
    description: 'Chuột công thái học cao cấp với con lăn siêu tốc MagSpeed và click tĩnh âm.',
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
      const idempKey = 'store_idemp_' + Math.random().toString(36).substring(2, 10);
      const res = await fetch('http://localhost:8080/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk_test_demo_gateway_key_999',
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
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Store Banner */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.12)',
            color: '#a5b4fc',
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '16px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <ShoppingBag size={14} />
          MÔ PHỎNG THỰC TẾ: E-COMMERCE TÍCH HỢP STRIPEPAY
        </div>

        <h1
          id="store-main-title"
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}
        >
          TechGear Vietnam Store
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
          Bấm <strong>&quot;Mua ngay với StripePay&quot;</strong> để trải nghiệm toàn bộ hành trình gọi API, mở trang Checkout và ghi nhận Sổ cái kế toán kép.
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
            className="glass-card"
            style={{
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge badge-info">{product.badge}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
                <Star size={14} fill="#f59e0b" />
                <span>{product.rating}</span>
              </div>
            </div>

            {/* Product Details */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '10px' }}>
                {product.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '48px' }}>
                {product.description}
              </p>
            </div>

            {/* Price & Action */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
                Giá niêm yết
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '18px' }}>
                {product.price.toLocaleString('vi-VN')} ₫
              </div>

              <button
                id={`btn-buy-product-${product.id}`}
                onClick={() => handleBuyNow(product)}
                disabled={purchasingId === product.id}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
              >
                {purchasingId === product.id ? (
                  <span>Đang khởi tạo cổng...</span>
                ) : (
                  <>
                    <span>Mua ngay với StripePay</span>
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

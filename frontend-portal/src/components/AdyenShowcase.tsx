'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Minus, ExternalLink } from 'lucide-react';

/**
 * Adyen Iconic Curved Particle Dome (Stippled dots hemisphere)
 */
export function AdyenParticleDome() {
  // Generate stable dot coordinates for the iconic Adyen dome
  const dots: { cx: number; cy: number; r: number; opacity: number }[] = [];
  const width = 1200;
  const height = 400;
  const centerX = width / 2;
  const centerY = height + 100; // Center below bottom to create arch
  const numRings = 16;

  for (let ring = 0; ring < numRings; ring++) {
    const radius = 320 + ring * 14;
    const count = 40 + ring * 6;
    for (let i = 0; i < count; i++) {
      // Angle between 200 deg and 340 deg (upper arc)
      const angle = (200 + (140 * i) / (count - 1)) * (Math.PI / 180);
      // Small random jitter to look natural and starry like Adyen
      const jitterR = (Math.sin(ring * 13 + i * 7) * 4);
      const jitterA = (Math.cos(ring * 7 + i * 11) * 0.015);
      const r = radius + jitterR;
      const a = angle + jitterA;
      const cx = centerX + r * Math.cos(a);
      const cy = centerY + r * Math.sin(a) * 0.65; // flatten for ellipse
      if (cy > 0 && cy < height && cx > 0 && cx < width) {
        const opacity = 0.2 + (Math.sin(i * 3 + ring) + 1) * 0.35;
        const size = (ring % 3 === 0 ? 1.8 : ring % 2 === 0 ? 1.4 : 1.0);
        dots.push({ cx, cy, r: size, opacity });
      }
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '320px',
        overflow: 'hidden',
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
      }}
    >
      <svg
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMax meet"
        style={{ width: '100%', height: '100%', maxWidth: '1400px' }}
      >
        <defs>
          <radialGradient id="domeGlow" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#0abf53" stopOpacity="0.12" />
            <stop offset="60%" stopColor="#00112c" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Ambient bottom dome glow */}
        <ellipse cx="600" cy="400" rx="550" ry="250" fill="url(#domeGlow)" />

        {/* Stippled Particle Dots */}
        {dots.map((d, idx) => (
          <circle
            key={idx}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill="#ffffff"
            opacity={d.opacity}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * State 1: Adyen Wireframe 3D Orbital Sphere with Moving Monetary Nodes
 */
export function AdyenGlobeOrbital() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 500 500"
        style={{ width: '100%', height: '100%', maxWidth: '480px', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="greenOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff84" />
            <stop offset="50%" stopColor="#0abf53" />
            <stop offset="100%" stopColor="#004d20" />
          </linearGradient>
        </defs>

        {/* Center Wireframe Coordinate Circle */}
        <circle
          cx="250"
          cy="250"
          r="160"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />

        {/* Orbit Ring 1 (Tilted 30 deg) */}
        <ellipse
          cx="250"
          cy="250"
          rx="170"
          ry="90"
          fill="none"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="1"
          transform="rotate(-25 250 250)"
        />

        {/* Orbit Ring 2 (Tilted 65 deg) */}
        <ellipse
          cx="250"
          cy="250"
          rx="175"
          ry="70"
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
          transform="rotate(45 250 250)"
        />

        {/* Orbit Ring 3 (Vertical Axis) */}
        <ellipse
          cx="250"
          cy="250"
          rx="70"
          ry="175"
          fill="none"
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth="1"
          transform="rotate(15 250 250)"
        />

        {/* Orbit Ring 4: ACTIVE ADYEN ELECTRIC GREEN ORBIT */}
        <ellipse
          cx="250"
          cy="250"
          rx="185"
          ry="75"
          fill="none"
          stroke="url(#greenOrbitGrad)"
          strokeWidth="1.8"
          strokeDasharray="6 3"
          transform="rotate(-60 250 250)"
        />

        {/* Additional Cross Ring */}
        <ellipse
          cx="250"
          cy="250"
          rx="160"
          ry="120"
          fill="none"
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth="1"
          transform="rotate(75 250 250)"
        />

        {/* Static Wireframe Dots along lower arc */}
        <rect x="180" y="375" width="4" height="4" fill="#64748b" />
        <rect x="230" y="388" width="4" height="4" fill="#64748b" />
        <rect x="270" y="392" width="4" height="4" fill="#94a3b8" />
        <rect x="310" y="388" width="4" height="4" fill="#64748b" />

        {/* Dynamic Nodes along Green Orbit */}
        {/* Node 1: $12,000.00 / 120.000.000 VND */}
        <g transform="translate(235, 140)">
          <rect x="-3" y="-3" width="6" height="6" fill="#00ff84" />
          <line x1="0" y1="0" x2="35" y2="0" stroke="#00ff84" strokeWidth="1" />
          <rect x="35" y="-12" width="84" height="20" rx="3" fill="#00112c" stroke="#0abf53" strokeWidth="0.8" />
          <text x="42" y="2" fill="#00ff84" fontSize="9" fontFamily="monospace" fontWeight="bold">
            ₫12.500.000
          </text>
        </g>

        {/* Node 2: $28,000.00 / 280.000.000 VND */}
        <g transform="translate(325, 220)">
          <rect x="-3" y="-3" width="6" height="6" fill="#00ff84" />
          <line x1="0" y1="0" x2="35" y2="-8" stroke="#00ff84" strokeWidth="1" />
          <rect x="35" y="-20" width="84" height="20" rx="3" fill="#00112c" stroke="#0abf53" strokeWidth="0.8" />
          <text x="42" y="-6" fill="#00ff84" fontSize="9" fontFamily="monospace" fontWeight="bold">
            ₫28.000.000
          </text>
        </g>

        {/* Node 3: Instant VietQR Routing */}
        <g transform="translate(145, 280)">
          <circle cx="0" cy="0" r="3" fill="#ffffff" />
          <text x="10" y="4" fill="#94a3b8" fontSize="8" fontFamily="monospace">
            NAPAS 24/7 • 12ms
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * State 2: Adyen 3D Isometric Layered Stack (Rhombus Slabs)
 */
export function AdyenIsometricStack() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 500 500"
        style={{ width: '100%', height: '100%', maxWidth: '480px' }}
      >
        <defs>
          <linearGradient id="slabGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0abf53" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00112c" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Vertical Central Alignment Guide Line */}
        <line
          x1="250"
          y1="110"
          x2="250"
          y2="410"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* Stack Layer 1 (Topmost - E-Commerce & Apps) */}
        <g transform="translate(0, 0)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill="#091b35"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1.2"
          />
        </g>

        {/* Stack Layer 2 */}
        <g transform="translate(0, 16)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill="#06162d"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
        </g>

        {/* Stack Layer 3 */}
        <g transform="translate(0, 32)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill="#051326"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="1"
          />
        </g>

        {/* Stack Layer 4 */}
        <g transform="translate(0, 48)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill="#040f20"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
          />
        </g>

        {/* Stack Layer 5 */}
        <g transform="translate(0, 64)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill="#030c1b"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />
        </g>

        {/* Middle Platform Layer (Large Expanded Rhombus) */}
        <g transform="translate(0, 120)">
          <path
            d="M250 130 L370 198 L250 266 L130 198 Z"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
          />
          {/* Center Connection Diamond Node */}
          <polygon
            points="250,194 254,198 250,202 246,198"
            fill="#ffffff"
          />
        </g>

        {/* Active Connector Beam between middle and base layer */}
        <line
          x1="250"
          y1="318"
          x2="250"
          y2="395"
          stroke="#0abf53"
          strokeWidth="1.5"
        />

        {/* Base Layer: ADYEN ELECTRIC GREEN EMBEDDED FINANCE CORE */}
        <g transform="translate(0, 220)">
          <path
            d="M250 130 L370 198 L250 266 L130 198 Z"
            fill="url(#slabGlow)"
            stroke="#0abf53"
            strokeWidth="1.8"
          />
          {/* Active Center Emerald Diamond */}
          <polygon
            points="250,194 254,198 250,202 246,198"
            fill="#00ff84"
          />
        </g>
      </svg>
    </div>
  );
}

/**
 * Adyen Exact Interactive Section with 1 & 2 Step Switcher and Accordion
 */
export function AdyenInteractiveShowcase() {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  return (
    <section
      style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '60px 32px 100px 32px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
        gap: '40px',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Left Column: Step Navigation Indicator + 3D Visualizer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {/* Adyen Step Number Indicator Line */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            userSelect: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: activeStep === 1 ? '#0abf53' : '#64748b',
              cursor: 'pointer',
              padding: '4px',
              transition: 'color 0.2s',
            }}
          >
            1
          </button>

          {/* Vertical Progress Bar */}
          <div
            style={{
              width: '2px',
              height: '60px',
              background: 'rgba(255, 255, 255, 0.1)',
              position: 'relative',
              borderRadius: '999px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: activeStep === 1 ? '0%' : '50%',
                height: '50%',
                background: '#0abf53',
                borderRadius: '999px',
                transition: 'top 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: activeStep === 2 ? '#0abf53' : '#64748b',
              cursor: 'pointer',
              padding: '4px',
              transition: 'color 0.2s',
            }}
          >
            2
          </button>
        </div>

        {/* 3D Visual Stage */}
        <div style={{ flex: 1, minHeight: '480px' }}>
          {activeStep === 1 ? <AdyenGlobeOrbital /> : <AdyenIsometricStack />}
        </div>
      </div>

      {/* Right Column: Accordion Panels matching Adyen screenshots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Accordion Tab 1: Intelligent Money Movement */}
        {activeStep === 1 ? (
          <div
            style={{
              background: '#041328',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '36px 32px',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#8fa0be',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              ĐIỀU HƯỚNG DÒNG TIỀN THÔNG MINH
            </div>

            <h2
              style={{
                fontSize: 'clamp(1.8rem, 2.8vw, 2.3rem)',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: '16px',
              }}
            >
              Luân chuyển dòng tiền xuyên suốt toàn bộ doanh nghiệp
            </h2>

            <p
              style={{
                color: '#8fa0be',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              Tối ưu hóa doanh thu với giải pháp thanh toán toàn diện và tự động hóa chi trả (Payouts). Chấp nhận, đối soát và giải ngân nguồn vốn trên một nền tảng duy nhất.
            </p>

            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.92rem',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '36px',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#00ff84')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#ffffff')}
            >
              <span>Khám phá luồng tiền thông minh</span>
              <ArrowRight size={16} />
            </Link>

            {/* Sub-list: USE CASES */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#64748b',
                  marginBottom: '14px',
                }}
              >
                TRƯỜNG HỢP SỬ DỤNG
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Link
                  href="/checkout"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'color 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#00ff84')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#ffffff')}
                >
                  <span>Chấp nhận thanh toán (VietQR & Thẻ)</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/dashboard"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'color 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#00ff84')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#ffffff')}
                >
                  <span>Chi trả và giải ngân tự động 24/7</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/store"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    transition: 'color 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#00ff84')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#ffffff')}
                >
                  <span>Thanh toán tại quầy & Đa kênh Omni-channel</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed Tab 1 */
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            style={{
              width: '100%',
              background: '#091b35',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#cbd5e1',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <span>ĐIỀU HƯỚNG DÒNG TIỀN THÔNG MINH</span>
            <Plus size={16} />
          </button>
        )}

        {/* Accordion Tab 2: Embedded Finance for Platforms */}
        {activeStep === 2 ? (
          <div
            style={{
              background: '#041328',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '36px 32px',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#8fa0be',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              NỀN TẢNG CHO DOANH NGHIỆP (EMBEDDED FINANCE)
            </div>

            <h2
              style={{
                fontSize: 'clamp(1.8rem, 2.8vw, 2.3rem)',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: '16px',
              }}
            >
              Khởi chạy dịch vụ thanh toán và tài chính dưới thương hiệu riêng
            </h2>

            <p
              style={{
                color: '#8fa0be',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              Mở khóa nguồn doanh thu mới. Nhúng cổng thanh toán, tài khoản thụ hưởng, phát hành thẻ và vốn kinh doanh chỉ với một lần tích hợp API duy nhất.
            </p>

            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.92rem',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '36px',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#00ff84')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#ffffff')}
            >
              <span>Khám phá Tài chính Nhúng</span>
              <ArrowRight size={16} />
            </Link>

            {/* Sub-list: USE CASES */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#64748b',
                  marginBottom: '14px',
                }}
              >
                TRƯỜNG HỢP SỬ DỤNG
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Link
                  href="/checkout"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'color 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#00ff84')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#ffffff')}
                >
                  <span>Thanh toán nhúng trong nền tảng (Embedded Payments)</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/dashboard"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'color 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#00ff84')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#ffffff')}
                >
                  <span>Tài trợ vốn & Tín dụng doanh nghiệp (Embedded Lending)</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/dashboard"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    transition: 'color 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#00ff84')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#ffffff')}
                >
                  <span>Tài khoản doanh nghiệp & Thẻ ảo (Accounts & Cards)</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed Tab 2 */
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            style={{
              width: '100%',
              background: '#091b35',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#cbd5e1',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <span>NỀN TẢNG CHO DOANH NGHIỆP (EMBEDDED FINANCE)</span>
            <Plus size={16} />
          </button>
        )}
      </div>
    </section>
  );
}

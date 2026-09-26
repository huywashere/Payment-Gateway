'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Minus, ExternalLink, Move3d, ShieldCheck, Layers, CreditCard, Sparkles, Building, Landmark, ChevronRight } from 'lucide-react';

/**
 * Adyen Iconic Curved Particle Dome (Stippled dots hemisphere)
 */
export function AdyenParticleDome() {
  const dots: { cx: number; cy: number; r: number; opacity: number }[] = [];
  const width = 1200;
  const height = 400;
  const centerX = width / 2;
  const centerY = height + 100;
  const numRings = 16;

  for (let ring = 0; ring < numRings; ring++) {
    const radius = 320 + ring * 14;
    const count = 40 + ring * 6;
    for (let i = 0; i < count; i++) {
      const angle = (200 + (140 * i) / (count - 1)) * (Math.PI / 180);
      const jitterR = Math.sin(ring * 13 + i * 7) * 4;
      const jitterA = Math.cos(ring * 7 + i * 11) * 0.015;
      const r = radius + jitterR;
      const a = angle + jitterA;
      const cx = centerX + r * Math.cos(a);
      const cy = centerY + r * Math.sin(a) * 0.65;
      if (cy > 0 && cy < height && cx > 0 && cx < width) {
        const opacity = 0.2 + (Math.sin(i * 3 + ring) + 1) * 0.35;
        const size = ring % 3 === 0 ? 1.8 : ring % 2 === 0 ? 1.4 : 1.0;
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
        <ellipse cx="600" cy="400" rx="550" ry="250" fill="url(#domeGlow)" />
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

// 3D Math Helper: Precompute ring vertices in 3D
function createRingVertices(radius: number, pitch: number, yaw: number, roll: number, count = 72): [number, number, number][] {
  const points: [number, number, number][] = [];
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const cosR = Math.cos(roll), sinR = Math.sin(roll);

  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const x0 = radius * Math.cos(theta);
    const y0 = radius * Math.sin(theta);
    const z0 = 0;

    // Pitch (around X)
    const y1 = y0 * cosP - z0 * sinP;
    const z1 = y0 * sinP + z0 * cosP;
    const x1 = x0;

    // Yaw (around Y)
    const x2 = x1 * cosY + z1 * sinY;
    const z2 = -x1 * sinY + z1 * cosY;
    const y2 = y1;

    // Roll (around Z)
    const x3 = x2 * cosR - y2 * sinR;
    const y3 = x2 * sinR + y2 * cosR;
    const z3 = z2;

    points.push([x3, y3, z3]);
  }
  return points;
}

/**
 * Adyen Exact 3D Wireframe Rotating Sphere (Orbital Armillary Globe)
 * Built with pure Canvas 2D + 3D perspective projection.
 */
export function AdyenGlobeOrbital() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const rotAngle = useRef({ x: 0.28, y: 0.45, z: 0.08 });
  const rotVel = useRef({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const R = 185;
    const rings = [
      { vertices: createRingVertices(R + 8, 0, 0, 0, 80), isGreen: false, opacity: 0.12, width: 0.9 },
      { vertices: createRingVertices(R, 0.22, 0.45, 0.1, 72), isGreen: false, opacity: 0.25, width: 1.1 },
      { vertices: createRingVertices(R, 0.45, 1.25, -0.15, 72), isGreen: false, opacity: 0.22, width: 1.0 },
      { vertices: createRingVertices(R, -0.35, -0.85, 0.2, 72), isGreen: false, opacity: 0.24, width: 1.1 },
      { vertices: createRingVertices(R, 1.15, 0.35, -0.25, 72), isGreen: false, opacity: 0.2, width: 1.0 },
      { vertices: createRingVertices(R, -0.85, 0.65, 0.45, 72), isGreen: false, opacity: 0.18, width: 0.9 },
      { vertices: createRingVertices(R + 6, -0.45, -0.65, 0.85, 90), isGreen: true, opacity: 1.0, width: 2.2 },
    ];

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const curY = window.scrollY;
      const delta = curY - lastScrollY;
      lastScrollY = curY;

      rotVel.current.y += delta * 0.0032;
      rotVel.current.x += delta * 0.0012;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = 520;
      const displayHeight = 520;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      rotAngle.current.y += 0.0035 + rotVel.current.y;
      rotAngle.current.x += 0.0008 + rotVel.current.x;

      rotVel.current.y *= 0.925;
      rotVel.current.x *= 0.925;

      const cx = displayWidth / 2;
      const cy = displayHeight / 2;
      const fov = 650;

      const rx = rotAngle.current.x;
      const ry = rotAngle.current.y;
      const rz = rotAngle.current.z;

      const cosRx = Math.cos(rx), sinRx = Math.sin(rx);
      const cosRy = Math.cos(ry), sinRy = Math.sin(ry);
      const cosRz = Math.cos(rz), sinRz = Math.sin(rz);

      const project = (p: [number, number, number]) => {
        const [x, y, z] = p;
        const y1 = y * cosRx - z * sinRx;
        const z1 = y * sinRx + z * cosRx;
        const x1 = x;
        const x2 = x1 * cosRy + z1 * sinRy;
        const z2 = -x1 * sinRy + z1 * cosRy;
        const y2 = y1;
        const x3 = x2 * cosRz - y2 * sinRz;
        const y3 = x2 * sinRz + y2 * cosRz;
        const z3 = z2;

        const scale = fov / (fov + z3);
        return {
          x: cx + x3 * scale,
          y: cy + y3 * scale,
          z: z3,
          scale,
        };
      };

      const radGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, R);
      radGlow.addColorStop(0, 'rgba(10, 191, 83, 0.04)');
      radGlow.addColorStop(0.7, 'rgba(0, 17, 44, 0.02)');
      radGlow.addColorStop(1, 'rgba(0, 17, 44, 0)');
      ctx.fillStyle = radGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      rings.forEach((ring) => {
        const count = ring.vertices.length;
        const projPoints = ring.vertices.map(project);

        for (let i = 0; i < count; i++) {
          const p1 = projPoints[i];
          const p2 = projPoints[(i + 1) % count];
          const avgZ = (p1.z + p2.z) / 2;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);

          if (ring.isGreen) {
            if (avgZ >= -20) {
              ctx.strokeStyle = '#00ff84';
              ctx.shadowColor = '#00ff84';
              ctx.shadowBlur = 10;
              ctx.lineWidth = 2.4 * p1.scale;
            } else {
              ctx.strokeStyle = 'rgba(10, 191, 83, 0.45)';
              ctx.shadowBlur = 0;
              ctx.lineWidth = 1.6 * p1.scale;
            }
          } else {
            ctx.shadowBlur = 0;
            if (avgZ >= -10) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${ring.opacity * 1.5})`;
              ctx.lineWidth = ring.width * 1.1 * p1.scale;
            } else {
              ctx.strokeStyle = `rgba(255, 255, 255, ${ring.opacity * 0.45})`;
              ctx.lineWidth = ring.width * 0.8 * p1.scale;
            }
          }
          ctx.stroke();
        }
      });

      ctx.shadowBlur = 0;

      const greenRing = rings[6].vertices;
      const node1Raw = greenRing[18];
      const node2Raw = greenRing[62];

      const node1 = project(node1Raw);
      const node2 = project(node2Raw);
      const node3 = project(rings[1].vertices[24]);
      const cube1 = project(rings[2].vertices[14]);
      const cube2 = project(rings[3].vertices[38]);
      const cube3 = project(rings[4].vertices[50]);

      [cube1, cube2, cube3].forEach((cube) => {
        const size = (cube.z > 0 ? 5 : 3.5) * cube.scale;
        ctx.fillStyle = cube.z > 0 ? '#cbd5e1' : '#64748b';
        ctx.fillRect(cube.x - size / 2, cube.y - size / 2, size, size);
      });

      if (node3.z > -40) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node3.x, node3.y, 3 * node3.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.font = '9px monospace';
        ctx.fillText('NAPAS 24/7 • 12ms', node3.x + 8, node3.y + 3);
      }

      // Tag 1: $28,000.90
      const n1Size = 7 * node1.scale;
      ctx.shadowColor = '#00ff84';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00ff84';
      ctx.fillRect(node1.x - n1Size / 2, node1.y - n1Size / 2, n1Size, n1Size);
      ctx.shadowBlur = 0;

      const n1TagX = node1.x + 42;
      const n1TagY = node1.y - 12;
      ctx.strokeStyle = '#00ff84';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(node1.x, node1.y);
      ctx.lineTo(n1TagX, n1TagY);
      ctx.lineTo(n1TagX + 16, n1TagY);
      ctx.stroke();

      const tagW1 = 108;
      const tagH1 = 28;
      ctx.fillStyle = 'rgba(0, 17, 44, 0.94)';
      ctx.strokeStyle = '#0abf53';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(n1TagX + 16, n1TagY - 14, tagW1, tagH1, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00ff84';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('$28,000.90', n1TagX + 24, n1TagY + 1);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText('₫28.000.000', n1TagX + 24, n1TagY + 10);

      // Tag 2: $12,000.50
      const n2Size = 6 * node2.scale;
      ctx.shadowColor = '#00ff84';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00ff84';
      ctx.fillRect(node2.x - n2Size / 2, node2.y - n2Size / 2, n2Size, n2Size);
      ctx.shadowBlur = 0;

      const n2TagX = node2.x + 36;
      const n2TagY = node2.y + 14;
      ctx.strokeStyle = '#00ff84';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(node2.x, node2.y);
      ctx.lineTo(n2TagX, n2TagY);
      ctx.lineTo(n2TagX + 14, n2TagY);
      ctx.stroke();

      const tagW2 = 104;
      const tagH2 = 28;
      ctx.fillStyle = 'rgba(0, 17, 44, 0.94)';
      ctx.strokeStyle = '#0abf53';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(n2TagX + 14, n2TagY - 14, tagW2, tagH2, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00ff84';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('$12,000.50', n2TagX + 22, n2TagY + 1);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText('₫12.500.000', n2TagX + 22, n2TagY + 10);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsInteracting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    rotVel.current.y += dx * 0.005;
    rotVel.current.x += dy * 0.005;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setTimeout(() => setIsInteracting(false), 800);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      isDragging.current = true;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsInteracting(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    rotVel.current.y += dx * 0.006;
    rotVel.current.x += dy * 0.006;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    setTimeout(() => setIsInteracting(false), 800);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '520px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '520px',
          height: '520px',
          maxWidth: '100%',
          display: 'block',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 17, 44, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '0.74rem',
          fontFamily: 'monospace',
          color: isInteracting ? '#00ff84' : '#94a3b8',
          transition: 'all 0.25s ease',
          pointerEvents: 'none',
        }}
      >
        <Move3d size={13} color={isInteracting ? '#00ff84' : '#0abf53'} />
        <span>{isInteracting ? 'ĐANG XOAY QUẢ CẦU 3D' : 'CUỘN TRANG HOẶC KÉO CHUỘT ĐỂ XOAY 3D'}</span>
      </div>
    </div>
  );
}

/**
 * 3D Isometric Layered Stack (Rhombus Slabs)
 * Supports light & dark themes with floating architecture tags
 */
export function AdyenIsometricStack({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const isLight = theme === 'light';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '520px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 540 520"
        style={{ width: '100%', height: '100%', maxWidth: '540px', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="slabGlowLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0abf53" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00112c" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="slabGlowDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0abf53" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00112c" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Central Vertical Alignment Guide Line */}
        <line
          x1="270"
          y1="80"
          x2="270"
          y2="430"
          stroke={isLight ? 'rgba(0, 17, 44, 0.15)' : 'rgba(255, 255, 255, 0.15)'}
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* Stack Layer 1 (Topmost - Storefront & Client Apps) */}
        <g transform="translate(20, 0)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill={isLight ? '#091b35' : '#091b35'}
            stroke={isLight ? 'rgba(0, 17, 44, 0.35)' : 'rgba(255, 255, 255, 0.25)'}
            strokeWidth="1.2"
          />
        </g>

        {/* Stack Layer 2 */}
        <g transform="translate(20, 16)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill={isLight ? '#0c2344' : '#06162d'}
            stroke={isLight ? 'rgba(0, 17, 44, 0.3)' : 'rgba(255, 255, 255, 0.2)'}
            strokeWidth="1"
          />
        </g>

        {/* Stack Layer 3 */}
        <g transform="translate(20, 32)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill={isLight ? '#102c54' : '#051326'}
            stroke={isLight ? 'rgba(0, 17, 44, 0.25)' : 'rgba(255, 255, 255, 0.18)'}
            strokeWidth="1"
          />
        </g>

        {/* Stack Layer 4 */}
        <g transform="translate(20, 48)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill={isLight ? '#143666' : '#040f20'}
            stroke={isLight ? 'rgba(0, 17, 44, 0.2)' : 'rgba(255, 255, 255, 0.15)'}
            strokeWidth="1"
          />
        </g>

        {/* Stack Layer 5 */}
        <g transform="translate(20, 64)">
          <path
            d="M250 110 L330 155 L250 200 L170 155 Z"
            fill={isLight ? '#194179' : '#030c1b'}
            stroke={isLight ? 'rgba(0, 17, 44, 0.18)' : 'rgba(255, 255, 255, 0.12)'}
            strokeWidth="1"
          />
        </g>

        {/* Middle Platform Layer (Large Expanded Rhombus) */}
        <g transform="translate(20, 120)">
          <path
            d="M250 130 L370 198 L250 266 L130 198 Z"
            fill={isLight ? 'rgba(255, 255, 255, 0.85)' : '#041328'}
            stroke={isLight ? '#00112c' : 'rgba(255, 255, 255, 0.45)'}
            strokeWidth="1.6"
          />
          <polygon
            points="250,194 254,198 250,202 246,198"
            fill={isLight ? '#00112c' : '#ffffff'}
          />
        </g>

        {/* Active Connector Beam between middle and base layer */}
        <line
          x1="270"
          y1="318"
          x2="270"
          y2="395"
          stroke="#0abf53"
          strokeWidth="2"
        />

        {/* Base Layer: ADYEN ELECTRIC GREEN EMBEDDED FINANCE CORE */}
        <g transform="translate(20, 220)">
          <path
            d="M250 130 L370 198 L250 266 L130 198 Z"
            fill={isLight ? 'url(#slabGlowLight)' : 'url(#slabGlowDark)'}
            stroke="#0abf53"
            strokeWidth="2.2"
          />
          <polygon
            points="250,194 254,198 250,202 246,198"
            fill="#00ff84"
          />
        </g>

        {/* Annotations along the architecture stack */}
        <g transform="translate(390, 175)">
          <line x1="-30" y1="0" x2="0" y2="0" stroke="#0abf53" strokeWidth="1" strokeDasharray="2 2" />
          <text x="6" y="4" fill={isLight ? '#00112c' : '#ffffff'} fontSize="10" fontFamily="monospace" fontWeight="bold">
            Giao diện API & Apps
          </text>
        </g>

        <g transform="translate(410, 318)">
          <line x1="-30" y1="0" x2="0" y2="0" stroke="#0abf53" strokeWidth="1" strokeDasharray="2 2" />
          <text x="6" y="4" fill={isLight ? '#00112c' : '#ffffff'} fontSize="10" fontFamily="monospace" fontWeight="bold">
            Sổ cái kép & Split Engine
          </text>
        </g>

        <g transform="translate(410, 420)">
          <line x1="-30" y1="0" x2="0" y2="0" stroke="#0abf53" strokeWidth="1" strokeDasharray="2 2" />
          <text x="6" y="4" fill="#0abf53" fontSize="10" fontFamily="monospace" fontWeight="bold">
            Lõi Embedded Finance
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * =================================================================================
 * PHẦN 1: QUẢ CẦU 3D & LUÂN CHUYỂN DÒNG TIỀN (INTELLIGENT MONEY MOVEMENT)
 * Background: Adyen Midnight Navy (#00112c)
 * Features:
 * - 3D Rotating Sphere with scroll momentum and drag interaction
 * - Glowing Adyen Electric Green active orbit with live transaction badges
 * - Dedicated layout for Intelligent Money Movement
 * =================================================================================
 */
export function AdyenMoneyMovementSection() {
  return (
    <section
      id="intelligent-money-movement"
      style={{
        backgroundColor: '#00112c',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        padding: '90px 32px 110px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
          gap: '56px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: 3D Wireframe Rotating Sphere with Scroll Physics */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', minHeight: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AdyenGlobeOrbital />
          </div>
        </div>

        {/* Right Column: Intelligent Money Movement Dedicated Panel */}
        <div>
          <div
            style={{
              background: '#041328',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '12px',
              padding: '42px 38px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Tag Pill */}
            <div
              style={{
                fontSize: '0.74rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#0abf53',
                textTransform: 'uppercase',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff84' }} />
              INTELLIGENT MONEY MOVEMENT • ĐIỀU HƯỚNG DÒNG TIỀN
            </div>

            <h2
              style={{
                fontSize: 'clamp(2rem, 3.2vw, 2.7rem)',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.18,
                letterSpacing: '-0.025em',
                marginBottom: '16px',
              }}
            >
              Luân chuyển dòng tiền xuyên suốt toàn bộ doanh nghiệp
            </h2>

            <div
              style={{
                fontSize: '0.86rem',
                fontFamily: 'monospace',
                color: '#64748b',
                marginBottom: '16px',
              }}
            >
              Move money across your entire business
            </div>

            <p
              style={{
                color: '#94a3b8',
                fontSize: '0.98rem',
                lineHeight: 1.65,
                marginBottom: '28px',
              }}
            >
              Tối ưu hóa doanh thu với giải pháp thanh toán toàn diện và tự động hóa chi trả (Payouts). Tiếp nhận, đối soát và điều chuyển nguồn vốn trên một nền tảng thống nhất duy nhất.
            </p>

            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '38px',
                textDecoration: 'none',
              }}
              className="hover-green-text"
            >
              <span>Khám phá luồng tiền thông minh (Intelligent Money Movement)</span>
              <ArrowRight size={16} />
            </Link>

            {/* USE CASES List matching Adyen exact screenshot */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '24px' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#64748b',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                }}
              >
                USE CASES • TRƯỜNG HỢP SỬ DỤNG
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link
                  href="/checkout"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    textDecoration: 'none',
                  }}
                  className="hover-green-text"
                >
                  <span>Chấp nhận thanh toán (Accept payments)</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/dashboard"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    textDecoration: 'none',
                  }}
                  className="hover-green-text"
                >
                  <span>Chi trả và giải ngân tự động 24/7 (Send payouts globally)</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/store"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    textDecoration: 'none',
                  }}
                  className="hover-green-text"
                >
                  <span>Thanh toán tại quầy & Đa kênh Omni-channel (In person payments)</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * =================================================================================
 * PHẦN 2: KIẾN TRÚC XẾP TẦNG 3D & NỀN TẢNG DOANH NGHIỆP (ADYEN FOR PLATFORMS)
 * Background: Clean White (#ffffff) for crisp alternating contrast
 * Features:
 * - 3D Isometric Stack with dark slabs & emerald connector
 * - Dedicated layout for Embedded Finance & SaaS Platforms
 * =================================================================================
 */
export function AdyenPlatformsSection() {
  return (
    <section
      id="adyen-for-platforms"
      className="section-white"
      style={{
        borderTop: '1px solid rgba(0, 17, 44, 0.08)',
        borderBottom: '1px solid rgba(0, 17, 44, 0.08)',
        padding: '90px 32px 110px 32px',
        position: 'relative',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: '56px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: 3D Isometric Layered Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AdyenIsometricStack theme="light" />
        </div>

        {/* Right Column: Platforms & Embedded Finance Details */}
        <div>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0, 17, 44, 0.1)',
              borderRadius: '16px',
              padding: '42px 38px',
              boxShadow: '0 20px 45px rgba(0, 17, 44, 0.06)',
            }}
          >
            {/* Tag Pill */}
            <div
              style={{
                fontSize: '0.74rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#0abf53',
                textTransform: 'uppercase',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0abf53' }} />
              ADYEN FOR PLATFORMS • NỀN TẢNG CHO DOANH NGHIỆP
            </div>

            <h2
              style={{
                fontSize: 'clamp(2rem, 3.2vw, 2.7rem)',
                fontWeight: 800,
                color: '#00112c',
                lineHeight: 1.18,
                letterSpacing: '-0.025em',
                marginBottom: '16px',
              }}
            >
              Khởi chạy dịch vụ thanh toán và tài chính dưới thương hiệu riêng
            </h2>

            <div
              style={{
                fontSize: '0.86rem',
                fontFamily: 'monospace',
                color: '#64748b',
                marginBottom: '16px',
              }}
            >
              Launch payments and financial services for your users
            </div>

            <p
              style={{
                color: '#475569',
                fontSize: '0.98rem',
                lineHeight: 1.65,
                marginBottom: '28px',
              }}
            >
              Mở khóa nguồn doanh thu mới cho nền tảng SaaS và Marketplace. Nhúng cổng thanh toán, tài khoản thụ hưởng, phát hành thẻ và cấp vốn kinh doanh chỉ với một lần tích hợp API duy nhất.
            </p>

            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#00112c',
                marginBottom: '38px',
                textDecoration: 'none',
              }}
            >
              <span>Khám phá Tài chính Nhúng (Embedded Finance)</span>
              <ArrowRight size={16} color="#0abf53" />
            </Link>

            {/* USE CASES List in Light Theme */}
            <div style={{ borderTop: '1px solid rgba(0, 17, 44, 0.08)', paddingTop: '24px' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#64748b',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                }}
              >
                USE CASES • TRƯỜNG HỢP SỬ DỤNG
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link
                  href="/checkout"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#00112c',
                    paddingBottom: '14px',
                    borderBottom: '1px solid rgba(0, 17, 44, 0.05)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#0abf53')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#00112c')}
                >
                  <span>Thanh toán nhúng trong nền tảng (Embedded Payments)</span>
                  <ArrowRight size={16} color="#0abf53" />
                </Link>

                <Link
                  href="/dashboard"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#00112c',
                    paddingBottom: '14px',
                    borderBottom: '1px solid rgba(0, 17, 44, 0.05)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#0abf53')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#00112c')}
                >
                  <span>Tài trợ vốn & Tín dụng doanh nghiệp (Embedded Lending)</span>
                  <ArrowRight size={16} color="#0abf53" />
                </Link>

                <Link
                  href="/dashboard"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#00112c',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#0abf53')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#00112c')}
                >
                  <span>Tài khoản doanh nghiệp & Thẻ ảo (Accounts & Cards)</span>
                  <ArrowRight size={16} color="#0abf53" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Backward compatibility wrapper if needed
 */
export function AdyenInteractiveShowcase() {
  return (
    <>
      <AdyenMoneyMovementSection />
      <AdyenPlatformsSection />
    </>
  );
}

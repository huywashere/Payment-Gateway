'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Minus, ExternalLink, RotateCcw, Move3d } from 'lucide-react';

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
 * State 1: Adyen Exact 3D Wireframe Rotating Sphere (Orbital Armillary Globe)
 * Built with pure Canvas 2D + 3D perspective projection.
 * Supports:
 * - Scroll-driven 3D rotation acceleration ("hiệu ứng quay khi lướt")
 * - Continuous smooth ambient idle spin
 * - Interactive mouse / touch drag rotation with inertia physics
 * - Glowing Adyen Electric Green active orbit with live transaction tags ($28,000.90 & $12,000.50)
 */
export function AdyenGlobeOrbital() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const rotAngle = useRef({ x: 0.28, y: 0.45, z: 0.08 });
  const rotVel = useRef({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    // Generate rings with exact orientations matching Adyen's sphere
    const R = 185;
    const rings = [
      // Ring 0: Faint outer horizon boundary
      { vertices: createRingVertices(R + 8, 0, 0, 0, 80), isGreen: false, opacity: 0.12, width: 0.9 },
      // Ring 1: Longitude ring 1
      { vertices: createRingVertices(R, 0.22, 0.45, 0.1, 72), isGreen: false, opacity: 0.25, width: 1.1 },
      // Ring 2: Longitude ring 2
      { vertices: createRingVertices(R, 0.45, 1.25, -0.15, 72), isGreen: false, opacity: 0.22, width: 1.0 },
      // Ring 3: Longitude ring 3
      { vertices: createRingVertices(R, -0.35, -0.85, 0.2, 72), isGreen: false, opacity: 0.24, width: 1.1 },
      // Ring 4: Equatorial / Oblique Belt
      { vertices: createRingVertices(R, 1.15, 0.35, -0.25, 72), isGreen: false, opacity: 0.2, width: 1.0 },
      // Ring 5: Cross Diagonal Belt
      { vertices: createRingVertices(R, -0.85, 0.65, 0.45, 72), isGreen: false, opacity: 0.18, width: 0.9 },
      // Ring 6: PRIMARY ADYEN ELECTRIC GREEN ORBIT RING
      { vertices: createRingVertices(R + 6, -0.45, -0.65, 0.85, 90), isGreen: true, opacity: 1.0, width: 2.2 },
    ];

    // Scroll listener: Every time the user scrolls the page, it gives an angular boost!
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const curY = window.scrollY;
      const delta = curY - lastScrollY;
      lastScrollY = curY;

      // Scrolling down spins clockwise forward; scrolling up spins backwards
      rotVel.current.y += delta * 0.0032;
      rotVel.current.x += delta * 0.0012;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Render loop
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // High-DPI handling
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

      // Idle spin + scroll momentum
      rotAngle.current.y += 0.0035 + rotVel.current.y;
      rotAngle.current.x += 0.0008 + rotVel.current.x;

      // Physics damping
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

      // 3D projection function
      const project = (p: [number, number, number]) => {
        const [x, y, z] = p;
        // Pitch X
        const y1 = y * cosRx - z * sinRx;
        const z1 = y * sinRx + z * cosRx;
        const x1 = x;
        // Yaw Y
        const x2 = x1 * cosRy + z1 * sinRy;
        const z2 = -x1 * sinRy + z1 * cosRy;
        const y2 = y1;
        // Roll Z
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

      // Subtle ambient background glow inside the sphere
      const radGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, R);
      radGlow.addColorStop(0, 'rgba(10, 191, 83, 0.04)');
      radGlow.addColorStop(0.7, 'rgba(0, 17, 44, 0.02)');
      radGlow.addColorStop(1, 'rgba(0, 17, 44, 0)');
      ctx.fillStyle = radGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Render rings in 2 passes: Back half (z < 0) then Front half (z >= 0)
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
              // Front green orbit: Radiant glow
              ctx.strokeStyle = '#00ff84';
              ctx.shadowColor = '#00ff84';
              ctx.shadowBlur = 10;
              ctx.lineWidth = 2.4 * p1.scale;
            } else {
              // Back green orbit: Softer emerald
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

      // Project Key Tracking Nodes on Green Ring (matching Adyen screenshot)
      const greenRing = rings[6].vertices;
      const node1Raw = greenRing[18]; // Primary $28,000.90 node
      const node2Raw = greenRing[62]; // Secondary $12,000.50 node

      const node1 = project(node1Raw);
      const node2 = project(node2Raw);

      // Node 3 on Ring 1 (NAPAS 24/7 route)
      const node3 = project(rings[1].vertices[24]);
      // Silver cubes on Ring 2 & 3
      const cube1 = project(rings[2].vertices[14]);
      const cube2 = project(rings[3].vertices[38]);
      const cube3 = project(rings[4].vertices[50]);

      // Draw Silver Cubes
      [cube1, cube2, cube3].forEach((cube) => {
        const size = (cube.z > 0 ? 5 : 3.5) * cube.scale;
        ctx.fillStyle = cube.z > 0 ? '#cbd5e1' : '#64748b';
        ctx.fillRect(cube.x - size / 2, cube.y - size / 2, size, size);
      });

      // Draw Node 3: NAPAS 24/7 dot
      if (node3.z > -40) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node3.x, node3.y, 3 * node3.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.font = '9px monospace';
        ctx.fillText('NAPAS 24/7 • 12ms', node3.x + 8, node3.y + 3);
      }

      // -------------------------------------------------------------
      // DRAW NODE 1: $28,000.90 (Exact Adyen Tag from Screenshot)
      // -------------------------------------------------------------
      const n1Size = 7 * node1.scale;
      // Glowing green square
      ctx.shadowColor = '#00ff84';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00ff84';
      ctx.fillRect(node1.x - n1Size / 2, node1.y - n1Size / 2, n1Size, n1Size);
      ctx.shadowBlur = 0;

      // Connecting Leader Line
      const n1TagX = node1.x + 42;
      const n1TagY = node1.y - 12;
      ctx.strokeStyle = '#00ff84';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(node1.x, node1.y);
      ctx.lineTo(n1TagX, n1TagY);
      ctx.lineTo(n1TagX + 16, n1TagY);
      ctx.stroke();

      // Tag Container Pill
      const tagW1 = 108;
      const tagH1 = 28;
      ctx.fillStyle = 'rgba(0, 17, 44, 0.94)';
      ctx.strokeStyle = '#0abf53';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(n1TagX + 16, n1TagY - 14, tagW1, tagH1, 4);
      ctx.fill();
      ctx.stroke();

      // Text inside Tag 1
      ctx.fillStyle = '#00ff84';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('$28,000.90', n1TagX + 24, n1TagY + 1);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText('₫28.000.000', n1TagX + 24, n1TagY + 10);

      // -------------------------------------------------------------
      // DRAW NODE 2: $12,000.50 (Exact Adyen Tag from Screenshot)
      // -------------------------------------------------------------
      const n2Size = 6 * node2.scale;
      ctx.shadowColor = '#00ff84';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00ff84';
      ctx.fillRect(node2.x - n2Size / 2, node2.y - n2Size / 2, n2Size, n2Size);
      ctx.shadowBlur = 0;

      // Connecting Leader Line
      const n2TagX = node2.x + 36;
      const n2TagY = node2.y + 14;
      ctx.strokeStyle = '#00ff84';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(node2.x, node2.y);
      ctx.lineTo(n2TagX, n2TagY);
      ctx.lineTo(n2TagX + 14, n2TagY);
      ctx.stroke();

      // Tag Container Pill
      const tagW2 = 104;
      const tagH2 = 28;
      ctx.fillStyle = 'rgba(0, 17, 44, 0.94)';
      ctx.strokeStyle = '#0abf53';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(n2TagX + 14, n2TagY - 14, tagW2, tagH2, 4);
      ctx.fill();
      ctx.stroke();

      // Text inside Tag 2
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

  // Mouse & Touch Drag Handlers for 3D Interactive Spinning
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

      {/* Floating Interactive Badge Hint */}
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
 * State 2: Adyen 3D Isometric Layered Stack (Rhombus Slabs)
 */
export function AdyenIsometricStack() {
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
        viewBox="0 0 500 500"
        style={{ width: '100%', height: '100%', maxWidth: '500px' }}
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
          y1="90"
          x2="250"
          y2="420"
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
          strokeWidth="1.8"
        />

        {/* Base Layer: ADYEN ELECTRIC GREEN EMBEDDED FINANCE CORE */}
        <g transform="translate(0, 220)">
          <path
            d="M250 130 L370 198 L250 266 L130 198 Z"
            fill="url(#slabGlow)"
            stroke="#0abf53"
            strokeWidth="2"
          />
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
 * Features:
 * - Scroll-triggered step transition (auto-progresses when user scrolls down)
 * - Interactive step buttons 1 & 2 with glowing vertical track
 * - Exact layout matching Adyen screenshot media_1790435881648.png
 */
export function AdyenInteractiveShowcase() {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const containerRef = useRef<HTMLElement | null>(null);
  const manualOverride = useRef(false);

  // Auto-switch steps based on section scroll position
  useEffect(() => {
    const onScroll = () => {
      if (manualOverride.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;

      // When the user scrolls past the top 35% of the section, switch to step 2
      if (rect.top < vh * 0.2 && rect.bottom > vh * 0.35) {
        setActiveStep(2);
      } else if (rect.top >= vh * 0.2) {
        setActiveStep(1);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const switchStep = (step: 1 | 2) => {
    setActiveStep(step);
    manualOverride.current = true;
    setTimeout(() => {
      manualOverride.current = false;
    }, 4500);
  };

  return (
    <section
      ref={containerRef}
      id="intelligent-money-movement"
      style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '80px 32px 110px 32px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
        gap: '48px',
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
            onClick={() => switchStep(1)}
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: activeStep === 1 ? '#0abf53' : '#64748b',
              cursor: 'pointer',
              padding: '6px',
              transition: 'color 0.2s',
              background: 'none',
              border: 'none',
            }}
          >
            1
          </button>

          {/* Vertical Progress Bar */}
          <div
            style={{
              width: '2px',
              height: '68px',
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
                transition: 'top 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => switchStep(2)}
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: activeStep === 2 ? '#0abf53' : '#64748b',
              cursor: 'pointer',
              padding: '6px',
              transition: 'color 0.2s',
              background: 'none',
              border: 'none',
            }}
          >
            2
          </button>
        </div>

        {/* 3D Visual Stage */}
        <div style={{ flex: 1, minHeight: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              padding: '38px 34px',
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
              INTELLIGENT MONEY MOVEMENT
            </div>

            <h2
              style={{
                fontSize: 'clamp(1.85rem, 2.8vw, 2.35rem)',
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
                fontSize: '0.94rem',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              Tối ưu hóa doanh thu với giải pháp thanh toán tinh gọn và tự động hóa chi trả (Payouts). Tiếp nhận, đối soát và điều chuyển dòng tiền trên một nền tảng duy nhất.
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
                textDecoration: 'none',
              }}
              className="hover-green-text"
            >
              <span>Khám phá luồng tiền thông minh (Intelligent Money Movement)</span>
              <ArrowRight size={16} />
            </Link>

            {/* Sub-list: USE CASES matching screenshot */}
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
                USE CASES
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Link
                  href="/checkout"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    textDecoration: 'none',
                  }}
                  className="hover-green-text"
                >
                  <span>Chấp nhận thanh toán (Accept payments)</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/dashboard"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    textDecoration: 'none',
                  }}
                  className="hover-green-text"
                >
                  <span>Chi trả và giải ngân tự động 24/7 (Send payouts globally)</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/store"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    textDecoration: 'none',
                  }}
                  className="hover-green-text"
                >
                  <span>Thanh toán tại quầy & Omni-channel (In person payments)</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed Tab 1 */
          <button
            type="button"
            onClick={() => switchStep(1)}
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
            <span>INTELLIGENT MONEY MOVEMENT</span>
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
              padding: '38px 34px',
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
              ADYEN FOR PLATFORMS
            </div>

            <h2
              style={{
                fontSize: 'clamp(1.85rem, 2.8vw, 2.35rem)',
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
                fontSize: '0.94rem',
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
                textDecoration: 'none',
              }}
              className="hover-green-text"
            >
              <span>Khám phá Tài chính Nhúng (Embedded Finance)</span>
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
                USE CASES
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Link
                  href="/checkout"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    textDecoration: 'none',
                  }}
                  className="hover-green-text"
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
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    textDecoration: 'none',
                  }}
                  className="hover-green-text"
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
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    textDecoration: 'none',
                  }}
                  className="hover-green-text"
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
            onClick={() => switchStep(2)}
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
            <span>ADYEN FOR PLATFORMS</span>
            <Plus size={16} />
          </button>
        )}
      </div>
    </section>
  );
}

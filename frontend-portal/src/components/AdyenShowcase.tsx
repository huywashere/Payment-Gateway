'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Move3d } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * =================================================================================
 * ADYEN ICONIC EXPANSIVE PARTICLE DOME (TresJS / Three.js Canvas Replicated)
 * Features matching Adyen.com original website:
 * - Expansive, full-screen spanning height (580px+) rising from bottom edge
 * - Over 1,500 particles arranged in concentric logarithmic radial dome arcs
 * - Dual particle color palette: #5C6874 slate grey/starry white + #00D16A Adyen electric green glow
 * - Scroll-driven elevation (particles rise up as user scrolls into the footer)
 * - Magnetic Mouse Physics: particles warp, pull, and spring-recoil toward cursor
 * - Starry organic twinkling & floating mathematical data glyphs (■ π, 1) N*(S)
 * =================================================================================
 */
export function AdyenParticleDome() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef({ x: -1000, y: -1000, active: false });
  const scrollElevation = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track assembly progress across the whole footer. The footer is the final
    // viewport-sized section, so using the canvas bounds would never let the
    // animation reach 100% before the document hits its scroll limit.
    const handleScroll = () => {
      if (!containerRef.current) return;
      const footer = containerRef.current.closest('.adyen-site-footer');
      const rect = (footer ?? containerRef.current).getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the footer first enters the viewport, 1 when it fills it.
      const progress = Math.min(Math.max((vh - rect.top) / vh, 0), 1);
      scrollElevation.current = progress;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Mouse tracking for Magnetic Interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mousePos.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Initialize 1,500 particles along concentric dome rings
    interface Particle {
      origX: number;
      origY: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      isGreen: boolean;
      opacity: number;
      phase: number;
      ringIndex: number;
      scatterX: number;
      scatterY: number;
    }

    let particles: Particle[] = [];
    const initParticles = (w: number, h: number) => {
      particles = [];
      const cx = w / 2;
      const cy = h + 130; // Center below bottom to form wide planetary horizon
      const numRings = 22;

      for (let ring = 0; ring < numRings; ring++) {
        const radius = 340 + ring * 22;
        const count = 48 + ring * 6;

        for (let i = 0; i < count; i++) {
          // Angle spanning upper arc from 195 deg to 345 deg
          const angle = (195 + (150 * i) / (count - 1)) * (Math.PI / 180);
          const jitterR = Math.sin(ring * 17 + i * 11) * 6;
          const jitterA = Math.cos(ring * 11 + i * 13) * 0.018;
          const r = radius + jitterR;
          const a = angle + jitterA;

          // Elliptical flattening (y radius flattened to 0.68)
          const px = cx + r * Math.cos(a);
          const py = cy + r * Math.sin(a) * 0.68;

          if (py > -20 && py < h + 80 && px > -40 && px < w + 40) {
            const isGreen = false;
            const size = isGreen ? 2.8 : ring > 16 ? 2.15 : ring % 3 === 0 ? 1.85 : 1.35;
            const baseOpacity = isGreen ? 0.95 : 0.2 + (Math.sin(i * 3 + ring) + 1) * 0.35;
            const scatterX = Math.sin(i * 12.17 + ring * 7.31) * (95 + ring * 3.2) + (px - cx) * .16;
            const scatterY = 82 + Math.abs(Math.cos(i * 5.71 + ring * 9.13)) * 112;

            particles.push({
              origX: px,
              origY: py,
              x: px + scatterX,
              y: py + scatterY,
              vx: 0,
              vy: 0,
              r: size,
              isGreen,
              opacity: baseOpacity,
              phase: Math.random() * Math.PI * 2,
              ringIndex: ring,
              scatterX,
              scatterY,
            });
          }
        }
      }
    };

    let animId: number;
    let time = 0;
    let currentElev = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.parentElement ? canvas.parentElement.clientWidth : 1400;
      const h = 580;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        initParticles(w, h);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      time += 0.02;

      // Smooth scroll elevation lerp (Adyen scrollYProgress)
      currentElev += (scrollElevation.current - currentElev) * 0.08;
      const mergeProgress = currentElev * currentElev * (3 - 2 * currentElev);
      const scatterProgress = 1 - mergeProgress;

      const cx = w / 2;
      // Ambient radial dome glow rising from the bottom center
      const domeGlow = ctx.createRadialGradient(cx, h, 20, cx, h, 650);
      domeGlow.addColorStop(0, 'rgba(88, 111, 136, 0.14)');
      domeGlow.addColorStop(0.35, 'rgba(64, 86, 112, 0.06)');
      domeGlow.addColorStop(0.7, 'rgba(0, 17, 44, 0.02)');
      domeGlow.addColorStop(1, 'rgba(0, 17, 44, 0)');
      ctx.fillStyle = domeGlow;
      ctx.fillRect(0, 0, w, h);

      // Update & Draw Particles with Magnetic Physics
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const mouseActive = mousePos.current.active;
      const magneticRadius = 140;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Each point begins dispersed, then converges into the final hemisphere.
        const targetX = p.origX + p.scatterX * scatterProgress;
        const targetY = p.origY + p.scatterY * scatterProgress;

        // Magnetic Attraction
        if (mouseActive) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < magneticRadius && dist > 1) {
            const force = (1 - dist / magneticRadius) * 22;
            p.vx += (dx / dist) * force * 0.18;
            p.vy += (dy / dist) * force * 0.18;
          }
        }

        // Spring force returning to target position
        p.vx += (targetX - p.x) * 0.08;
        p.vy += (targetY - p.y) * 0.08;

        // Velocity damping
        p.vx *= 0.82;
        p.vy *= 0.82;

        p.x += p.vx;
        p.y += p.vy;

        // Starry twinkling opacity
        const twinkle = Math.sin(time * 2 + p.phase) * 0.2;
        const assemblyOpacity = .42 + mergeProgress * .58;
        const currentOpacity = Math.max(0.08, Math.min(1.0, (p.opacity + twinkle) * assemblyOpacity));

        if (p.isGreen) {
          ctx.fillStyle = '#00ff84';
          ctx.shadowColor = '#00ff84';
          ctx.shadowBlur = 8;
          ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r * 1.5, p.r * 1.5);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = `rgba(112, 136, 160, ${currentOpacity * .82})`;
          ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r * 1.55, p.r * 1.55);
        }
      }

      // Adyen Authentic Floating Mathematical & Financial Data Glyphs
      // (Seen in original Adyen footer screenshot: ■ π, 1) N*(S)
      const glyphX = cx + Math.sin(time * 0.5) * 40;
      const glyphY = h - 160 + Math.cos(time * 0.7) * 15 - (currentElev * 30);

      ctx.fillStyle = 'rgba(112, 136, 160, 0.58)';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('S&#[?].2.1', glyphX + 60, glyphY);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '8px monospace';
      ctx.fillText('∑ NOVAGATE VIRTUAL THREADS CORE', glyphX - 220, glyphY + 25);

      // Bottom metallic horizon arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, h + 240, 520, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="adyen-footer-dome"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '580px',
        height: '580px',
        overflow: 'hidden',
        pointerEvents: 'auto',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '-20px',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'default',
        }}
      />
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

    const y1 = y0 * cosP - z0 * sinP;
    const z1 = y0 * sinP + z0 * cosP;
    const x1 = x0;

    const x2 = x1 * cosY + z1 * sinY;
    const z2 = -x1 * sinY + z1 * cosY;
    const y2 = y1;

    const x3 = x2 * cosR - y2 * sinR;
    const y3 = x2 * sinR + y2 * cosR;
    const z3 = z2;

    points.push([x3, y3, z3]);
  }
  return points;
}

/**
 * Adyen Exact 3D Wireframe Rotating Sphere (Orbital Armillary Globe)
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
        cursor: isInteracting ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
 * =================================================================================
 * ADYEN EXACT ANIMATED 3D ISOMETRIC STACK (EmbeddedFinance Component Replicated)
 * Features matching Adyen.com original website:
 * - 18-slab tiered technology architecture (3 groups of 6 slabs with isometric projection)
 * - Dynamic spring levitation: top tiers float weightlessly along the vertical central axis
 * - Ping Pulse Ripple Effect (playPing): radiant #00D16A green rectangular outline pulse expands outward
 * - Vertical Green Laser Guide Line with animated upward-traveling energy photons
 * - Interactive Mouse Parallax & 3D Tilt: slabs gently shift in depth when hovering over the stack
 * - Interactive linking with the 3 USE CASES cards on the right
 * =================================================================================
 */
export function AdyenIsometricStack({
  activeTier = 1,
  onHoverTier,
}: {
  activeTier?: number;
  onHoverTier?: (tier: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseTilt = useRef({ x: 0, y: 0 });
  const pingState = useRef({ active: true, scale: 1.0, opacity: 0.8 });
  const photons = useRef([
    { progress: 0.1, speed: 0.007 },
    { progress: 0.45, speed: 0.009 },
    { progress: 0.8, speed: 0.006 },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trigger Ping Pulse every 2.4 seconds matching Adyen playPing()
    const pingInterval = setInterval(() => {
      pingState.current = { active: true, scale: 1.0, opacity: 0.85 };
    }, 2400);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseTilt.current = {
        x: (e.clientX - cx) * 0.035,
        y: (e.clientY - cy) * 0.035,
      };
      const localY = ((e.clientY - rect.top) / rect.height) * 530;
      onHoverTier?.(localY < 235 ? 1 : localY < 355 ? 2 : 3);
    };

    const handleMouseLeave = () => {
      mouseTilt.current = { x: 0, y: 0 };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let animId: number;
    let time = 0;
    let tiltLerpX = 0;
    let tiltLerpY = 0;
    let levitateSpring = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = 540;
      const h = 530;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      time += 0.025;

      // Mouse parallax smooth interpolation
      tiltLerpX += (mouseTilt.current.x - tiltLerpX) * 0.08;
      tiltLerpY += (mouseTilt.current.y - tiltLerpY) * 0.08;

      // Spring-driven levitation for top tier group (Adyen ySpring)
      const targetLevitate = Math.sin(time * 1.8) * 8;
      levitateSpring += (targetLevitate - levitateSpring) * 0.1;

      const cx = w / 2;
      // Draw Vertical Green Laser Guide Line (#00D16A / #00ff84)
      ctx.strokeStyle = 'rgba(0, 209, 106, 0.4)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx + tiltLerpX * 0.1, 75);
      ctx.lineTo(cx + tiltLerpX * 0.1, 440);
      ctx.stroke();
      ctx.setLineDash([]);

      // Traveling Energy Photons up the laser beam
      photons.current.forEach((ph) => {
        ph.progress = (ph.progress + ph.speed) % 1;
        const photonY = 430 - ph.progress * 350;
        const photonX = cx + tiltLerpX * 0.1;

        ctx.fillStyle = '#00ff84';
        ctx.shadowColor = '#00ff84';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(photonX, photonY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = 'rgba(0, 255, 132, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(photonX, photonY);
        ctx.lineTo(photonX, photonY + 12);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Helper function to draw an isometric rhombus slab
      const drawRhombus = (
        x: number,
        y: number,
        rx: number,
        ry: number,
        fillColor: string | CanvasGradient | CanvasPattern,
        strokeColor: string,
        lineWidth = 1.2
      ) => {
        ctx.beginPath();
        ctx.moveTo(x, y - ry);
        ctx.lineTo(x + rx, y);
        ctx.lineTo(x, y + ry);
        ctx.lineTo(x - rx, y);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      };

      // -------------------------------------------------------------
      // 1. BASE LAYER: ADYEN ELECTRIC GREEN EMBEDDED FINANCE CORE
      // -------------------------------------------------------------
      const baseY = 410;
      const baseGrad = ctx.createLinearGradient(cx - 130, baseY, cx + 130, baseY);
      baseGrad.addColorStop(0, 'rgba(10, 191, 83, 0.28)');
      baseGrad.addColorStop(1, 'rgba(0, 17, 44, 0.08)');

      drawRhombus(
        cx + tiltLerpX * 0.2,
        baseY,
        130,
        65,
        baseGrad,
        activeTier === 3 ? '#00ff84' : '#00D16A',
        activeTier === 3 ? 3 : 2.2
      );

      // Central Emerald Diamond
      ctx.fillStyle = '#00ff84';
      ctx.shadowColor = '#00ff84';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cx + tiltLerpX * 0.2, baseY - 5);
      ctx.lineTo(cx + tiltLerpX * 0.2 + 5, baseY);
      ctx.lineTo(cx + tiltLerpX * 0.2, baseY + 5);
      ctx.lineTo(cx + tiltLerpX * 0.2 - 5, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // -------------------------------------------------------------
      // 2. MIDDLE PLATFORM LAYER: EXPANDED TRANSLUCENT RHOMBUS
      // -------------------------------------------------------------
      const midY = 300 + (Math.sin(time * 1.5) * 3);
      drawRhombus(
        cx + tiltLerpX * 0.4,
        midY,
        125,
        62,
        'rgba(0, 17, 44, 0.08)',
        activeTier === 2 ? '#00D16A' : 'rgba(255,255,255,.88)',
        activeTier === 2 ? 2.6 : 1.6
      );

      // Diamond node on middle layer
      ctx.fillStyle = '#00112c';
      ctx.beginPath();
      ctx.moveTo(cx + tiltLerpX * 0.4, midY - 4);
      ctx.lineTo(cx + tiltLerpX * 0.4 + 4, midY);
      ctx.lineTo(cx + tiltLerpX * 0.4, midY + 4);
      ctx.lineTo(cx + tiltLerpX * 0.4 - 4, midY);
      ctx.closePath();
      ctx.fill();

      // -------------------------------------------------------------
      // 3. TOP TIER GROUP: 6 OBSIDIAN LEVITATING SLABS (API & Apps)
      // Levitate smoothly with levitateSpring + mouse parallax
      // -------------------------------------------------------------
      const topGroupBaseY = 160 + levitateSpring;
      const slabCount = 6;
      const slabSpacing = 14;

      for (let i = slabCount - 1; i >= 0; i--) {
        const slabY = topGroupBaseY - i * slabSpacing;
        const depthFactor = 0.5 + (slabCount - i) * 0.1;
        const slabX = cx + tiltLerpX * depthFactor;

        // Colors gradient from obsidian to rich navy
        const fillC = 'rgba(0, 17, 44, 0.1)';
        const strokeC = activeTier === 1 ? '#00D16A' : i === 0 ? 'rgba(255,255,255,.62)' : 'rgba(143,160,190,.55)';

        drawRhombus(slabX, slabY, 85, 42, fillC, strokeC, i === 0 ? 1.5 : 1.0);
      }

      // -------------------------------------------------------------
      // 4. PING PULSE RIPPLE EFFECT (playPing)
      // Outline rhombus radiating outward from the active layer
      // -------------------------------------------------------------
      if (pingState.current.active) {
        const ping = pingState.current;
        ping.scale += 0.012;
        ping.opacity -= 0.02;

        if (ping.opacity <= 0) {
          ping.active = false;
        } else {
          ctx.save();
          ctx.strokeStyle = `rgba(0, 209, 106, ${ping.opacity})`;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = '#00ff84';
          ctx.shadowBlur = 10;

          const pingRx = 85 * ping.scale;
          const pingRy = 42 * ping.scale;
          const pingY = topGroupBaseY - (slabCount - 1) * slabSpacing;
          const pingX = cx + tiltLerpX * 0.8;

          ctx.beginPath();
          ctx.moveTo(pingX, pingY - pingRy);
          ctx.lineTo(pingX + pingRx, pingY);
          ctx.lineTo(pingX, pingY + pingRy);
          ctx.lineTo(pingX - pingRx, pingY);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
      }

      // Architecture tier pointer annotations
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';

      // Tier 1 annotation
      const t1Y = topGroupBaseY - 30;
      ctx.strokeStyle = '#0abf53';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cx + 90, t1Y);
      ctx.lineTo(cx + 140, t1Y);
      ctx.stroke();
      ctx.fillText('Giao diện API & Apps', cx + 146, t1Y + 4);

      // Tier 2 annotation
      ctx.beginPath();
      ctx.moveTo(cx + 130, midY);
      ctx.lineTo(cx + 160, midY);
      ctx.stroke();
      ctx.fillText('Sổ Cái Kép & Split Engine', cx + 166, midY + 4);

      // Tier 3 annotation
      ctx.beginPath();
      ctx.moveTo(cx + 135, baseY);
      ctx.lineTo(cx + 165, baseY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#0abf53';
      ctx.fillText('Lõi Embedded Finance Core', cx + 171, baseY + 4);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      clearInterval(pingInterval);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [activeTier, onHoverTier]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '530px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '540px',
          height: '530px',
          maxWidth: '100%',
          display: 'block',
          cursor: 'pointer',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(3, 21, 51, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '0.74rem',
          fontFamily: 'monospace',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(0, 17, 44, 0.06)',
          pointerEvents: 'none',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0abf53' }} />
        <span>RÊ CHUỘT ĐỂ XOAY NGHIÊNG 3D • HIỆU ỨNG LEVITATION TỰ ĐỘNG</span>
      </div>
    </div>
  );
}

/**
 * =================================================================================
 * PHẦN 1: QUẢ CẦU 3D & LUÂN CHUYỂN DÒNG TIỀN (INTELLIGENT MONEY MOVEMENT)
 * Background: Adyen Midnight Navy (#00112c)
 * =================================================================================
 */
export function AdyenMoneyMovementSection() {
  return (
    <section
      id="intelligent-money-movement"
      className="adyen-money-section reveal-on-scroll"
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
        className="adyen-money-grid"
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
            className="adyen-money-panel"
            style={{
              background: '#041328',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '12px',
              padding: '42px 38px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
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
 * Background: Clean White (#ffffff)
 * =================================================================================
 */
export function AdyenPlatformsSection() {
  const [activeTier, setActiveTier] = useState(1);

  return (
    <section
      id="adyen-for-platforms"
      className="adyen-platform-section reveal-on-scroll"
      style={{
        borderTop: '1px solid rgba(0, 17, 44, 0.08)',
        borderBottom: '1px solid rgba(0, 17, 44, 0.08)',
        padding: '90px 32px 110px 32px',
        position: 'relative',
        backgroundColor: '#00112c',
      }}
    >
      <div className="adyen-platform-rail" aria-hidden="true"><b>1</b><span><i /></span><b>2</b></div>
      <div
        className="adyen-platform-grid"
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: '56px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: 3D Isometric Layered Stack with Levitation & Ping Pulse */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AdyenIsometricStack activeTier={activeTier} onHoverTier={setActiveTier} />
        </div>

        {/* Right Column: Platforms & Embedded Finance Details */}
        <div>
          <div
            className="adyen-platform-panel"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '16px',
              padding: '42px 38px',
              boxShadow: '0 20px 45px rgba(0, 17, 44, 0.06)',
            }}
          >
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
                color: '#ffffff',
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
                color: '#d4dbe5',
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
                color: '#ffffff',
                marginBottom: '38px',
                textDecoration: 'none',
              }}
            >
              <span>Khám phá Tài chính Nhúng (Embedded Finance)</span>
              <ArrowRight size={16} color="#0abf53" />
            </Link>

            {/* USE CASES List with interactive hover linking to 3D stack */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.14)', paddingTop: '24px' }}>
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
                USE CASES • TRƯỜNG HỢP SỬ DỤNG (RÊ CHUỘT ĐỂ XEM HIỆU ỨNG TẦNG)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link
                  href="/checkout"
                  onMouseEnter={() => setActiveTier(1)}
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
                    transition: 'all 0.2s ease',
                  }}
                  className="adyen-usecase"
                >
                  <span>Thanh toán nhúng trong nền tảng (Embedded Payments)</span>
                  <ArrowRight size={16} color="#0abf53" />
                </Link>

                <Link
                  href="/dashboard"
                  onMouseEnter={() => setActiveTier(2)}
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
                    transition: 'all 0.2s ease',
                  }}
                  className="adyen-usecase"
                >
                  <span>Tài trợ vốn & Tín dụng doanh nghiệp (Embedded Lending)</span>
                  <ArrowRight size={16} color="#0abf53" />
                </Link>

                <Link
                  href="/dashboard"
                  onMouseEnter={() => setActiveTier(3)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#00112c',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  className="adyen-usecase"
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
  const rootRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const moneySceneRef = useRef<HTMLDivElement | null>(null);
  const platformSceneRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const storyScrollRef = useRef<{ start: number; end: number } | null>(null);
  const [activeTier, setActiveTier] = useState(1);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(platformSceneRef.current, { autoAlpha: 0, y: 46, scale: .985, pointerEvents: 'none' });
        gsap.set(progressRef.current, { scaleY: 0, transformOrigin: 'top' });

        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: rootRef.current,
            pin: pinRef.current,
            start: 'top top',
            end: '+=155%',
            scrub: .85,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            snap: {
              snapTo: [0, 1],
              delay: .08,
              duration: { min: .18, max: .42 },
              ease: 'power2.inOut',
            },
          },
        });

        storyScrollRef.current = timeline.scrollTrigger || null;
        timeline
          .to(progressRef.current, { scaleY: 1, duration: 1 }, 0)
          .to(moneySceneRef.current, { autoAlpha: 0, y: -38, scale: .985, pointerEvents: 'none', duration: .34 }, .31)
          .to(platformSceneRef.current, { autoAlpha: 1, y: 0, scale: 1, pointerEvents: 'auto', duration: .38 }, .48);

        return () => {
          storyScrollRef.current = null;
          timeline.scrollTrigger?.kill();
          timeline.kill();
        };
      });

      media.add('(max-width: 900px), (prefers-reduced-motion: reduce)', () => {
        gsap.set([moneySceneRef.current, platformSceneRef.current, progressRef.current], { clearProps: 'all' });
      });
    }, rootRef);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  const goToScene = (scene: 0 | 1) => {
    const trigger = storyScrollRef.current;
    if (!trigger) {
      (scene === 0 ? moneySceneRef.current : platformSceneRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const progress = scene === 0 ? .04 : .93;
    window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: 'smooth' });
  };

  return (
    <section ref={rootRef} id="platform-story" className="adyen-product-story" aria-label="Nền tảng NovaGate">
      <div ref={pinRef} className="adyen-product-story-pin">
        <div className="adyen-story-rail" aria-hidden="true">
          <b>1</b><span><i ref={progressRef} /></span><b>2</b>
        </div>

        <div ref={moneySceneRef} className="adyen-story-scene adyen-story-money">
          <div className="adyen-story-visual"><AdyenGlobeOrbital /></div>
          <div className="adyen-story-panel-stack">
            <article className="adyen-story-panel">
              <span className="adyen-story-kicker">INTELLIGENT MONEY MOVEMENT</span>
              <div className="adyen-story-copy">
                <h2>Luân chuyển dòng tiền xuyên suốt doanh nghiệp</h2>
                <p>Tối ưu doanh thu bằng thanh toán hợp nhất và chi trả tự động. Tiếp nhận, đối soát và điều chuyển nguồn vốn trên cùng một nền tảng.</p>
                <Link href="/dashboard">Khám phá luồng tiền thông minh <ArrowRight size={17} /></Link>
              </div>
              <div className="adyen-story-usecases">
                <span>TRƯỜNG HỢP SỬ DỤNG</span>
                <Link href="/checkout">Chấp nhận thanh toán <ArrowRight size={15} /></Link>
                <Link href="/operations">Chi trả và giải ngân tự động <ArrowRight size={15} /></Link>
                <Link href="/store">Thanh toán đa kênh <ArrowRight size={15} /></Link>
              </div>
            </article>
            <button type="button" className="adyen-story-collapsed" onClick={() => goToScene(1)}>
              NOVAGATE FOR PLATFORMS <span>+</span>
            </button>
          </div>
        </div>

        <div ref={platformSceneRef} className="adyen-story-scene adyen-story-platform">
          <div className="adyen-story-visual"><AdyenIsometricStack activeTier={activeTier} onHoverTier={setActiveTier} /></div>
          <div className="adyen-story-panel-stack">
            <button type="button" className="adyen-story-collapsed" onClick={() => goToScene(0)}>
              INTELLIGENT MONEY MOVEMENT <span>+</span>
            </button>
            <article className="adyen-story-panel">
              <span className="adyen-story-kicker">NOVAGATE FOR PLATFORMS</span>
              <div className="adyen-story-copy">
                <h2>Khởi chạy thanh toán và sản phẩm tài chính dưới thương hiệu riêng</h2>
                <p>Mở khóa nguồn doanh thu mới. Nhúng thanh toán, tài khoản, phát hành thẻ và cấp vốn kinh doanh chỉ với một lần tích hợp.</p>
                <Link href="/dashboard">Khám phá tài chính nhúng <ArrowRight size={17} /></Link>
              </div>
              <div className="adyen-story-usecases">
                <span>TRƯỜNG HỢP SỬ DỤNG</span>
                <Link href="/checkout" onMouseEnter={() => setActiveTier(1)}>Thanh toán nhúng <ArrowRight size={15} /></Link>
                <Link href="/dashboard" onMouseEnter={() => setActiveTier(2)}>Tài trợ vốn doanh nghiệp <ArrowRight size={15} /></Link>
                <Link href="/dashboard" onMouseEnter={() => setActiveTier(3)}>Tài khoản và thẻ doanh nghiệp <ArrowRight size={15} /></Link>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

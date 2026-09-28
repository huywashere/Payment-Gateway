'use client';

import Link from 'next/link';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const brands = [
  { name: 'toast', className: 'brand-toast' },
  { name: 'OpenAI', className: 'brand-openai' },
  { name: 'lululemon', className: 'brand-lululemon' },
  { name: 'ORACLE', className: 'brand-oracle' },
  { name: 'Spotify', className: 'brand-spotify' },
  { name: 'UNIQLO', className: 'brand-uniqlo' },
];

export function AdyenHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const noiseRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const reduceMotion = useReducedMotion();
  const rise = reduceMotion ? 0 : 24;

  useEffect(() => {
    const canvas = noiseRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    let animationFrame = 0;
    let lastFrame = -Infinity;
    let frameSeed = 0x4e4f5641;
    let isVisible = true;

    const random = () => {
      frameSeed ^= frameSeed << 13;
      frameSeed ^= frameSeed >>> 17;
      frameSeed ^= frameSeed << 5;
      return (frameSeed >>> 0) / 4294967296;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // A deliberately low-resolution buffer keeps the dots crisp and the
      // effect inexpensive even on large/retina screens.
      canvas.width = Math.max(1, Math.ceil(rect.width * .55));
      canvas.height = Math.max(1, Math.ceil(rect.height * .55));
      context.imageSmoothingEnabled = false;
    };

    const paintNoise = () => {
      const { width, height } = canvas;
      context.clearRect(0, 0, width, height);

      const image = context.createImageData(width, height);
      const pixels = image.data;
      const grainCount = Math.floor(width * height * .0125);

      for (let index = 0; index < grainCount; index += 1) {
        const x = Math.floor(random() * width);
        const y = Math.floor(random() * height);
        const offset = (y * width + x) * 4;
        const brightness = 180 + Math.floor(random() * 75);

        pixels[offset] = brightness;
        pixels[offset + 1] = Math.min(255, brightness + 7);
        pixels[offset + 2] = Math.min(255, brightness + 13);
        pixels[offset + 3] = 22 + Math.floor(random() * 74);
      }

      context.putImageData(image, 0, 0);
    };

    const render = (time: number) => {
      if (isVisible && (reduceMotion || !isPlaying || time - lastFrame >= 82)) {
        paintNoise();
        lastFrame = time;
      }

      if (!reduceMotion && isPlaying) animationFrame = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      paintNoise();
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0 });

    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    resize();
    paintNoise();
    if (!reduceMotion && isPlaying) animationFrame = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying, reduceMotion]);

  const toggleVideo = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else await video.play();
    setIsPlaying((playing) => !playing);
  };

  return (
    <section className="adyen-hero" aria-labelledby="hero-main-title">
      <motion.video
        ref={videoRef}
        id="hero-bg-video"
        className="adyen-hero-video"
        src="https://media.ffycdn.net/eu/adyen/tWdz1QtnMpB2yi7BNLam.mp4?format=mp4"
        poster="https://media.ffycdn.net/eu/adyen/tWdz1QtnMpB2yi7BNLam.mp4?format=webp"
        autoPlay
        loop
        muted
        playsInline
        initial={reduceMotion ? false : { scale: 1.055, opacity: .15 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="adyen-hero-overlay" aria-hidden="true" />
      <div className="adyen-hero-grain" aria-hidden="true" />
      <canvas ref={noiseRef} className="adyen-hero-noise" aria-hidden="true" />

      <motion.div
        className="adyen-hero-content"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: reduceMotion ? 0 : .09, delayChildren: reduceMotion ? 0 : .2 } },
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: rise }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .72, ease: [0.16, 1, 0.3, 1] }}>
          <Link className="adyen-spotlight" href="/dashboard">
            <i aria-hidden="true" />
            <span>THE SPOTLIGHT H1 2026</span>
            <b aria-hidden="true" />
            <strong>SÁU THÁNG ĐỔI MỚI SẢN PHẨM</strong>
          </Link>
        </motion.div>

        <motion.h1
          id="hero-main-title"
          className="adyen-hero-title"
          variants={{ hidden: { opacity: 0, y: rise }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: .78, ease: [0.16, 1, 0.3, 1] }}
        >
          Fintech you can bank on
        </motion.h1>

        <motion.p
          className="adyen-hero-subtitle"
          variants={{ hidden: { opacity: 0, y: rise }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: .78, ease: [0.16, 1, 0.3, 1] }}
        >
          Một nền tảng cho thanh toán, dữ liệu và sản phẩm tài chính.<br />
          Xây dựng để mở rộng cùng các doanh nghiệp hàng đầu.
        </motion.p>

        <motion.div
          className="adyen-hero-actions"
          variants={{ hidden: { opacity: 0, y: rise }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: .78, ease: [0.16, 1, 0.3, 1] }}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: .985 }}
        >
          <Link href="/checkout" id="btn-hero-talk">
            Tư vấn với đội ngũ <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="adyen-client-strip"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .8, delay: .65, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="adyen-brand-row" aria-label="Các thương hiệu sử dụng nền tảng thanh toán">
          {brands.map((brand, index) => (
            <motion.span
              key={brand.name}
              className={brand.className}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .5, delay: .76 + index * .06 }}
            >
              {brand.name}
            </motion.span>
          ))}
        </div>
        <motion.button
          type="button"
          className="adyen-video-toggle"
          onClick={toggleVideo}
          aria-label={isPlaying ? 'Tạm dừng video nền' : 'Phát video nền'}
          title={isPlaying ? 'Tạm dừng video' : 'Tiếp tục phát'}
          whileHover={reduceMotion ? undefined : { scale: 1.06 }}
          whileTap={reduceMotion ? undefined : { scale: .94 }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </motion.button>
      </motion.div>
    </section>
  );
}

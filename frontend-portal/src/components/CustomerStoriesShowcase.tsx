'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './CustomerStoriesShowcase.module.css';

const STORIES = [
  {
    brand: 'NOVA STYLE',
    sector: 'Thời trang đa kênh',
    metric: '+18,4%',
    metricLabel: 'tỷ lệ hoàn tất thanh toán',
    story: 'Tối ưu luồng checkout trên mọi thiết bị và giảm đáng kể số đơn bị bỏ dở.',
    image: '/showcase/merchant-fashion.webp',
    href: '/checkout',
  },
  {
    brand: 'MỘC TEA',
    sector: 'F&B và chuỗi cửa hàng',
    metric: '1,2 giây',
    metricLabel: 'xác nhận giao dịch VietQR',
    story: 'Đối soát đơn hàng ngay khi tiền về và đồng bộ trạng thái tới quầy bán hàng.',
    image: '/showcase/merchant-cafe.webp',
    href: '/store',
  },
  {
    brand: 'GOBOX',
    sector: 'Thương mại điện tử',
    metric: '99,98%',
    metricLabel: 'luồng giao dịch ổn định',
    story: 'Điều phối thanh toán và webhook trên một hạ tầng có khả năng mở rộng linh hoạt.',
    image: '/showcase/merchant-commerce.webp',
    href: '/operations',
  },
  {
    brand: 'PLAYVERSE',
    sector: 'Nội dung số và gaming',
    metric: '+12%',
    metricLabel: 'chuyển đổi thanh toán',
    story: 'Rút ngắn hành trình mua hàng bằng tokenization và trải nghiệm checkout liền mạch.',
    image: '/showcase/merchant-gaming.webp',
    href: '/acquirer',
  },
  {
    brand: 'VIVU',
    sector: 'Du lịch trực tuyến',
    metric: '24/7',
    metricLabel: 'đối soát tự động',
    story: 'Theo dõi thanh toán tập trung cho nhiều kênh đặt dịch vụ và nhiều đối tác vận hành.',
    image: '/showcase/merchant-travel.webp',
    href: '/dashboard',
  },
  {
    brand: 'MOVE+',
    sector: 'Fitness và subscription',
    metric: '2,4×',
    metricLabel: 'tốc độ xử lý đơn hàng',
    story: 'Hợp nhất Payment Link, thẻ và chuyển khoản để mở rộng mô hình hội viên định kỳ.',
    image: '/showcase/merchant-fitness.webp',
    href: '/payment-links',
  },
] as const;

const CARD_OFFSETS = [-3, -2, -1, 0, 1, 2, 3] as const;

function wrap(index: number) {
  return (index + STORIES.length) % STORIES.length;
}

export function CustomerStoriesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const activeStory = STORIES[activeIndex];

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActiveIndex((current) => wrap(current + 1)), 5200);
    return () => window.clearInterval(timer);
  }, [paused]);

  const selectRelative = (direction: number) => {
    setActiveIndex((current) => wrap(current + direction));
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 44) selectRelative(distance > 0 ? -1 : 1);
    touchStart.current = null;
  };

  return (
    <section
      id="customer-stories"
      className={styles.section}
      aria-labelledby="customer-stories-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.header}>
        <span className={styles.eyebrow}>CÂU CHUYỆN TĂNG TRƯỞNG</span>
        <h2 id="customer-stories-title">Đồng hành để bạn<br />xây điều tiếp theo</h2>
        <p>Cùng xem NovaGate giúp từng mô hình kinh doanh kết nối thanh toán, vận hành dữ liệu và mở rộng trải nghiệm khách hàng.</p>
      </div>

      <div
        className={styles.stage}
        onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
        onTouchEnd={handleTouchEnd}
      >
        {CARD_OFFSETS.map((offset) => {
          const storyIndex = wrap(activeIndex + offset);
          const story = STORIES[storyIndex];
          return (
            <button
              type="button"
              key={`${activeIndex}-${offset}-${story.image}`}
              className={styles.card}
              data-offset={offset}
              onClick={() => offset === 0 ? undefined : selectRelative(offset)}
              aria-label={offset === 0 ? `${story.brand}, câu chuyện đang hiển thị` : `Chuyển đến câu chuyện ${story.brand}`}
              aria-current={offset === 0 ? 'true' : undefined}
              tabIndex={Math.abs(offset) <= 2 ? 0 : -1}
            >
              <Image src={story.image} alt="" fill sizes="(max-width: 640px) 190px, 260px" priority={offset === 0} />
              <span className={styles.cardShade} />
              <span className={styles.cardLabel}>{story.brand}<small>{story.sector}</small></span>
            </button>
          );
        })}
      </div>

      <div className={styles.storyPanel} aria-live="polite">
        <button type="button" className={styles.arrow} onClick={() => selectRelative(-1)} aria-label="Câu chuyện trước">
          <ArrowLeft size={19} />
        </button>
        <div className={styles.storyCopy} key={activeStory.brand}>
          <span className={styles.demoFlag}>CASE STUDY MÔ PHỎNG</span>
          <strong>{activeStory.brand}</strong>
          <p><b>{activeStory.metric}</b> {activeStory.metricLabel}</p>
          <small>{activeStory.story}</small>
          <Link href={activeStory.href}>Xem luồng tương ứng <ArrowUpRight size={16} /></Link>
        </div>
        <button type="button" className={styles.arrow} onClick={() => selectRelative(1)} aria-label="Câu chuyện tiếp theo">
          <ArrowRight size={19} />
        </button>
      </div>

      <div className={styles.pagination} aria-label="Chọn câu chuyện khách hàng">
        {STORIES.map((story, index) => (
          <button
            type="button"
            key={story.brand}
            className={index === activeIndex ? styles.activeDot : ''}
            onClick={() => setActiveIndex(index)}
            aria-label={`Hiển thị ${story.brand}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          />
        ))}
      </div>
    </section>
  );
}

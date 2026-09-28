import Link from 'next/link';
import { ArrowUpRight, Check, CreditCard, ShieldCheck, Workflow } from 'lucide-react';
import styles from './BusinessModelsSection.module.css';

const BUSINESS_MODELS = [
  {
    title: 'Cổng thanh toán linh hoạt',
    description: 'Tích hợp API, VietQR, Payment Link và thẻ trên một luồng thống nhất. Doanh nghiệp toàn quyền kiểm soát vận hành, đối soát và trải nghiệm thanh toán.',
    features: ['API & Webhooks', 'VietQR động', 'Hosted Checkout'],
    href: '/checkout',
    action: 'Khám phá cổng thanh toán',
    icon: CreditCard,
    featured: false,
  },
  {
    title: 'Nền tảng điều phối',
    description: 'NovaGate điều phối vòng đời giao dịch từ xác thực, sổ cái kép, kiểm soát rủi ro đến đối soát. Phù hợp khi bạn muốn một nền tảng vận hành tập trung.',
    features: ['Ledger chính xác', 'Đối soát tự động', 'Quản trị tập trung'],
    href: '/dashboard',
    action: 'Mở Merchant Portal',
    icon: ShieldCheck,
    featured: true,
  },
  {
    title: 'Mô hình kết hợp',
    description: 'Kết hợp chuyển khoản ngân hàng, QR và acquirer theo từng kênh bán. Linh hoạt thay đổi processor mà không làm gián đoạn hệ thống lõi của doanh nghiệp.',
    features: ['Đa processor', 'Routing linh hoạt', 'Mở rộng từng giai đoạn'],
    href: '/store',
    action: 'Trải nghiệm luồng demo',
    icon: Workflow,
    featured: false,
  },
] as const;

export function BusinessModelsSection() {
  return (
    <section id="business-models" className={`${styles.section} reveal-on-scroll`} aria-labelledby="business-models-title">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>LỘ TRÌNH LINH HOẠT CHO DOANH NGHIỆP</span>
          <h2 id="business-models-title">Chọn mô hình vận hành,<br /> tăng trưởng theo cách của bạn</h2>
          <p>Bắt đầu với nhu cầu hiện tại và mở rộng khi doanh nghiệp sẵn sàng — cùng một hạ tầng NovaGate.</p>
        </header>

        <div className={styles.grid}>
          {BUSINESS_MODELS.map((model, index) => {
            const Icon = model.icon;
            return (
              <article
                key={model.title}
                className={`${styles.card} ${model.featured ? styles.featured : ''}`}
                style={{ '--card-index': index } as React.CSSProperties}
              >
                {model.featured && <span className={styles.badge}>Phổ biến</span>}
                <div className={styles.cardTop}>
                  <div className={styles.visual} aria-hidden="true">
                    <span className={styles.visualRing} />
                    <Icon size={30} strokeWidth={1.55} />
                    <i className={styles.nodeOne} />
                    <i className={styles.nodeTwo} />
                  </div>
                  <span className={styles.index} aria-hidden="true">0{index + 1}</span>
                </div>

                <h3>{model.title}</h3>
                <p className={styles.description}>{model.description}</p>

                <ul className={styles.features}>
                  {model.features.map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}
                </ul>

                <Link href={model.href} className={styles.link}>
                  {model.action}<ArrowUpRight size={17} />
                </Link>
              </article>
            );
          })}
        </div>

        <div className={styles.footnote}>
          <span><i /> Một nền tảng</span>
          <span><i /> Nhiều phương thức thanh toán</span>
          <span><i /> Có thể chuyển đổi mô hình bất cứ lúc nào</span>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  Link2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Webhook,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BankLogo } from '@/components/BankLogos';
import { PortalSkeleton } from '@/components/PortalFeedback';
import styles from './dashboard.module.css';

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
  clientSecret?: string;
};

type PrismaOverview = {
  merchant: { id: string; businessName: string } | null;
  ledgerAccounts: Array<{ accountCode: string; accountName: string; balance: number }>;
  stats: { totalIntents: number; totalOutboxEvents: number; totalWebhookDeliveries: number };
  transactions: Transaction[];
};

type Balance = { pending_balance: number; available_balance: number; dispute_reserve: number; total_balance: number };
type BankAccount = { id: string; bankCode: string; accountNumberMasked: string; accountName: string; status: string; defaultAccount: boolean };
type PaymentLink = { id: string; status: string; amount: number };
type Subscription = { plan: string; plan_name: string; payment_usage: number; payment_limit: number; period_end: string };
type WebhookEndpoint = { id: string; status: string; consecutiveFailures: number };
type Analytics = { generated_at:string; range_days:number; gross_volume:number; payment_count:number; succeeded_count:number; failed_count:number; success_rate:number; available_balance:number; pending_balance:number; unread_notifications:number; daily:Array<{date:string;count:number;amount:number}> };
type Range = 7 | 30 | 90;

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const compactMoney = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [overview, setOverview] = useState<PrismaOverview | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [range, setRange] = useState<Range>(30);
  const [asOf, setAsOf] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    const requests = await Promise.allSettled([
      getJson<Balance>('/api/gateway/v1/balance'),
      getJson<PrismaOverview>('/api/prisma/overview'),
      getJson<BankAccount[]>('/api/gateway/v1/bank_accounts'),
      getJson<PaymentLink[]>('/api/gateway/v1/payment_links'),
      getJson<Subscription>('/api/gateway/v1/organization/subscription'),
      getJson<WebhookEndpoint[]>('/api/gateway/v1/webhooks/endpoints'),
      getJson<Analytics>(`/api/gateway/v1/dashboard/overview?days=${range}`),
    ]);
    if (requests[0].status === 'fulfilled') setBalance(requests[0].value);
    if (requests[1].status === 'fulfilled') setOverview(requests[1].value);
    if (requests[2].status === 'fulfilled') setBankAccounts(requests[2].value);
    if (requests[3].status === 'fulfilled') setPaymentLinks(requests[3].value);
    if (requests[4].status === 'fulfilled') setSubscription(requests[4].value);
    if (requests[5].status === 'fulfilled') setWebhooks(requests[5].value);
    if (requests[6].status === 'fulfilled') setAnalytics(requests[6].value);
    const failed = requests.filter((request) => request.status === 'rejected').length;
    setAsOf(Date.now());
    setError(failed === requests.length ? 'Không thể kết nối các dịch vụ dashboard.' : failed ? `${failed} nguồn dữ liệu tạm thời chưa phản hồi.` : '');
    setLoading(false);
    setRefreshing(false);
  }, [range]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const stream = new EventSource('/api/gateway/v1/dashboard/events');
    const onSnapshot = (event: MessageEvent<string>) => {
      if (range !== 30) return;
      try { setAnalytics(JSON.parse(event.data) as Analytics); setAsOf(Date.now()); } catch { /* keep latest valid snapshot */ }
    };
    stream.addEventListener('snapshot', onSnapshot as EventListener);
    return () => stream.close();
  }, [range]);

  const transactions = useMemo(() => overview?.transactions || [], [overview]);
  const cutoff = asOf - range * 86_400_000;
  const rangedTransactions = transactions.filter((item) => new Date(item.createdAt).getTime() >= cutoff);
  const succeeded = rangedTransactions.filter((item) => item.status === 'SUCCEEDED');
  const grossVolume = analytics?.gross_volume ?? succeeded.reduce((total, item) => total + item.amount, 0);
  const successRate = analytics?.success_rate ?? (rangedTransactions.length ? Math.round((succeeded.length / rangedTransactions.length) * 1000) / 10 : 0);
  const openLinks = paymentLinks.filter((item) => item.status === 'OPEN').length;
  const activeWebhooks = webhooks.filter((item) => item.status === 'ACTIVE').length;
  const quotaPercent = subscription ? Math.min(100, Math.round((subscription.payment_usage / Math.max(1, subscription.payment_limit)) * 100)) : 0;
  const trend = useMemo(() => analytics?.range_days === range
    ? analytics.daily.map((item) => ({ key: item.date, label: new Date(`${item.date}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), amount: item.amount }))
    : buildTrend(transactions, range, asOf), [analytics, transactions, range, asOf]);
  const maxTrend = Math.max(...trend.map((item) => item.amount), 1);

  if (loading) {
    return <div className={styles.shell}><div className={styles.loadingHead}><span /><span /></div><PortalSkeleton rows={7} /></div>;
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>MERCHANT OVERVIEW</span>
          <h1>Xin chào, {overview?.merchant?.businessName || 'TechStore Vietnam'}</h1>
          <p>Theo dõi hiệu suất thanh toán và vận hành tài chính của doanh nghiệp.</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.rangePicker}>{([7, 30, 90] as Range[]).map((value) => <button key={value} data-active={range === value} onClick={() => setRange(value)}>{value} ngày</button>)}</div>
          <button type="button" className={styles.refresh} onClick={() => void refresh(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? styles.spinning : ''} /> Làm mới</button>
        </div>
      </header>

      {error && <div className={styles.warning}><Activity size={16} /><span>{error} Các phần còn lại vẫn sử dụng dữ liệu mới nhất.</span></div>}

      <section className={styles.metrics}>
        <MetricCard icon={<Wallet size={20} />} label="Số dư khả dụng" value={money.format(analytics?.available_balance ?? balance?.available_balance ?? 0)} detail={`${money.format(analytics?.pending_balance ?? balance?.pending_balance ?? 0)} đang chờ`} tone="green" />
        <MetricCard icon={<TrendingUp size={20} />} label="Doanh số thành công" value={money.format(grossVolume)} detail={`${analytics?.succeeded_count ?? succeeded.length} giao dịch trong ${range} ngày`} tone="blue" />
        <MetricCard icon={<CreditCard size={20} />} label="Tỷ lệ thành công" value={`${successRate}%`} detail={`${analytics?.failed_count ?? (rangedTransactions.length - succeeded.length)} giao dịch cần theo dõi`} tone="violet" />
        <MetricCard icon={<Link2 size={20} />} label="Payment Links" value={String(paymentLinks.length)} detail={`${openLinks} liên kết đang chờ thanh toán`} tone="amber" />
      </section>

      <section className={styles.analyticsGrid}>
        <article className={`${styles.card} ${styles.trendCard}`}>
          <div className={styles.cardHeader}>
            <div><small>DÒNG TIỀN</small><h2>Xu hướng giao dịch</h2><p>Doanh số đã xác nhận trong {range} ngày gần nhất.</p></div>
            <div className={styles.legend}><i /><span>Thành công</span></div>
          </div>
          <div className={styles.chartSummary}><strong>{money.format(grossVolume)}</strong><span><ArrowUpRight size={14} /> Dữ liệu sổ cái</span></div>
          <div className={styles.chart}>
            <div className={styles.gridLines}><i /><i /><i /><i /></div>
            <div className={styles.bars}>{trend.map((item) => <div className={styles.barSlot} key={item.key}><div className={styles.bar} style={{ height: `${Math.max(item.amount ? 8 : 2, (item.amount / maxTrend) * 100)}%` }}><span>{money.format(item.amount)}</span></div><small>{item.label}</small></div>)}</div>
          </div>
        </article>

        <article className={`${styles.card} ${styles.todayCard}`}>
          <div className={styles.cardHeader}><div><small>REALTIME</small><h2>Hoạt động hôm nay</h2></div><span className={styles.live}><i /> LIVE</span></div>
          <div className={styles.ringWrap}>
            <div className={styles.ring} style={{ '--rate': `${Math.max(successRate, 4) * 3.6}deg` } as React.CSSProperties}><div><strong>{successRate}%</strong><small>thành công</small></div></div>
          </div>
          <div className={styles.todayStats}>
            <div><span>Payment intents</span><b>{overview?.stats.totalIntents || 0}</b></div>
            <div><span>Webhook deliveries</span><b>{overview?.stats.totalWebhookDeliveries || 0}</b></div>
            <div><span>Sự kiện đang xử lý</span><b>{overview?.stats.totalOutboxEvents || 0}</b></div>
          </div>
        </article>
      </section>

      <section className={styles.detailGrid}>
        <article className={`${styles.card} ${styles.transactions}`}>
          <div className={styles.cardHeader}><div><small>GẦN ĐÂY</small><h2>Giao dịch mới nhất</h2></div><Link href="/operations">Xem tất cả <ArrowRight size={14} /></Link></div>
          <div className={styles.table}>
            <div className={styles.tableHead}><span>Giao dịch</span><span>Thời gian</span><span>Số tiền</span><span>Trạng thái</span></div>
            {transactions.length === 0 ? <div className={styles.empty}><CreditCard size={24} /><b>Chưa có giao dịch</b><span>Giao dịch sandbox mới sẽ xuất hiện tại đây.</span></div> : transactions.slice(0, 7).map((transaction) => <div className={styles.tableRow} key={transaction.id}>
              <span><b>{transaction.description || 'Thanh toán NovaGate'}</b><small>{transaction.id.slice(0, 16)}...</small></span>
              <span>{new Date(transaction.createdAt).toLocaleDateString('vi-VN')}<small>{new Date(transaction.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small></span>
              <strong>{money.format(transaction.amount)}</strong>
              <Status status={transaction.status} />
            </div>)}
          </div>
        </article>

        <div className={styles.sideStack}>
          <article className={styles.card}>
            <div className={styles.cardHeader}><div><small>HÀNH ĐỘNG NHANH</small><h2>Bắt đầu giao dịch</h2></div></div>
            <div className={styles.quickActions}>
              <Link href="/payment-links"><span><QrCode size={18} /></span><div><b>Tạo Payment Link</b><small>QR riêng cho từng đơn hàng</small></div><ArrowRight size={15} /></Link>
              <Link href="/store"><span><CreditCard size={18} /></span><div><b>Thanh toán thử</b><small>Chạy luồng checkout sandbox</small></div><ArrowRight size={15} /></Link>
              <Link href="/developers"><span><Webhook size={18} /></span><div><b>Cấu hình Webhook</b><small>Nhận sự kiện giao dịch</small></div><ArrowRight size={15} /></Link>
            </div>
          </article>
          <article className={styles.card}>
            <div className={styles.cardHeader}><div><small>TRẠNG THÁI</small><h2>Dịch vụ hệ thống</h2></div><ShieldCheck size={19} /></div>
            <div className={styles.services}>
              <Service label="Payment Core" status="Hoạt động" />
              <Service label="VietQR & Matching" status="Hoạt động" />
              <Service label="Webhook delivery" status={`${activeWebhooks}/${webhooks.length} endpoint`} />
              <Service label="Ledger & đối soát" status="Đồng bộ" />
            </div>
          </article>
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}><div><small>TÀI KHOẢN NHẬN TIỀN</small><h2>Ngân hàng đã kết nối</h2></div><Link href="/payment-links">Quản lý <ArrowRight size={14} /></Link></div>
          <div className={styles.bankList}>{bankAccounts.length === 0 ? <div className={styles.empty}><Landmark size={24} /><b>Chưa có tài khoản ngân hàng</b><span>Thêm tài khoản sandbox để tạo VietQR.</span></div> : bankAccounts.slice(0, 4).map((account) => <div className={styles.bankRow} key={account.id}><BankLogo code={account.bankCode} size={30} /><div><b>{account.accountNumberMasked}</b><small>{account.accountName}</small></div><span data-status={account.status}>{account.defaultAccount ? 'Mặc định' : account.status}</span></div>)}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}><div><small>GÓI DỊCH VỤ</small><h2>{subscription?.plan_name || subscription?.plan || 'Sandbox Free'}</h2></div><Building2 size={19} /></div>
          <div className={styles.planUsage}><div><span>Giao dịch tháng này</span><b>{subscription?.payment_usage || 0} / {subscription?.payment_limit || 0}</b></div><i><b style={{ width: `${quotaPercent}%` }} /></i><small>{quotaPercent}% hạn mức đã sử dụng · Chu kỳ kết thúc {subscription?.period_end ? new Date(subscription.period_end).toLocaleDateString('vi-VN') : '—'}</small></div>
          <Link className={styles.planLink} href="/organization">Xem gói và hạn mức <ArrowRight size={14} /></Link>
        </article>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className={styles.metric} data-tone={tone}><div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div><i>{icon}</i></article>;
}

function Status({ status }: { status: string }) {
  const success = status === 'SUCCEEDED';
  const failed = status === 'FAILED' || status === 'CANCELED';
  return <span className={styles.status} data-status={success ? 'success' : failed ? 'failed' : 'pending'}>{success ? <CheckCircle2 size={13} /> : failed ? <XCircle size={13} /> : <Clock3 size={13} />}{success ? 'Thành công' : failed ? 'Thất bại' : 'Đang xử lý'}</span>;
}

function Service({ label, status }: { label: string; status: string }) {
  return <div><span><i />{label}</span><b>{status}</b></div>;
}

function buildTrend(transactions: Transaction[], range: Range, now: number) {
  const buckets = range === 7 ? 7 : 10;
  const span = range / buckets;
  return Array.from({ length: buckets }, (_, index) => {
    const start = now - (range - index * span) * 86_400_000;
    const end = now - (range - (index + 1) * span) * 86_400_000;
    const amount = transactions.filter((item) => {
      const timestamp = new Date(item.createdAt).getTime();
      return item.status === 'SUCCEEDED' && timestamp >= start && timestamp < end;
    }).reduce((total, item) => total + item.amount, 0);
    return { key: `${range}-${index}`, amount, label: new Date(end).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), compact: compactMoney.format(amount) };
  });
}

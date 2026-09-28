'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, Plus, RefreshCw, RotateCcw, ShieldAlert } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PortalEmpty, PortalSkeleton, PortalToast } from '@/components/PortalFeedback';
import styles from './platform.module.css';

type Merchant = { id: string; businessName: string; legalName?: string; email: string; status: string; onboardingStatus: string; kybStatus: string; plan: string; createdAt: string };
type Readiness = Record<string, unknown>;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/gateway/${path}`, { cache: 'no-store', ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
  return payload as T;
}

export default function PlatformPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [readiness, setReadiness] = useState<Readiness>({});
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState('');
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);
  const [newMerchant, setNewMerchant] = useState({ businessName: '', email: '' });

  const refresh = useCallback(async () => {
    try {
      const [merchantData, readinessData] = await Promise.all([
        api<Merchant[]>('v1/platform/merchants'),
        api<Readiness>('v1/platform/operations/readiness'),
      ]);
      setMerchants(merchantData);
      setReadiness(readinessData);
    } catch (error) {
      setToast({ message: String(error), tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const action = async (message: string, work: () => Promise<unknown>) => {
    try {
      await work();
      setToast({ message });
      await refresh();
    } catch (error) {
      setToast({ message: String(error), tone: 'error' });
    }
  };

  const create = (event: FormEvent) => {
    event.preventDefault();
    void action('Đã tạo merchant sandbox.', async () => {
      const result = await api<Record<string, string>>('v1/platform/merchants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMerchant) });
      setSecret(`Secret key: ${result.testSecretKey}\nPublishable key: ${result.testPublishableKey}\nWebhook secret: ${result.webhookSigningSecret}`);
      setNewMerchant({ businessName: '', email: '' });
    });
  };

  const update = (merchant: Merchant, patch: Record<string, string>) => action('Đã cập nhật merchant.', () => api(`v1/platform/merchants/${merchant.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }));
  const resetSandbox = () => {
    if (!window.confirm('Soft reset sẽ đóng Payment Link đang mở, tắt webhook và lời mời đang chờ. Lịch sử tài chính vẫn được giữ. Tiếp tục?')) return;
    void action('Đã reset cấu hình sandbox; lịch sử tài chính được giữ nguyên.', () => api('v1/sandbox/reset', { method: 'POST' }));
  };

  return <main className={styles.shell}>
    <Link className={styles.back} href="/dashboard"><ArrowLeft size={16} /> Bảng điều khiển</Link>
    <header className={styles.header}>
      <div><span>QUẢN TRỊ NỀN TẢNG</span><h1>Vận hành merchant</h1><p>Kiểm soát onboarding, KYB và trạng thái tài khoản trong môi trường project.</p></div>
      <div><button className="btn-glass" onClick={resetSandbox}><RotateCcw size={16} /> Reset sandbox</button><button className="btn-glass" onClick={() => void refresh()}><RefreshCw size={16} /> Làm mới</button></div>
    </header>
    <section className={styles.readiness}><ShieldAlert size={22} /><div><small>TRẠNG THÁI SẴN SÀNG</small><b>{String(readiness.status || readiness.overall_status || 'SANDBOX')}</b></div>{Object.entries(readiness).slice(0, 5).map(([key, value]) => <span key={key}><small>{key.replaceAll('_', ' ')}</small><b>{typeof value === 'object' ? 'sẵn sàng' : String(value)}</b></span>)}</section>
    <div className={styles.grid}>
      <section className={styles.card}><div className={styles.title}><h2><Plus size={18} /> Tạo merchant</h2></div><form onSubmit={create}><label>Tên doanh nghiệp<input required value={newMerchant.businessName} onChange={(event) => setNewMerchant({ ...newMerchant, businessName: event.target.value })} /></label><label>Email chủ sở hữu<input type="email" required value={newMerchant.email} onChange={(event) => setNewMerchant({ ...newMerchant, email: event.target.value })} /></label><button className="btn-adyen-green">Tạo merchant sandbox</button></form>{secret && <pre className={styles.secret}>{secret}</pre>}</section>
      <section className={styles.card}><div className={styles.title}><h2><Building2 size={18} /> Merchants</h2><small>{merchants.length} tài khoản</small></div>{loading ? <PortalSkeleton /> : merchants.length === 0 ? <PortalEmpty title="Chưa có merchant" /> : <div className={styles.merchants}>{merchants.map((merchant) => <article key={merchant.id}><header><div><b>{merchant.businessName}</b><small>{merchant.email}</small></div><span data-status={merchant.status}>{merchant.status}</span></header><div className={styles.fields}><label>KYB<select value={merchant.kybStatus} onChange={(event) => void update(merchant, { kybStatus: event.target.value })}><option>NOT_STARTED</option><option>PENDING</option><option>VERIFIED</option><option>REJECTED</option></select></label><label>Onboarding<select value={merchant.onboardingStatus} onChange={(event) => void update(merchant, { onboardingStatus: event.target.value })}><option>PENDING</option><option>ACTIVE</option><option>BLOCKED</option></select></label><label>Trạng thái<select value={merchant.status} onChange={(event) => void update(merchant, { status: event.target.value })}><option>ACTIVE</option><option>SUSPENDED</option><option>CLOSED</option></select></label></div><footer><code>{merchant.id}</code><small>Gói {merchant.plan}</small></footer></article>)}</div>}</section>
    </div>
    {toast && <PortalToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
  </main>;
}

'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Crown, Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PortalEmpty, PortalSkeleton, PortalToast } from '@/components/PortalFeedback';
import styles from './organization.module.css';

type Member = { id: string; email: string; displayName?: string; role: string; status: string; invitedAt: string };
type Plan = { code: string; displayName: string; monthlyPrice: number; monthlyPaymentLimit: number; bankAccountLimit: number; webhookEndpointLimit: number; retentionDays: number };
type Subscription = { plan: string; plan_name: string; status: string; monthly_price: number; payment_usage: number; payment_limit: number; bank_account_usage: number; bank_account_limit: number; webhook_endpoint_usage: number; webhook_endpoint_limit: number; period_end: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/gateway/${path}`, { cache: 'no-store', ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
  return payload as T;
}

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';

export default function OrganizationPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);
  const [invite, setInvite] = useState({ email: '', displayName: '', role: 'DEVELOPER' });

  const refresh = useCallback(async () => {
    try {
      const [memberData, planData, subscriptionData] = await Promise.all([
        api<Member[]>('v1/organization/members'),
        api<Plan[]>('v1/organization/plans'),
        api<Subscription>('v1/organization/subscription'),
      ]);
      setMembers(memberData);
      setPlans(planData);
      setSubscription(subscriptionData);
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

  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    void action('Đã gửi lời mời thành viên.', () => api('v1/organization/members', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invite),
    }));
  };

  return <main className={styles.shell}>
    <Link className={styles.back} href="/dashboard"><ArrowLeft size={16} /> Bảng điều khiển</Link>
    <header className={styles.header}>
      <div><span>TỔ CHỨC & GÓI DỊCH VỤ</span><h1>Đội ngũ và hạn mức sử dụng</h1><p>Quản lý vai trò, quota sandbox và vòng đời thành viên trong một tổ chức.</p></div>
      <button className="btn-glass" onClick={() => void refresh()}><RefreshCw size={16} /> Làm mới</button>
    </header>
    {loading || !subscription ? <PortalSkeleton rows={3} /> : <section className={styles.usage}>
      <div><Crown size={21} /><span><small>Gói hiện tại</small><b>{subscription.plan_name}</b><em>Gia hạn {new Date(subscription.period_end).toLocaleDateString('vi-VN')}</em></span></div>
      <Quota label="Giao dịch" value={subscription.payment_usage} limit={subscription.payment_limit} />
      <Quota label="Tài khoản ngân hàng" value={subscription.bank_account_usage} limit={subscription.bank_account_limit} />
      <Quota label="Webhook" value={subscription.webhook_endpoint_usage} limit={subscription.webhook_endpoint_limit} />
    </section>}
    <div className={styles.grid}>
      <section className={styles.card}>
        <div className={styles.title}><h2><Users size={19} /> Thành viên</h2><small>{members.length} người</small></div>
        <form className={styles.invite} onSubmit={submitInvite}>
          <input type="email" required placeholder="email@company.vn" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} />
          <input placeholder="Tên hiển thị" value={invite.displayName} onChange={(event) => setInvite({ ...invite, displayName: event.target.value })} />
          <select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value })}><option>DEVELOPER</option><option>FINANCE</option><option>AUDITOR</option><option>OWNER</option></select>
          <button className="btn-adyen-green"><Plus size={15} /> Mời</button>
        </form>
        {loading ? <PortalSkeleton /> : members.length === 0 ? <PortalEmpty title="Chưa có thành viên" /> : <div className={styles.members}>{members.map((member) => <article key={member.id}>
          <span>{(member.displayName || member.email).slice(0, 2).toUpperCase()}</span>
          <div><b>{member.displayName || member.email}</b><small>{member.email}</small></div>
          <select value={member.role} disabled={member.role === 'OWNER'} onChange={(event) => void action('Đã cập nhật vai trò.', () => api(`v1/organization/members/${member.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: event.target.value }) }))}>{['OWNER', 'DEVELOPER', 'FINANCE', 'AUDITOR'].map((role) => <option key={role}>{role}</option>)}</select>
          <button data-status={member.status} disabled={member.role === 'OWNER'} title={member.role === 'OWNER' ? 'Phải luôn duy trì ít nhất một owner hoạt động' : undefined} onClick={() => void action('Đã cập nhật trạng thái thành viên.', () => api(`v1/organization/members/${member.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: member.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED' }) }))}>{member.status}</button>
        </article>)}</div>}
      </section>
      <section className={styles.card}>
        <div className={styles.title}><h2><ShieldCheck size={19} /> Gói sandbox</h2></div>
        <div className={styles.plans}>{plans.map((plan) => <article data-current={subscription?.plan === plan.code} key={plan.code}>
          <header><div><small>{plan.code}</small><h3>{plan.displayName}</h3></div>{subscription?.plan === plan.code && <Check size={19} />}</header>
          <strong>{plan.monthlyPrice ? money(plan.monthlyPrice) : 'Miễn phí'}<small>/ tháng</small></strong>
          <ul><li>{plan.monthlyPaymentLimit.toLocaleString('vi-VN')} giao dịch</li><li>{plan.bankAccountLimit} tài khoản ngân hàng</li><li>{plan.webhookEndpointLimit} webhook</li><li>Lưu dữ liệu {plan.retentionDays} ngày</li></ul>
          <button disabled={subscription?.plan === plan.code} onClick={() => void action(`Đã chuyển sang gói ${plan.displayName}.`, () => api('v1/organization/subscription', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: plan.code }) }))}>{subscription?.plan === plan.code ? 'Đang sử dụng' : 'Chọn gói sandbox'}</button>
        </article>)}</div>
      </section>
    </div>
    {toast && <PortalToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
  </main>;
}

function Quota({ label, value, limit }: { label: string; value: number; limit: number }) {
  const percent = Math.min(100, Math.round((value / Math.max(1, limit)) * 100));
  return <div className={styles.quota}><span><small>{label}</small><b>{value.toLocaleString('vi-VN')} / {limit.toLocaleString('vi-VN')}</b></span><i><b style={{ width: `${percent}%` }} /></i></div>;
}

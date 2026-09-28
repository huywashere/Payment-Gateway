'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, Download, ExternalLink, Link2, Plus, RefreshCw, WalletCards } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import styles from './payment-links.module.css';

type BankAccount = { id: string; bankCode: string; accountNumberMasked: string; accountName: string; status: string; defaultAccount: boolean };
type PaymentLink = { id: string; slug: string; paymentCode: string; amount: number; description: string; status: string; bankCode: string; expiresAt: string; paymentUrl: string };
type BankTransaction = { id: string; bankCode: string; externalReference: string; amount: number; description?: string; paymentCode?: string; matchStatus: string; receivedAt: string };
type Subscription = { plan: string; payment_usage: number; payment_limit: number; bank_account_usage: number; bank_account_limit: number };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/gateway/${path}`, { cache: 'no-store', ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
  return payload as T;
}

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';

export default function PaymentLinksPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [amount, setAmount] = useState(250000);
  const [description, setDescription] = useState('Thanh toán đơn hàng #AP-2026');
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [bankData, linkData, transactionData, subscriptionData] = await Promise.all([
        api<BankAccount[]>('v1/bank_accounts'), api<PaymentLink[]>('v1/payment_links'),
        api<BankTransaction[]>('v1/bank_transactions?limit=20'), api<Subscription>('v1/organization/subscription'),
      ]);
      setAccounts(bankData); setLinks(linkData); setTransactions(transactionData); setSubscription(subscriptionData); setMessage('');
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : String(reason)); }
  }, []);

  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); return () => clearTimeout(timer); }, [refresh]);

  const create = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      const account = accounts.find((item) => item.defaultAccount) || accounts[0];
      await api<PaymentLink>('v1/payment_links', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ amount, currency: 'VND', description, bankAccountId: account?.id, expiresInMinutes: minutes, paymentCodePrefix: 'PAY' }) });
      await refresh();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : String(reason)); } finally { setBusy(false); }
  };

  return (
    <main className={styles.shell}>
      <Link href="/dashboard" className={styles.back}><ArrowLeft size={16} /> Merchant Dashboard</Link>
      <header className={styles.header}><div><span>VIETQR COMMERCE</span><h1>Payment links</h1><p>Tạo QR riêng cho từng đơn hàng, nhận giao dịch ngân hàng và đối soát tự động.</p></div><button onClick={() => void refresh()} className="btn-glass"><RefreshCw size={16} /> Làm mới</button></header>
      {message && <div className={styles.error}>{message}</div>}
      <section className={styles.stats}>
        <Stat icon={<Link2 size={19} />} label="Liên kết" value={String(links.length)} detail={`${links.filter((item) => item.status === 'OPEN').length} đang chờ`} />
        <Stat icon={<Building2 size={19} />} label="Tài khoản nhận" value={String(accounts.length)} detail={accounts[0]?.bankCode || 'Chưa kết nối'} />
        <Stat icon={<WalletCards size={19} />} label="Gói hiện tại" value={subscription?.plan || 'FREE'} detail={`${subscription?.payment_usage || 0}/${subscription?.payment_limit || 0} giao dịch`} />
      </section>
      <div className={styles.grid}>
        <section className={styles.card}><div className={styles.cardTitle}><div><small>TẠO MỚI</small><h2>Liên kết thanh toán</h2></div><Plus size={20} /></div><form onSubmit={create} className={styles.form}><label>Số tiền<input type="number" min={1000} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label><label>Mô tả<input value={description} maxLength={255} onChange={(event) => setDescription(event.target.value)} /></label><label>Thời hạn<select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}><option value={15}>15 phút</option><option value={30}>30 phút</option><option value={60}>1 giờ</option><option value={1440}>24 giờ</option></select></label><div className={styles.account}>{accounts.length ? <><b>{accounts.find((item) => item.defaultAccount)?.bankCode || accounts[0].bankCode}</b><span>{accounts.find((item) => item.defaultAccount)?.accountNumberMasked || accounts[0].accountNumberMasked}<small>{accounts.find((item) => item.defaultAccount)?.accountName || accounts[0].accountName}</small></span></> : <span>Chưa có tài khoản nhận tiền</span>}</div><button className="btn-adyen-green" disabled={busy || !accounts.length}>{busy ? 'Đang tạo…' : 'Tạo Payment Link'}</button></form></section>
      <section className={`${styles.card} ${styles.links}`}><div className={styles.cardTitle}><div><small>GẦN ĐÂY</small><h2>Payment links</h2></div></div>{links.length === 0 ? <Empty text="Chưa có liên kết thanh toán." /> : links.slice(0, 10).map((item) => <article key={item.id} className={styles.linkRow}><div><b>{money(item.amount)}</b><small>{item.description}</small><code>{item.paymentCode}</code></div><div><span data-status={item.status}>{item.status}</span><small>{new Date(item.expiresAt).toLocaleString('vi-VN')}</small><Link href={`/payment-links/${item.id}`}>Chi tiết <ExternalLink size={13} /></Link></div></article>)}</section>
      </div>
      <section className={`${styles.card} ${styles.transactions}`}><div className={styles.cardTitle}><div><small>TRANSACTION INBOX</small><h2>Đối soát ngân hàng</h2></div><a className="btn-glass" href="/api/gateway/v1/reports/transactions.csv"><Download size={15} /> CSV</a></div><div className={styles.table}><div className={styles.tableHead}><span>Ngân hàng / reference</span><span>Nội dung</span><span>Số tiền</span><span>Matching</span></div>{transactions.length === 0 ? <Empty text="Chưa nhận giao dịch ngân hàng." /> : transactions.map((item) => <Link href={`/transactions/${item.id}`} className={styles.tableRow} key={item.id}><span><b>{item.bankCode}</b><small>{item.externalReference}</small></span><span><b>{item.paymentCode || '—'}</b><small>{item.description || 'Không có nội dung'}</small></span><strong>{money(item.amount)}</strong><i data-status={item.matchStatus}>{item.matchStatus}</i></Link>)}</div></section>
    </main>
  );
}

function Stat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <article className={styles.stat}><i>{icon}</i><span><small>{label}</small><b>{value}</b><em>{detail}</em></span></article>; }
function Empty({ text }: { text: string }) { return <p className={styles.empty}>{text}</p>; }

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, CheckCircle2, Clock3, Copy, Landmark, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BankLogo } from '@/components/BankLogos';
import styles from './payment-link.module.css';

type PaymentLink = {
  slug: string;
  paymentCode: string;
  amount: number;
  currency: string;
  description: string;
  status: 'OPEN' | 'PAID' | 'EXPIRED' | 'CANCELED';
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  expiresAt: string;
  paidAt?: string;
};

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function PaymentLinkClient({ slug }: { slug: string }) {
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [realtime, setRealtime] = useState<'connecting' | 'live' | 'fallback'>('connecting');

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/gateway/v1/payment_links/public/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(response.status === 404 ? 'Liên kết thanh toán không tồn tại.' : 'Không tải được trạng thái thanh toán.');
    const value = (await response.json()) as PaymentLink;
    setLink(value);
    return value.status;
  }, [slug]);

  useEffect(() => {
    let active = true;
    let fallbackTimer: ReturnType<typeof setInterval> | undefined;
    let events: EventSource | undefined;
    const start = async () => {
      try {
        const status = await refresh();
        if (!active || status !== 'OPEN') return;
        events = new EventSource(`/api/gateway/v1/payment_links/public/${encodeURIComponent(slug)}/events`);
        events.addEventListener('payment_link.status', (message) => {
          const update = JSON.parse((message as MessageEvent).data) as { status: PaymentLink['status']; paidAt?: string };
          setRealtime('live');
          setLink((current) => current ? { ...current, status: update.status, paidAt: update.paidAt || current.paidAt } : current);
          if (update.status !== 'OPEN') events?.close();
        });
        events.onerror = () => setRealtime('fallback');
        fallbackTimer = setInterval(() => void refresh().catch(() => undefined), 15_000);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải liên kết.');
      }
    };
    void start();
    return () => {
      active = false;
      events?.close();
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [refresh, slug]);

  const copy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(''), 1400);
  };

  if (error) {
    return <section className={styles.shell}><div className={styles.stateCard}><h1>Không mở được trang thanh toán</h1><p>{error}</p><Link href="/">Về trang chủ</Link></div></section>;
  }
  if (!link) {
    return <section className={styles.shell}><div className={styles.loading}><LoaderCircle size={30} /><span>Đang tạo phiên thanh toán an toàn…</span></div></section>;
  }
  if (link.status === 'PAID') {
    return <section className={styles.shell}><div className={styles.successCard}><span className={styles.successIcon}><CheckCircle2 size={42} /></span><small>GIAO DỊCH ĐÃ XÁC NHẬN</small><h1>Thanh toán thành công</h1><strong>{money.format(link.amount)}</strong><p>Ngân hàng đã xác nhận giao dịch. Bạn có thể đóng trang này an toàn.</p><div className={styles.reference}><span>Nội dung</span><b>{link.paymentCode}</b></div></div></section>;
  }
  if (link.status !== 'OPEN') {
    return <section className={styles.shell}><div className={styles.stateCard}><Clock3 size={38} /><h1>Liên kết đã hết hiệu lực</h1><p>Vui lòng yêu cầu người bán tạo một liên kết thanh toán mới.</p></div></section>;
  }

  return (
    <section className={styles.shell}>
      <div className={styles.checkout}>
        <aside className={styles.summary}>
          <div className={styles.brand}><span>novagate</span><i>PAYMENT LINK</i></div>
          <div className={styles.merchant}><Landmark size={18} /><span><small>Thanh toán cho</small><b>{link.accountName}</b></span></div>
          <div className={styles.total}><small>Tổng thanh toán</small><strong>{money.format(link.amount)}</strong><p>{link.description}</p></div>
          <div className={styles.secure}><ShieldCheck size={18} /><span><b>Bảo vệ giao dịch</b><small>Mã QR riêng biệt, tự động đối soát theo nội dung chuyển khoản.</small></span></div>
        </aside>
        <div className={styles.payment}>
          <header><span className={styles.liveDot} /><div><small>QUÉT MÃ VIETQR</small><h1>Chuyển khoản ngân hàng</h1></div></header>
          <div className={styles.qrFrame}>
            <Image unoptimized priority src={`/api/gateway/v1/payment_links/public/${encodeURIComponent(slug)}/qr.svg?size=420`} alt={`VietQR thanh toán ${link.paymentCode}`} width={300} height={300} />
          </div>
          <p className={styles.hint}>Mở ứng dụng ngân hàng và quét mã. Trang sẽ tự cập nhật khi nhận được tiền.</p>
          <div className={styles.details}>
            <BankCopyRow bankCode={link.bankCode} bankName={link.bankName} copied={copied === 'bank'} onCopy={() => copy(link.bankCode, 'bank')} />
            <CopyRow label="Số tài khoản" value={link.accountNumber} copied={copied === 'account'} onCopy={() => copy(link.accountNumber, 'account')} />
            <CopyRow label="Nội dung bắt buộc" value={link.paymentCode} accent copied={copied === 'code'} onCopy={() => copy(link.paymentCode, 'code')} />
          </div>
          <div className={styles.waiting}><span /><p><b>Đang chờ thanh toán</b><small>{realtime === 'live' ? 'Realtime SSE đang kết nối' : realtime === 'fallback' ? 'Đang dùng kênh dự phòng' : 'Đang kết nối realtime'} · Hết hạn {new Date(link.expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small></p></div>
        </div>
      </div>
    </section>
  );
}

function CopyRow({ label, value, copied, accent, onCopy }: { label: string; value: string; copied: boolean; accent?: boolean; onCopy: () => void }) {
  return <button type="button" className={styles.copyRow} onClick={onCopy}><span><small>{label}</small><b className={accent ? styles.accent : ''}>{value}</b></span>{copied ? <Check size={18} /> : <Copy size={17} />}</button>;
}

function BankCopyRow({ bankCode, bankName, copied, onCopy }: { bankCode: string; bankName: string; copied: boolean; onCopy: () => void }) {
  return <button type="button" className={styles.copyRow} onClick={onCopy}><span><small>Ngân hàng</small><span className={styles.bankIdentity}><BankLogo code={bankCode} size={25} /><b>{bankName}</b></span></span>{copied ? <Check size={18} /> : <Copy size={17} />}</button>;
}

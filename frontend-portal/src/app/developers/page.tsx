'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BellRing, ChevronDown, Copy, KeyRound, Play, Plus, RefreshCw, RotateCw, Trash2, Webhook } from 'lucide-react';
import { PortalEmpty, PortalSkeleton, PortalToast } from '@/components/PortalFeedback';
import styles from './developers.module.css';

type ApiKey = { id: string; displayName: string; keyPrefix: string; environment: string; scopes: string[]; active: boolean; secret?: string };
type Endpoint = { id: string; url: string; description?: string; subscribedEvents: string[]; status: string; signingSecret?: string; authType: string; bankCodes: string[]; accountIds: string[]; directions: string[]; paymentCodePrefixes: string[]; consecutiveFailures: number; alertChannel?: string; alertDestination?: string };
type Delivery = { id: string; endpointId: string; endpointUrl: string; requestHeaders?: string; requestPayload?: string; responseStatus?: number; responseBody?: string; durationMs?: number; attempt: number; status: string; errorMessage?: string; createdAt: string };
type Alert = { id: string; channel: string; destination: string; status: string; message: string; createdAt: string; sentAt?: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/gateway/${path}`, { cache: 'no-store', ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
  return payload as T;
}

const split = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export default function DevelopersPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ url: 'https://example.com/webhooks/payment', events: 'payment_intent.succeeded,refund.succeeded', authType: 'HMAC_SHA256', headerName: 'X-Api-Key', apiKey: '', tokenUrl: 'https://example.com/oauth/token', clientId: '', clientSecret: '', scope: 'payments', bankCodes: '*', accountIds: '*', directions: 'IN', prefixes: 'PAY', alertChannel: 'EMAIL', alertDestination: 'ops@example.com' });

  const refresh = useCallback(async () => {
    try {
      const [keyData, endpointData, deliveryData, alertData] = await Promise.all([
        api<ApiKey[]>('v1/api_keys'), api<Endpoint[]>('v1/webhooks/endpoints'),
        api<Delivery[]>('v1/webhooks/deliveries?limit=40'), api<Alert[]>('v1/webhooks/alerts'),
      ]);
      setKeys(keyData); setEndpoints(endpointData); setDeliveries(deliveryData); setAlerts(alertData);
    } catch (error) { setToast({ message: String(error), tone: 'error' }); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); return () => clearTimeout(timer); }, [refresh]);

  const action = async (label: string, work: () => Promise<unknown>) => {
    try { await work(); setToast({ message: label }); await refresh(); }
    catch (error) { setToast({ message: String(error), tone: 'error' }); }
  };

  const createKey = () => action('Đã tạo API key mới.', async () => {
    const created = await api<ApiKey>('v1/api_keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: 'Portal sandbox key', keyType: 'SECRET', environment: 'TEST' }) });
    setRevealed(created.secret || null);
  });

  const createEndpoint = (event: FormEvent) => {
    event.preventDefault();
    const authConfig = form.authType === 'API_KEY' ? { headerName: form.headerName, value: form.apiKey }
      : form.authType === 'OAUTH2' ? { tokenUrl: form.tokenUrl, clientId: form.clientId, clientSecret: form.clientSecret, scope: form.scope } : undefined;
    void action('Đã tạo webhook endpoint.', async () => {
      const created = await api<Endpoint>('v1/webhooks/endpoints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: form.url, description: 'Portal endpoint', subscribedEvents: split(form.events), authType: form.authType, authConfig, bankCodes: split(form.bankCodes), accountIds: split(form.accountIds), directions: split(form.directions), paymentCodePrefixes: split(form.prefixes), alertChannel: form.alertChannel || undefined, alertDestination: form.alertDestination || undefined }) });
      setRevealed(created.signingSecret || null);
    });
  };

  return <main className={styles.shell}>
    <Link href="/dashboard" className={styles.back}><ArrowLeft size={16} /> Merchant Dashboard</Link>
    <header className={styles.header}><div><span>DEVELOPER CONTROL PLANE</span><h1>API và Webhook</h1><p>Quản lý khóa truy cập, xác thực webhook, bộ lọc, delivery log và cảnh báo.</p></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{endpoints.some((item) => item.alertChannel) && <button className="btn-glass" onClick={() => { const endpoint = endpoints.find((item) => item.alertChannel); if (endpoint) void action('Đã gửi cảnh báo mô phỏng.', () => api(`v1/webhooks/endpoints/${endpoint.id}/test-alert`, { method: 'POST' })); }}><BellRing size={16} /> Test alert</button>}<button className="btn-glass" onClick={() => void refresh()}><RefreshCw size={16} /> Làm mới</button></div></header>
    {revealed && <div className={styles.secret}><div><b>Chỉ hiển thị một lần</b><code>{revealed}</code></div><button onClick={() => void navigator.clipboard.writeText(revealed)}><Copy size={17} /></button></div>}
    <div className={styles.topGrid}>
      <section className={styles.card}><div className={styles.cardTitle}><h2><KeyRound size={19} /> API keys</h2><button className="btn-adyen-green" onClick={() => void createKey()}><Plus size={15} /> Tạo key</button></div>{loading ? <PortalSkeleton /> : keys.length === 0 ? <PortalEmpty title="Chưa có API key" /> : <div className={styles.list}>{keys.map((key) => <article className={styles.keyRow} key={key.id}><div><b>{key.displayName}</b><code>{key.keyPrefix}••••••••</code><small>{key.scopes.join(', ')}</small></div><div><span>{key.environment}</span>{key.active && <button title="Xoay key" onClick={() => void action('Đã xoay API key.', async () => { const value = await api<ApiKey>(`v1/api_keys/${key.id}/rotate`, { method: 'POST' }); setRevealed(value.secret || null); })}><RotateCw size={15} /></button>}</div></article>)}</div>}</section>
      <section className={styles.card}><div className={styles.cardTitle}><h2><Webhook size={19} /> Tạo endpoint</h2></div><form className={styles.form} onSubmit={createEndpoint}><label className={styles.full}>Endpoint URL<input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} /></label><label className={styles.full}>Events<input value={form.events} onChange={(event) => setForm({ ...form, events: event.target.value })} /></label><label>Xác thực<select value={form.authType} onChange={(event) => setForm({ ...form, authType: event.target.value })}><option>HMAC_SHA256</option><option>API_KEY</option><option>OAUTH2</option></select></label>{form.authType === 'API_KEY' && <><label>Header<input value={form.headerName} onChange={(event) => setForm({ ...form, headerName: event.target.value })} /></label><label className={styles.full}>API key<input type="password" required value={form.apiKey} onChange={(event) => setForm({ ...form, apiKey: event.target.value })} /></label></>}{form.authType === 'OAUTH2' && <><label className={styles.full}>Token URL<input value={form.tokenUrl} onChange={(event) => setForm({ ...form, tokenUrl: event.target.value })} /></label><label>Client ID<input value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })} /></label><label>Client secret<input type="password" value={form.clientSecret} onChange={(event) => setForm({ ...form, clientSecret: event.target.value })} /></label></>}<label>Ngân hàng<input value={form.bankCodes} onChange={(event) => setForm({ ...form, bankCodes: event.target.value })} /></label><label>Account IDs<input value={form.accountIds} onChange={(event) => setForm({ ...form, accountIds: event.target.value })} /></label><label>Chiều tiền<input value={form.directions} onChange={(event) => setForm({ ...form, directions: event.target.value })} /></label><label>Tiền tố mã<input value={form.prefixes} onChange={(event) => setForm({ ...form, prefixes: event.target.value })} /></label><label>Kênh cảnh báo<select value={form.alertChannel} onChange={(event) => setForm({ ...form, alertChannel: event.target.value })}><option>EMAIL</option><option>SLACK</option><option>TELEGRAM</option><option value="">Tắt</option></select></label><label>Đích cảnh báo<input value={form.alertDestination} onChange={(event) => setForm({ ...form, alertDestination: event.target.value })} /></label><button className="btn-adyen-green full" type="submit"><Plus size={15} /> Tạo webhook</button></form></section>
    </div>
    <section className={styles.card}><div className={styles.cardTitle}><h2><Webhook size={19} /> Endpoints</h2><small>{endpoints.length} cấu hình</small></div>{loading ? <PortalSkeleton rows={2} /> : endpoints.length === 0 ? <PortalEmpty title="Chưa có webhook endpoint" /> : <div className={styles.endpointGrid}>{endpoints.map((endpoint) => <article className={styles.endpoint} key={endpoint.id}><header><div><code>{endpoint.url}</code><small>{endpoint.authType} · {endpoint.subscribedEvents.join(', ')}</small></div><span data-status={endpoint.status}>{endpoint.status}</span></header><div className={styles.filters}><span>Bank: {endpoint.bankCodes.join(', ')}</span><span>Account: {endpoint.accountIds.join(', ')}</span><span>Direction: {endpoint.directions.join(', ')}</span><span>Prefix: {endpoint.paymentCodePrefixes.join(', ')}</span></div><footer><small>{endpoint.consecutiveFailures} lỗi liên tiếp</small><div><button onClick={() => void action('Đã xếp delivery thử.', () => api(`v1/webhooks/endpoints/${endpoint.id}/test`, { method: 'POST' }))}><Play size={14} /> Test</button><button onClick={() => void action('Đã xoay signing secret.', async () => { const value = await api<Endpoint>(`v1/webhooks/endpoints/${endpoint.id}/rotate-secret`, { method: 'POST' }); setRevealed(value.signingSecret || null); })}><RotateCw size={14} /> Secret</button><button onClick={() => void action('Đã vô hiệu endpoint.', () => api(`v1/webhooks/endpoints/${endpoint.id}`, { method: 'DELETE' }))}><Trash2 size={14} /></button></div></footer></article>)}</div>}</section>
    <div className={styles.bottomGrid}><section className={styles.card}><div className={styles.cardTitle}><h2>Delivery log</h2></div>{deliveries.length === 0 ? <PortalEmpty title="Chưa có delivery" description="Dùng nút Test trên endpoint để tạo delivery thử." /> : <div className={styles.deliveryList}>{deliveries.map((delivery) => <article key={delivery.id}><button className={styles.deliveryHead} onClick={() => setExpanded(expanded === delivery.id ? null : delivery.id)}><span data-status={delivery.status}>{delivery.status}</span><code>{delivery.endpointUrl}</code><small>#{delivery.attempt} · {delivery.durationMs || 0} ms</small><ChevronDown size={15} /></button>{expanded === delivery.id && <div className={styles.deliveryDetail}><b>Request</b><pre>{delivery.requestPayload || '—'}</pre><b>Response / error</b><pre>{delivery.responseBody || delivery.errorMessage || `HTTP ${delivery.responseStatus || '—'}`}</pre><button onClick={() => void action('Đã đưa delivery vào hàng đợi lại.', () => api(`v1/webhooks/deliveries/${delivery.id}/replay`, { method: 'POST' }))}><RotateCw size={14} /> Replay</button></div>}</article>)}</div>}</section><section className={styles.card}><div className={styles.cardTitle}><h2><BellRing size={18} /> Alert log</h2></div>{alerts.length === 0 ? <PortalEmpty title="Chưa có cảnh báo" /> : <div className={styles.alerts}>{alerts.map((alert) => <article key={alert.id}><span data-status={alert.status}>{alert.status}</span><b>{alert.channel}</b><small>{alert.destination}</small><p>{alert.message}</p></article>)}</div>}</section></div>
    {toast && <PortalToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
  </main>;
}

'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, KeyRound, Plus, RefreshCw, RotateCw, Webhook } from 'lucide-react';

type ApiKey = { id: string; displayName: string; keyPrefix: string; keyType: string; environment: string; scopes: string[]; active: boolean; secret?: string };
type Endpoint = { id: string; url: string; description?: string; subscribedEvents: string[]; status: string; signingSecret?: string };
type Audit = { id: string; action: string; resourceType: string; createdAt: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/gateway/${path}`, { cache: 'no-store', ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `HTTP ${response.status}`);
  return payload as T;
}

export default function DevelopersPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('https://example.com/webhooks/payment');
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [keyData, endpointData, auditData] = await Promise.all([
        api<ApiKey[]>('v1/api_keys'),
        api<Endpoint[]>('v1/webhooks/endpoints'),
        api<Audit[]>('v1/audit_logs?limit=12'),
      ]);
      setKeys(keyData); setEndpoints(endpointData); setAudits(auditData); setMessage(null);
    } catch (error) { setMessage(String(error)); }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const createKey = async () => {
    try {
      const created = await api<ApiKey>('v1/api_keys', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: 'Dashboard test key', keyType: 'SECRET', environment: 'TEST' }),
      });
      setRevealed(created.secret ?? null); await refresh();
    } catch (error) { setMessage(String(error)); }
  };

  const rotateKey = async (id: string) => {
    try {
      const rotated = await api<ApiKey>(`v1/api_keys/${id}/rotate`, { method: 'POST' });
      setRevealed(rotated.secret ?? null); await refresh();
    } catch (error) { setMessage(String(error)); }
  };

  const createEndpoint = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const created = await api<Endpoint>('v1/webhooks/endpoints', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, description: 'Developer endpoint', subscribedEvents: ['payment_intent.succeeded', 'refund.succeeded'] }),
      });
      setRevealed(created.signingSecret ?? null); await refresh();
    } catch (error) { setMessage(String(error)); }
  };

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 28px 80px' }}>
      <Link href="/dashboard" className="nav-link" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: 28 }}>
        <ArrowLeft size={16} /> Merchant Dashboard
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap', marginBottom: 28 }}>
        <div><h1 style={{ fontSize: '2.2rem', marginBottom: 6 }}>Developer control plane</h1><p style={{ color: 'var(--text-secondary)' }}>Scoped API keys, signed webhooks and immutable audit history.</p></div>
        <button className="btn-glass" onClick={() => void refresh()}><RefreshCw size={16} /> Refresh</button>
      </div>
      {message && <div style={{ padding: 14, border: '1px solid #7f1d1d', color: '#fda4af', borderRadius: 10, marginBottom: 20 }}>{message}</div>}
      {revealed && <div style={{ padding: 18, border: '1px solid rgba(10,191,83,.4)', background: 'rgba(10,191,83,.08)', borderRadius: 12, marginBottom: 24 }}><strong>Copy now — this secret is shown once</strong><div style={{ display: 'flex', gap: 10, marginTop: 10, overflow: 'hidden' }}><code style={{ overflow: 'auto', flex: 1 }}>{revealed}</code><button onClick={() => navigator.clipboard.writeText(revealed)}><Copy size={16} /></button></div></div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 22 }}>
        <section className="bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ display: 'flex', gap: 9, alignItems: 'center' }}><KeyRound size={20} /> API keys</h2><button className="btn-adyen-green" onClick={createKey} style={{ padding: '8px 12px' }}><Plus size={15} /> New key</button></div>
          <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>{keys.map((key) => <div key={key.id} style={{ background: '#090a0f', padding: 14, borderRadius: 10, opacity: key.active ? 1 : .55 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>{key.displayName}</strong><span style={{ color: 'var(--text-dim)' }}>{key.environment}</span></div><code style={{ display: 'block', color: 'var(--mercury-gold)', margin: '8px 0' }}>{key.keyPrefix}••••••••</code><small style={{ color: 'var(--text-dim)' }}>{key.scopes.join(', ')}</small>{key.active && <button onClick={() => void rotateKey(key.id)} style={{ float: 'right', color: 'var(--adyen-green-neon)' }} title="Rotate"><RotateCw size={15} /></button>}</div>)}</div>
        </section>
        <section className="bento-card">
          <h2 style={{ display: 'flex', gap: 9, alignItems: 'center' }}><Webhook size={20} /> Webhook endpoints</h2>
          <form onSubmit={createEndpoint} style={{ display: 'flex', gap: 8, margin: '18px 0' }}><input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} required style={{ flex: 1, background: '#090a0f', border: '1px solid var(--border-frosted)', color: 'white', borderRadius: 8, padding: 11 }} /><button className="btn-adyen-green" style={{ padding: '9px 13px' }}><Plus size={15} /></button></form>
          <div style={{ display: 'grid', gap: 10 }}>{endpoints.map((endpoint) => <div key={endpoint.id} style={{ background: '#090a0f', padding: 14, borderRadius: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><code style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{endpoint.url}</code><span style={{ color: endpoint.status === 'ACTIVE' ? 'var(--adyen-green-neon)' : 'var(--text-dim)' }}>{endpoint.status === 'ACTIVE' && <Check size={15} />}</span></div><small style={{ color: 'var(--text-dim)' }}>{endpoint.subscribedEvents.join(', ')}</small></div>)}</div>
        </section>
      </div>
      <section className="bento-card" style={{ marginTop: 22 }}><h2>Recent audit activity</h2><div style={{ marginTop: 16, display: 'grid', gap: 8 }}>{audits.map((audit) => <div key={audit.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, padding: 11, borderBottom: '1px solid var(--border-frosted)' }}><strong>{audit.action}</strong><span style={{ color: 'var(--text-secondary)' }}>{audit.resourceType}</span><time style={{ color: 'var(--text-dim)' }}>{new Date(audit.createdAt).toLocaleString('vi-VN')}</time></div>)}</div></section>
    </main>
  );
}

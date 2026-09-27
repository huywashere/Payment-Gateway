'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BanknoteArrowDown, RefreshCw, Scale, ShieldAlert, WalletCards } from 'lucide-react';

type Balance = { pending_balance: number; available_balance: number; dispute_reserve: number; total_balance: number };
type Settlement = { id: string; status: string; netAmount: number; feeAmount: number; refundAmount: number; chargeCount: number };
type Payout = { id: string; amount: number; status: string; destinationReference: string };
type Dispute = { id: string; amount: number; status: string; reason: string };
type RiskProfile = { enabled: boolean; maxTransactionAmount: number; dailyVolumeLimit: number; velocityLimitPerMinute: number; reviewScoreThreshold: number; blockScoreThreshold: number };
type RiskEvaluation = { id: string; decision: string; score: number };
type Reconciliation = { id: string; status: string; matchedCount: number; mismatchCount: number };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/gateway/${path}`, { cache: 'no-store', ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `HTTP ${response.status}`);
  return payload as T;
}

const money = (value = 0) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
const inputStyle = { background: '#090a0f', border: '1px solid var(--border-frosted)', color: 'white', borderRadius: 8, padding: 11 };

export default function OperationsPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [risk, setRisk] = useState<RiskProfile | null>(null);
  const [evaluations, setEvaluations] = useState<RiskEvaluation[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [payoutAmount, setPayoutAmount] = useState(50000);
  const [destination, setDestination] = useState('sandbox-bank-account-9704');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [balanceData, settlementData, payoutData, disputeData, riskData, evaluationData, reconciliationData] = await Promise.all([
        api<Balance>('v1/balance'), api<Settlement[]>('v1/settlements?limit=20'), api<Payout[]>('v1/payouts?limit=20'),
        api<Dispute[]>('v1/disputes?limit=20'), api<RiskProfile>('v1/risk/profile'),
        api<RiskEvaluation[]>('v1/risk/evaluations?limit=12'), api<Reconciliation[]>('v1/reconciliation_runs?limit=12'),
      ]);
      setBalance(balanceData); setSettlements(settlementData); setPayouts(payoutData); setDisputes(disputeData);
      setRisk(riskData); setEvaluations(evaluationData); setReconciliations(reconciliationData); setMessage(null);
    } catch (error) { setMessage(String(error)); }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const settle = async () => {
    setBusy(true);
    try {
      await api('v1/settlements', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ currency: 'VND' }) });
      await refresh();
    } catch (error) { setMessage(String(error)); } finally { setBusy(false); }
  };

  const createPayout = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      await api('v1/payouts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ amount: payoutAmount, currency: 'VND', destinationReference: destination, description: 'Merchant sandbox payout' }) });
      await refresh();
    } catch (error) { setMessage(String(error)); } finally { setBusy(false); }
  };

  const saveRisk = async (event: FormEvent) => {
    event.preventDefault(); if (!risk) return; setBusy(true);
    try {
      await api('v1/risk/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(risk) });
      await refresh();
    } catch (error) { setMessage(String(error)); } finally { setBusy(false); }
  };

  return (
    <main style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 28px 80px' }}>
      <Link href="/dashboard" className="nav-link" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: 28 }}><ArrowLeft size={16} /> Merchant Dashboard</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap', marginBottom: 28 }}>
        <div><h1 style={{ fontSize: '2.2rem', marginBottom: 6 }}>Money operations</h1><p style={{ color: 'var(--text-secondary)' }}>Settlement, payout, disputes, reconciliation and real-time risk controls.</p></div>
        <button className="btn-glass" onClick={() => void refresh()}><RefreshCw size={16} /> Refresh</button>
      </div>
      {message && <div style={{ padding: 14, border: '1px solid #7f1d1d', color: '#fda4af', borderRadius: 10, marginBottom: 20 }}>{message}</div>}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
        {[['Pending', balance?.pending_balance], ['Available', balance?.available_balance], ['Dispute reserve', balance?.dispute_reserve], ['Total ledger', balance?.total_balance]].map(([label, value]) => <div className="bento-card" key={String(label)} style={{ padding: 18 }}><small style={{ color: 'var(--text-dim)' }}>{label}</small><strong style={{ display: 'block', fontSize: 24, marginTop: 7 }}>{money(Number(value || 0))}</strong></div>)}
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 22 }}>
        <section className="bento-card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ display: 'flex', gap: 9 }}><WalletCards size={20} /> Settlements</h2><button className="btn-adyen-green" disabled={busy} onClick={() => void settle()}>Settle pending</button></div><div style={{ marginTop: 16, display: 'grid', gap: 9 }}>{settlements.map(item => <div key={item.id} style={{ padding: 12, borderBottom: '1px solid var(--border-frosted)' }}><strong>{money(item.netAmount)}</strong><span style={{ float: 'right', color: 'var(--adyen-green-neon)' }}>{item.status}</span><small style={{ display: 'block', color: 'var(--text-dim)' }}>{item.chargeCount} charges · fees {money(item.feeAmount)} · refunds {money(item.refundAmount)}</small></div>)}</div></section>
        <section className="bento-card"><h2 style={{ display: 'flex', gap: 9 }}><BanknoteArrowDown size={20} /> Payouts</h2><form onSubmit={createPayout} style={{ display: 'grid', gap: 9, margin: '16px 0' }}><input style={inputStyle} type="number" min={1000} value={payoutAmount} onChange={event => setPayoutAmount(Number(event.target.value))} /><input style={inputStyle} value={destination} onChange={event => setDestination(event.target.value)} /><button className="btn-adyen-green" disabled={busy}>Create sandbox payout</button></form>{payouts.map(item => <div key={item.id} style={{ padding: 11, borderBottom: '1px solid var(--border-frosted)' }}><strong>{money(item.amount)}</strong><span style={{ float: 'right' }}>{item.status}</span><small style={{ display: 'block', color: 'var(--text-dim)' }}>{item.destinationReference}</small></div>)}</section>
        <section className="bento-card"><h2 style={{ display: 'flex', gap: 9 }}><ShieldAlert size={20} /> Risk policy</h2>{risk && <form onSubmit={saveRisk} style={{ display: 'grid', gap: 10, marginTop: 16 }}><label>Max transaction<input style={{ ...inputStyle, display: 'block', width: '100%' }} type="number" value={risk.maxTransactionAmount} onChange={event => setRisk({ ...risk, maxTransactionAmount: Number(event.target.value) })} /></label><label>Daily volume<input style={{ ...inputStyle, display: 'block', width: '100%' }} type="number" value={risk.dailyVolumeLimit} onChange={event => setRisk({ ...risk, dailyVolumeLimit: Number(event.target.value) })} /></label><label>Velocity/minute<input style={{ ...inputStyle, display: 'block', width: '100%' }} type="number" value={risk.velocityLimitPerMinute} onChange={event => setRisk({ ...risk, velocityLimitPerMinute: Number(event.target.value) })} /></label><button className="btn-glass" disabled={busy}>Save risk limits</button></form>}<div style={{ marginTop: 14 }}>{evaluations.map(item => <small key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 7 }}><span>{item.decision}</span><span>score {item.score}</span></small>)}</div></section>
        <section className="bento-card"><h2 style={{ display: 'flex', gap: 9 }}><Scale size={20} /> Disputes & reconciliation</h2><h3 style={{ margin: '17px 0 8px' }}>Open disputes</h3>{disputes.length === 0 ? <p style={{ color: 'var(--text-dim)' }}>No disputes.</p> : disputes.map(item => <div key={item.id} style={{ padding: 10, borderBottom: '1px solid var(--border-frosted)' }}><strong>{money(item.amount)}</strong><span style={{ float: 'right' }}>{item.status}</span><small style={{ display: 'block' }}>{item.reason}</small></div>)}<h3 style={{ margin: '20px 0 8px' }}>Reconciliation runs</h3>{reconciliations.length === 0 ? <p style={{ color: 'var(--text-dim)' }}>No processor reports imported.</p> : reconciliations.map(item => <div key={item.id} style={{ padding: 10, borderBottom: '1px solid var(--border-frosted)' }}><strong>{item.status}</strong><small style={{ float: 'right' }}>{item.matchedCount} matched · {item.mismatchCount} review</small></div>)}</section>
      </div>
    </main>
  );
}

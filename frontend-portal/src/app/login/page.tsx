'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@apipay.local');
  const [password, setPassword] = useState('ProjectDemo!2026');
  const [mfaCode, setMfaCode] = useState('246810');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'demo' | 'oidc' | null>(null);

  useEffect(() => {
    fetch('/api/auth/mode', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => setAuthMode(result.mode === 'oidc' ? 'oidc' : 'demo'))
      .catch(() => setError('Không thể tải cấu hình đăng nhập'));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, mfaCode }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.error || 'Không thể đăng nhập');
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <div className="portal-login-shell">
      <form className="portal-login-card" onSubmit={submit}>
        <div className="portal-login-icon"><ShieldCheck size={30} /></div>
        <p className="portal-kicker">SECURE MERCHANT PORTAL</p>
        <h1>Đăng nhập ApiPay</h1>
        <p className="portal-login-copy">Sandbox hỗ trợ tài khoản demo; môi trường live bắt buộc OIDC và MFA thật.</p>
        {authMode === 'demo' && <>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <label>Mã MFA 6 số<input inputMode="numeric" pattern="[0-9]{6}" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} required /></label>
        </>}
        {error && <p className="portal-login-error">{error}</p>}
        {authMode === 'demo' && <>
          <button className="btn-adyen-green" disabled={busy}><KeyRound size={17} />{busy ? 'Đang xác thực…' : 'Đăng nhập an toàn'}</button>
          <small>Demo: owner/developer/finance/auditor@apipay.local</small>
        </>}
        {authMode === 'oidc' && <a className="btn-adyen-green" href="/api/auth/oidc/login">
          <KeyRound size={17} />Đăng nhập bằng Identity Provider
        </a>}
        {authMode === null && <small>Đang tải cấu hình xác thực…</small>}
      </form>
    </div>
  );
}

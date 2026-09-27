'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';

type Session = { email: string; role: string; environment: string };

export function PortalSessionBadge() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setSession(result?.session || null))
      .catch(() => setSession(null));
  }, []);

  if (!session) return null;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="portal-session-badge" aria-label="Portal session">
      <ShieldCheck size={16} />
      <span><b>{session.role}</b><small>{session.environment}</small></span>
      <button onClick={logout} aria-label="Đăng xuất"><LogOut size={15} /></button>
    </aside>
  );
}

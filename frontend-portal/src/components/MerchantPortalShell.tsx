'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  Bell,
  Building2,
  ChevronDown,
  CircleHelp,
  Code2,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Landmark,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Search,
  ShieldCheck,
  ReceiptText,
  ScrollText,
  Store,
  Webhook,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './MerchantPortalShell.module.css';

type Session = {
  email: string;
  role: 'OWNER' | 'DEVELOPER' | 'FINANCE' | 'AUDITOR';
  environment: 'sandbox' | 'live';
  merchantId: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles?: Session['role'][];
  external?: boolean;
};

type PortalNotification = {
  id: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

const NAVIGATION: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'TỔNG QUAN',
    items: [
      { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { href: '/operations', label: 'Giao dịch & vận hành', icon: ArrowLeftRight, roles: ['OWNER', 'FINANCE', 'AUDITOR'] },
      { href: '/payment-links', label: 'Payment Links', icon: QrCode, roles: ['OWNER', 'FINANCE'] },
      { href: '/banks', label: 'Ngân hàng', icon: Landmark, roles: ['OWNER', 'FINANCE'] },
    ],
  },
  {
    label: 'TÍCH HỢP',
    items: [
      { href: '/developers', label: 'API & Webhooks', icon: Webhook, roles: ['OWNER', 'DEVELOPER'] },
      { href: '/acquirer', label: 'Acquirer Playground', icon: CreditCard, roles: ['OWNER', 'DEVELOPER'] },
    ],
  },
  {
    label: 'DOANH NGHIỆP',
    items: [
      { href: '/organization', label: 'Tổ chức & gói dịch vụ', icon: Building2, roles: ['OWNER'] },
      { href: '/billing', label: 'Hóa đơn & thanh toán', icon: ReceiptText, roles: ['OWNER', 'FINANCE'] },
      { href: '/audit-logs', label: 'Nhật ký kiểm toán', icon: ScrollText, roles: ['OWNER', 'FINANCE', 'AUDITOR'] },
      { href: '/platform', label: 'Platform Admin', icon: ShieldCheck, roles: ['OWNER'] },
      { href: '/store', label: 'Cửa hàng demo', icon: Store, external: true },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tổng quan',
  '/operations': 'Giao dịch & vận hành',
  '/payment-links': 'Payment Links',
  '/transactions': 'Chi tiết giao dịch',
  '/developers': 'API & Webhooks',
  '/organization': 'Tổ chức & gói dịch vụ',
  '/acquirer': 'Acquirer Playground',
  '/platform': 'Platform Admin',
  '/banks': 'Ngân hàng',
  '/billing': 'Hóa đơn & thanh toán',
  '/audit-logs': 'Nhật ký kiểm toán',
};

export function MerchantPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [balance, setBalance] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    void Promise.all([
      fetch('/api/auth/session', { cache: 'no-store' })
        .then((response) => response.ok ? response.json() : null)
        .then((result) => setSession(result?.session || null)),
      fetch('/api/gateway/v1/balance', { cache: 'no-store' })
        .then((response) => response.ok ? response.json() : null)
        .then((result) => setBalance(Number(result?.available_balance || 0))),
      fetch('/api/gateway/v1/notifications?limit=8', { cache: 'no-store' })
        .then((response) => response.ok ? response.json() : null)
        .then((result) => {
          setNotifications(result?.items || []);
          setUnreadCount(Number(result?.unread_count || 0));
        }),
    ]).catch(() => undefined);
  }, []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  const allowedNavigation = useMemo(() => NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || (session !== null && item.roles.includes(session.role))),
  })), [session]);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi');
    if (!normalized) return [];
    return allowedNavigation.flatMap((section) => section.items).filter((item) => item.label.toLocaleLowerCase('vi').includes(normalized)).slice(0, 5);
  }, [allowedNavigation, query]);

  const currentTitle = Object.entries(PAGE_TITLES).find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] || 'Merchant Portal';
  const initials = session?.email.slice(0, 2).toUpperCase() || 'NG';

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      window.localStorage.setItem('novagate-sidebar-collapsed', String(!current));
      return !current;
    });
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  const closeOverlays = () => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setAccountOpen(false);
  };

  const markRead = async (notification: PortalNotification) => {
    if (notification.readAt) return;
    const response = await fetch(`/api/gateway/v1/notifications/${notification.id}/read`, { method: 'POST' });
    if (!response.ok) return;
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    const response = await fetch('/api/gateway/v1/notifications/read-all', { method: 'POST' });
    if (!response.ok) return;
    const now = new Date().toISOString();
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || now })));
    setUnreadCount(0);
  };

  return (
    <div className={`${styles.portal} ${collapsed ? styles.collapsed : ''}`}>
      <button type="button" className={styles.mobileMenu} onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu size={21} /></button>
      {mobileOpen && <button type="button" className={styles.overlay} onClick={() => setMobileOpen(false)} aria-label="Đóng menu" />}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.brandRow}>
          <Link href="/dashboard" className={styles.brand} aria-label="NovaGate Merchant Portal">
            <span className={styles.brandMark}>N</span>
            <span className={styles.brandCopy}><b>NovaGate</b><small>Merchant Portal</small></span>
          </Link>
          <button type="button" className={styles.closeMobile} onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={19} /></button>
        </div>

        <div className={styles.environment}><i /><span>{session?.environment === 'live' ? 'Live mode' : 'Test mode'}</span><b>{session?.environment === 'live' ? 'LIVE' : 'SANDBOX'}</b></div>

        <nav className={styles.navigation} aria-label="Merchant Portal">
          {allowedNavigation.map((section) => <section key={section.label}>
            <h2>{section.label}</h2>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href
                || (!item.external && item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
                || (item.href === '/payment-links' && pathname.startsWith('/transactions/'));
              return <Link key={item.href} href={item.href} className={active ? styles.active : ''} title={collapsed ? item.label : undefined} onClick={closeOverlays}>
                <Icon size={18} /><span>{item.label}</span>{item.external && <ExternalLink size={12} />}
              </Link>;
            })}
          </section>)}
        </nav>

        <div className={styles.sidebarHelp}>
          <CircleHelp size={18} />
          <span><b>Cần trợ giúp?</b><small>Xem tài liệu tích hợp</small></span>
          <ExternalLink size={13} />
        </div>

        <button type="button" className={styles.collapseButton} onClick={toggleCollapsed} aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}<span>Thu gọn</span>
        </button>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.pageName}><small>MERCHANT CONSOLE</small><b>{currentTitle}</b></div>
          <div className={styles.searchWrap}>
            <Search size={17} />
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm tính năng..." aria-label="Tìm kiếm tính năng" />
            <kbd>⌘ K</kbd>
            {searchResults.length > 0 && <div className={styles.searchResults}>{searchResults.map((item) => <Link key={item.href} href={item.href} onClick={() => { setQuery(''); closeOverlays(); }}><item.icon size={16} /><span>{item.label}</span></Link>)}</div>}
          </div>
          <div className={styles.topActions}>
            <div className={styles.balance}><small>Số dư khả dụng</small><b>{balance.toLocaleString('vi-VN')} ₫</b></div>
            <Link href="/payment-links" className={styles.quickCreate}><QrCode size={16} /><span>Tạo QR</span></Link>
            <div className={styles.popoverWrap}>
              <button type="button" className={styles.iconButton} onClick={() => { setNotificationsOpen((open) => !open); setAccountOpen(false); }} aria-label="Thông báo"><Bell size={18} />{unreadCount > 0 && <i />}</button>
              {notificationsOpen && <div className={styles.popover}>
                <header><b>Thông báo</b>{unreadCount > 0 ? <button type="button" onClick={() => void markAllRead()}>Đọc tất cả ({unreadCount})</button> : <span>Đã đọc hết</span>}</header>
                {notifications.length === 0 ? <div className={styles.notificationEmpty}>Không có thông báo mới.</div> : notifications.map((notification) => <button type="button" className={styles.notificationItem} data-read={Boolean(notification.readAt)} key={notification.id} onClick={() => void markRead(notification)}>
                  <i className={notification.severity === 'SUCCESS' ? styles.successDot : notification.severity === 'ERROR' ? styles.errorDot : styles.warningDot} />
                  <div><b>{notification.title}</b><small>{notification.message}</small><time>{new Date(notification.createdAt).toLocaleString('vi-VN')}</time></div>
                </button>)}
              </div>}
            </div>
            <div className={styles.popoverWrap}>
              <button type="button" className={styles.accountButton} onClick={() => { setAccountOpen((open) => !open); setNotificationsOpen(false); }}>
                <span>{initials}</span><div><b>{session?.email.split('@')[0] || 'Merchant'}</b><small>{session?.role || '...'}</small></div><ChevronDown size={14} />
              </button>
              {accountOpen && <div className={`${styles.popover} ${styles.accountMenu}`}>
                <div className={styles.accountSummary}><span>{initials}</span><div><b>{session?.email || 'Đang tải...'}</b><small>{session?.merchantId?.slice(0, 12)}...</small></div></div>
                {session?.role === 'OWNER' && <Link href="/organization" onClick={closeOverlays}><Building2 size={16} /> Tổ chức & thành viên</Link>}
                <Link href="/developers" onClick={closeOverlays}><Code2 size={16} /> Cấu hình API</Link>
                <button type="button" onClick={() => void logout()}><LogOut size={16} /> Đăng xuất</button>
              </div>}
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

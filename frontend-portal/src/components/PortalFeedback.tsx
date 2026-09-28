import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react';

export function PortalToast({ message, tone = 'success', onClose }: { message: string; tone?: 'success' | 'error'; onClose?: () => void }) {
  return <div className={`portal-toast portal-toast-${tone}`} role="status">{tone === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}<span>{message}</span>{onClose && <button onClick={onClose} aria-label="Đóng">×</button>}</div>;
}

export function PortalSkeleton({ rows = 3 }: { rows?: number }) {
  return <div className="portal-skeleton" aria-label="Đang tải">{Array.from({ length: rows }, (_, index) => <i key={index} />)}</div>;
}

export function PortalEmpty({ title, description }: { title: string; description?: string }) {
  return <div className="portal-empty"><Inbox size={25} /><b>{title}</b>{description && <small>{description}</small>}</div>;
}

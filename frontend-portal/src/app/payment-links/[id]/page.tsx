import PaymentLinkDetail from './payment-link-detail';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <PaymentLinkDetail id={id} />; }

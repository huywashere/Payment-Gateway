import PaymentLinkClient from './payment-link-client';

export default async function PaymentLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PaymentLinkClient slug={slug} />;
}

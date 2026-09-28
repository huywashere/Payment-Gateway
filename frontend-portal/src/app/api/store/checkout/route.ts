import { portalMode } from '@/lib/portal-auth';

const PRODUCTS = {
  'prod-headphones': { amount: 7_990_000, name: 'Sony WH-1000XM5 Noise Canceling' },
  'prod-keyboard': { amount: 4_490_000, name: 'Keychron Q1 Pro Custom Keyboard' },
  'prod-mouse': { amount: 2_290_000, name: 'Logitech MX Master 3S Performance' },
} as const;

type ProductId = keyof typeof PRODUCTS;

export async function POST(request: Request) {
  if (portalMode() !== 'sandbox') {
    return Response.json({ error: 'Demo Store chỉ khả dụng trong sandbox.' }, { status: 404 });
  }

  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'Yêu cầu khác nguồn không được phép.' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json({ error: 'Content-Type phải là application/json.' }, { status: 415 });
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 2_048) {
    return Response.json({ error: 'Dữ liệu yêu cầu quá lớn.' }, { status: 413 });
  }

  let productId: string;
  try {
    const body = await request.json() as { productId?: unknown };
    productId = typeof body.productId === 'string' ? body.productId : '';
  } catch {
    return Response.json({ error: 'Dữ liệu yêu cầu không hợp lệ.' }, { status: 400 });
  }
  if (!(productId in PRODUCTS)) {
    return Response.json({ error: 'Sản phẩm không tồn tại.' }, { status: 400 });
  }

  const product = PRODUCTS[productId as ProductId];
  const coreUrl = (process.env.GATEWAY_CORE_URL || 'http://localhost:8080').replace(/\/$/, '');
  const secretKey = (process.env.GATEWAY_SANDBOX_SECRET_KEY || process.env.GATEWAY_DEMO_SECRET_KEY)?.trim();
  if (!secretKey) {
    return Response.json({ error: 'Demo Store chưa được cấu hình.' }, { status: 503 });
  }

  try {
    const upstream = await fetch(`${coreUrl}/v1/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `store_${productId}_${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        amount: product.amount,
        currency: 'VND',
        description: `Đơn hàng ${product.name}`,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await upstream.json().catch(() => ({})) as Record<string, unknown>;
    if (!upstream.ok) {
      const envelope = payload.error as { message?: string } | undefined;
      console.error('Demo Store checkout rejected by Gateway Core', upstream.status, envelope?.message);
      return Response.json({ error: 'Không thể tạo phiên thanh toán. Vui lòng thử lại.' }, { status: upstream.status });
    }
    return Response.json({
      id: payload.id,
      clientSecret: payload.clientSecret,
      amount: payload.amount,
      currency: payload.currency,
      status: payload.status,
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Demo Store cannot reach Gateway Core', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'Dịch vụ thanh toán đang tạm thời không khả dụng.' }, { status: 503 });
  }
}

const PUBLIC_CHECKOUT_PATH = /^v1\/checkout\/[A-Za-z0-9_-]+(?:\/(?:pay|sandbox\/(?:complete|action)))?$/;
const PRIVATE_ROUTES: Array<{ pattern: RegExp; methods: string[] }> = [
  { pattern: /^v1\/balance$/, methods: ['GET'] },
  { pattern: /^v1\/payment_intents$/, methods: ['POST'] },
  { pattern: /^v1\/payment_intents\/[0-9a-f-]+$/, methods: ['GET'] },
  { pattern: /^v1\/payment_intents\/[0-9a-f-]+\/(?:confirm|cancel)$/, methods: ['POST'] },
  { pattern: /^v1\/charges\/[0-9a-f-]+\/refunds$/, methods: ['POST'] },
  { pattern: /^v1\/charges\/[0-9a-f-]+$/, methods: ['GET'] },
  { pattern: /^v1\/(?:api_keys|webhooks\/endpoints|webhooks\/deliveries|audit_logs)$/, methods: ['GET', 'POST'] },
  { pattern: /^v1\/api_keys\/[0-9a-f-]+(?:\/rotate)?$/, methods: ['POST', 'DELETE'] },
  { pattern: /^v1\/webhooks\/(?:endpoints|deliveries)\/[0-9a-f-]+(?:\/replay)?$/, methods: ['POST', 'DELETE'] },
  { pattern: /^v1\/payment_methods$/, methods: ['POST'] },
  { pattern: /^v1\/(?:settlements|payouts)$/, methods: ['GET', 'POST'] },
  { pattern: /^v1\/disputes$/, methods: ['GET'] },
  { pattern: /^v1\/disputes\/[0-9a-f-]+\/evidence$/, methods: ['POST'] },
  { pattern: /^v1\/risk\/(?:profile|evaluations)$/, methods: ['GET', 'PUT'] },
  { pattern: /^v1\/reconciliation_runs(?:\/[0-9a-f-]+)?$/, methods: ['GET'] },
];

function getServerConfig() {
  const coreUrl = process.env.GATEWAY_CORE_URL?.trim();
  const secretKey = process.env.GATEWAY_DEMO_SECRET_KEY?.trim();

  if (process.env.NODE_ENV === 'production' && (!coreUrl || !secretKey)) {
    throw new Error('Missing GATEWAY_CORE_URL or GATEWAY_DEMO_SECRET_KEY');
  }

  return {
    coreUrl: (coreUrl || 'http://localhost:8080').replace(/\/$/, ''),
    secretKey: secretKey || 'sk_test_demo_gateway_key_999',
  };
}

function isAllowed(pathname: string, method: string) {
  if (PUBLIC_CHECKOUT_PATH.test(pathname)) {
    return method === 'GET' || method === 'POST';
  }

  return PRIVATE_ROUTES.some((route) => route.pattern.test(pathname) && route.methods.includes(method));
}

async function proxyToCore(request: Request, context: RouteContext<'/api/gateway/[...path]'>) {
  const { path } = await context.params;
  const pathname = path.join('/');

  if (!isAllowed(pathname, request.method)) {
    return Response.json({ error: 'Gateway route is not allowed' }, { status: 404 });
  }

  let serverConfig: ReturnType<typeof getServerConfig>;
  try {
    serverConfig = getServerConfig();
  } catch {
    return Response.json(
      { error: 'Gateway BFF is not configured' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const idempotencyKey = request.headers.get('idempotency-key');
  if (contentType) headers.set('content-type', contentType);
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);
  if (!PUBLIC_CHECKOUT_PATH.test(pathname)) {
    headers.set('authorization', `Bearer ${serverConfig.secretKey}`);
  }

  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  try {
    const query = new URL(request.url).search;
    const upstream = await fetch(`${serverConfig.coreUrl}/${pathname}${query}`, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store',
        ...(upstream.headers.get('x-request-id') ? { 'x-request-id': upstream.headers.get('x-request-id')! } : {}),
      },
    });
  } catch {
    return Response.json(
      { error: 'Không kết nối được Gateway Core' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}

export const GET = proxyToCore;
export const POST = proxyToCore;
export const PUT = proxyToCore;
export const DELETE = proxyToCore;

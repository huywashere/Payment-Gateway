const PUBLIC_CHECKOUT_PATH = /^v1\/checkout\/[A-Za-z0-9_-]+(?:\/pay)?$/;
const PRIVATE_PATHS = new Set(['v1/balance', 'v1/payment_intents']);

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

  if (PRIVATE_PATHS.has(pathname)) {
    return (pathname === 'v1/balance' && method === 'GET') ||
      (pathname === 'v1/payment_intents' && method === 'POST');
  }

  return false;
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
    const upstream = await fetch(`${serverConfig.coreUrl}/${pathname}`, {
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

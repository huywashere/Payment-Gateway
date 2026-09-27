import { portalMode, roleCanAccess, sessionTokenFromCookie, verifyPortalSession, type PortalRole } from '@/lib/portal-auth';

const PUBLIC_CHECKOUT_PATH = /^v1\/checkout\/[A-Za-z0-9_-]+(?:\/pay)?$/;
const SANDBOX_CHECKOUT_PATH = /^v1\/checkout\/[A-Za-z0-9_-]+\/sandbox\/(?:complete|action)$/;
type Area = 'dashboard' | 'developer' | 'finance' | 'audit';
const PRIVATE_ROUTES: Array<{ pattern: RegExp; methods: string[]; area: Area }> = [
  { pattern: /^v1\/balance$/, methods: ['GET'], area: 'dashboard' },
  { pattern: /^v1\/payment_intents$/, methods: ['POST'], area: 'developer' },
  { pattern: /^v1\/payment_intents\/[0-9a-f-]+$/, methods: ['GET'], area: 'dashboard' },
  { pattern: /^v1\/payment_intents\/[0-9a-f-]+\/(?:confirm|cancel)$/, methods: ['POST'], area: 'developer' },
  { pattern: /^v1\/charges\/[0-9a-f-]+\/refunds$/, methods: ['POST'], area: 'finance' },
  { pattern: /^v1\/charges\/[0-9a-f-]+$/, methods: ['GET'], area: 'audit' },
  { pattern: /^v1\/(?:api_keys|webhooks\/endpoints|webhooks\/deliveries)$/, methods: ['GET', 'POST'], area: 'developer' },
  { pattern: /^v1\/audit_logs$/, methods: ['GET'], area: 'audit' },
  { pattern: /^v1\/api_keys\/[0-9a-f-]+(?:\/rotate)?$/, methods: ['POST', 'DELETE'], area: 'developer' },
  { pattern: /^v1\/webhooks\/(?:endpoints|deliveries)\/[0-9a-f-]+(?:\/replay)?$/, methods: ['POST', 'DELETE'], area: 'developer' },
  { pattern: /^v1\/payment_methods$/, methods: ['POST'], area: 'developer' },
  { pattern: /^v1\/(?:settlements|payouts)$/, methods: ['GET', 'POST'], area: 'finance' },
  { pattern: /^v1\/disputes$/, methods: ['GET'], area: 'audit' },
  { pattern: /^v1\/disputes\/[0-9a-f-]+\/evidence$/, methods: ['POST'], area: 'finance' },
  { pattern: /^v1\/risk\/(?:profile|evaluations)$/, methods: ['GET', 'PUT'], area: 'finance' },
  { pattern: /^v1\/reconciliation_runs(?:\/[0-9a-f-]+)?$/, methods: ['GET'], area: 'audit' },
  { pattern: /^v1\/sandbox\/bank\/reversals$/, methods: ['POST'], area: 'finance' },
  { pattern: /^v1\/customers\/[0-9a-f-]+\/pii$/, methods: ['DELETE'], area: 'finance' },
];

function getServerConfig() {
  const coreUrl = process.env.GATEWAY_CORE_URL?.trim();
  const mode = portalMode();
  const secretKey = mode === 'live'
    ? process.env.GATEWAY_LIVE_SECRET_KEY?.trim()
    : (process.env.GATEWAY_SANDBOX_SECRET_KEY || process.env.GATEWAY_DEMO_SECRET_KEY)?.trim();

  if (process.env.NODE_ENV === 'production' && (!coreUrl || !secretKey)) {
    throw new Error('Missing gateway URL or environment-specific secret key');
  }
  if (mode === 'live' && secretKey?.startsWith('sk_test_')) {
    throw new Error('A test API key cannot be used in live mode');
  }

  return {
    coreUrl: (coreUrl || 'http://localhost:8080').replace(/\/$/, ''),
    secretKey: secretKey || 'sk_test_demo_gateway_key_999',
    mode,
  };
}

function privateRule(pathname: string, method: string) {
  return PRIVATE_ROUTES.find((route) => route.pattern.test(pathname) && route.methods.includes(method));
}

async function proxyToCore(request: Request, context: RouteContext<'/api/gateway/[...path]'>) {
  const { path } = await context.params;
  const pathname = path.join('/');

  let serverConfig: ReturnType<typeof getServerConfig>;
  try {
    serverConfig = getServerConfig();
  } catch {
    return Response.json(
      { error: 'Gateway BFF is not configured' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }

  const publicCheckout = PUBLIC_CHECKOUT_PATH.test(pathname)
    || (serverConfig.mode === 'sandbox' && SANDBOX_CHECKOUT_PATH.test(pathname));
  const rule = privateRule(pathname, request.method);
  if ((!publicCheckout || !['GET', 'POST'].includes(request.method)) && !rule) {
    return Response.json({ error: 'Gateway route is not allowed' }, { status: 404 });
  }

  let role: PortalRole | null = null;
  if (!publicCheckout) {
    const session = await verifyPortalSession(sessionTokenFromCookie(request.headers.get('cookie')));
    if (!session || session.environment !== serverConfig.mode) {
      return Response.json({ error: 'Authentication required for this environment' }, { status: 401 });
    }
    role = session.role;
    if (!rule || !roleCanAccess(role, rule.area)) {
      return Response.json({ error: 'Your portal role cannot perform this operation' }, { status: 403 });
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) {
        return Response.json({ error: 'Cross-origin mutation is not allowed' }, { status: 403 });
      }
    }
  }

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const idempotencyKey = request.headers.get('idempotency-key');
  if (contentType) headers.set('content-type', contentType);
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);
  if (!publicCheckout) {
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
        'x-gateway-mode': serverConfig.mode,
        ...(role ? { 'x-portal-role': role } : {}),
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

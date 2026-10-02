import { portalMode, roleCanAccess, sessionTokenFromCookie, verifyPortalSession, type PortalRole } from '@/lib/portal-auth';
import { portfolioGatewayResponse } from '@/lib/portfolio-demo';

const PUBLIC_CHECKOUT_PATH = /^v1\/checkout\/[A-Za-z0-9_-]+(?:\/pay)?$/;
const SANDBOX_CHECKOUT_PATH = /^v1\/checkout\/[A-Za-z0-9_-]+\/sandbox\/(?:complete|action)$/;
const PUBLIC_PAYMENT_LINK_PATH = /^v1\/payment_links\/public\/[A-Za-z0-9_-]+(?:\/(?:qr\.svg|events))?$/;
type Area = 'dashboard' | 'developer' | 'finance' | 'audit';
const PRIVATE_ROUTES: Array<{ pattern: RegExp; methods: string[]; area: Area; ownerOnly?: boolean; platform?: boolean }> = [
  { pattern: /^v1\/balance$/, methods: ['GET'], area: 'dashboard' },
  { pattern: /^v1\/dashboard\/(?:overview|events)$/, methods: ['GET'], area: 'dashboard' },
  { pattern: /^v1\/notifications$/, methods: ['GET'], area: 'dashboard' },
  { pattern: /^v1\/notifications\/(?:read-all|[0-9a-f-]+\/read)$/, methods: ['POST'], area: 'dashboard' },
  { pattern: /^v1\/billing\/(?:invoices|subscription-events)$/, methods: ['GET'], area: 'finance' },
  { pattern: /^v1\/billing\/invoices\/[0-9a-f-]+\.csv$/, methods: ['GET'], area: 'finance' },
  { pattern: /^v1\/payment_intents$/, methods: ['GET', 'POST'], area: 'developer' },
  { pattern: /^v1\/payment_intents\/[0-9a-f-]+$/, methods: ['GET'], area: 'dashboard' },
  { pattern: /^v1\/payment_intents\/[0-9a-f-]+\/(?:confirm|cancel)$/, methods: ['POST'], area: 'developer' },
  { pattern: /^v1\/charges\/[0-9a-f-]+\/refunds$/, methods: ['POST'], area: 'finance' },
  { pattern: /^v1\/charges\/[0-9a-f-]+$/, methods: ['GET'], area: 'audit' },
  { pattern: /^v1\/(?:api_keys|webhooks\/endpoints|webhooks\/deliveries)$/, methods: ['GET', 'POST'], area: 'developer' },
  { pattern: /^v1\/audit_logs(?:\/export\.csv)?$/, methods: ['GET'], area: 'audit' },
  { pattern: /^v1\/api_keys\/[0-9a-f-]+(?:\/rotate)?$/, methods: ['POST', 'DELETE'], area: 'developer' },
  { pattern: /^v1\/webhooks\/endpoints\/[0-9a-f-]+(?:\/(?:rotate-secret|test|test-alert))?$/, methods: ['POST', 'DELETE'], area: 'developer' },
  { pattern: /^v1\/webhooks\/deliveries\/[0-9a-f-]+\/replay$/, methods: ['POST'], area: 'developer' },
  { pattern: /^v1\/webhooks\/alerts$/, methods: ['GET'], area: 'developer' },
  { pattern: /^v1\/payment_methods$/, methods: ['POST'], area: 'developer' },
  { pattern: /^v1\/(?:settlements|payouts)$/, methods: ['GET', 'POST'], area: 'finance' },
  { pattern: /^v1\/disputes$/, methods: ['GET'], area: 'audit' },
  { pattern: /^v1\/disputes\/[0-9a-f-]+\/evidence$/, methods: ['POST'], area: 'finance' },
  { pattern: /^v1\/risk\/(?:profile|evaluations)$/, methods: ['GET', 'PUT'], area: 'finance' },
  { pattern: /^v1\/reconciliation_runs(?:\/[0-9a-f-]+)?$/, methods: ['GET'], area: 'audit' },
  { pattern: /^v1\/sandbox\/bank\/reversals$/, methods: ['POST'], area: 'finance' },
  { pattern: /^v1\/sandbox\/reset$/, methods: ['POST'], area: 'dashboard', ownerOnly: true },
  { pattern: /^v1\/customers\/[0-9a-f-]+\/pii$/, methods: ['DELETE'], area: 'finance' },
  { pattern: /^v1\/bank_accounts$/, methods: ['GET', 'POST'], area: 'finance' },
  { pattern: /^v1\/bank_accounts\/[0-9a-f-]+(?:\/(?:default|sync))?$/, methods: ['POST', 'DELETE'], area: 'finance' },
  { pattern: /^v1\/payment_links$/, methods: ['GET', 'POST'], area: 'finance' },
  { pattern: /^v1\/payment_links\/[0-9a-f-]+$/, methods: ['GET'], area: 'finance' },
  { pattern: /^v1\/bank_transactions$/, methods: ['GET'], area: 'finance' },
  { pattern: /^v1\/bank_transactions\/[0-9a-f-]+$/, methods: ['GET'], area: 'finance' },
  { pattern: /^v1\/organization\/members$/, methods: ['GET', 'POST'], area: 'dashboard', ownerOnly: true },
  { pattern: /^v1\/organization\/(?:subscription|plans)$/, methods: ['GET'], area: 'dashboard' },
  { pattern: /^v1\/organization\/subscription$/, methods: ['PUT'], area: 'dashboard', ownerOnly: true },
  { pattern: /^v1\/organization\/members\/[0-9a-f-]+$/, methods: ['PUT'], area: 'dashboard', ownerOnly: true },
  { pattern: /^v1\/reports\/transactions\.csv$/, methods: ['GET'], area: 'finance' },
  { pattern: /^v1\/acquirer\/(?:operations|hosted-fields\/config)$/, methods: ['GET', 'POST'], area: 'developer' },
  { pattern: /^v1\/acquirer\/operations\/[0-9a-f-]+\/3ds$/, methods: ['POST'], area: 'developer' },
  { pattern: /^v1\/platform\/merchants$/, methods: ['GET', 'POST'], area: 'dashboard', ownerOnly: true, platform: true },
  { pattern: /^v1\/platform\/merchants\/[0-9a-f-]+$/, methods: ['PUT'], area: 'dashboard', ownerOnly: true, platform: true },
  { pattern: /^v1\/platform\/operations\/readiness$/, methods: ['GET'], area: 'dashboard', ownerOnly: true, platform: true },
];

function getServerConfig() {
  const coreUrl = process.env.GATEWAY_CORE_URL?.trim();
  const mode = portalMode();
  const secretKey = mode === 'live'
    ? process.env.GATEWAY_LIVE_SECRET_KEY?.trim()
    : (process.env.GATEWAY_SANDBOX_SECRET_KEY || process.env.GATEWAY_DEMO_SECRET_KEY)?.trim();

  if (process.env.NODE_ENV === 'production' && process.env.PORTFOLIO_DEMO_MODE !== 'true' && (!coreUrl || !secretKey)) {
    throw new Error('Missing gateway URL or environment-specific secret key');
  }
  if (mode === 'live' && secretKey?.startsWith('sk_test_')) {
    throw new Error('A test API key cannot be used in live mode');
  }

  return {
    coreUrl: (coreUrl || 'http://localhost:8080').replace(/\/$/, ''),
    secretKey: secretKey || 'sk_test_demo_gateway_key_999',
    mode,
    platformAdminKey: process.env.GATEWAY_PLATFORM_ADMIN_KEY?.trim(),
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
    || PUBLIC_PAYMENT_LINK_PATH.test(pathname)
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
    if (rule.ownerOnly && role !== 'OWNER') {
      return Response.json({ error: 'Owner role is required' }, { status: 403 });
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) {
        return Response.json({ error: 'Cross-origin mutation is not allowed' }, { status: 403 });
      }
    }
  }

  const portfolioResponse = await portfolioGatewayResponse(pathname, request);
  if (portfolioResponse) return portfolioResponse;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const idempotencyKey = request.headers.get('idempotency-key');
  if (contentType) headers.set('content-type', contentType);
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);
  if (!publicCheckout && !rule?.platform) {
    headers.set('authorization', `Bearer ${serverConfig.secretKey}`);
  }
  if (rule?.platform) {
    if (!serverConfig.platformAdminKey) {
      return Response.json({ error: 'Platform administration is not configured' }, { status: 503 });
    }
    headers.set('x-platform-admin-key', serverConfig.platformAdminKey);
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
      signal: pathname.endsWith('/events') ? undefined : AbortSignal.timeout(10_000),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store',
        ...(upstream.headers.get('content-disposition') ? { 'content-disposition': upstream.headers.get('content-disposition')! } : {}),
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

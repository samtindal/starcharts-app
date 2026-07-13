import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Origin fence (hardening spec B6, security-audit NET-1).
 *
 * Cloudflare is proxied in front of Firebase App Hosting. A Cloudflare Transform
 * Rule injects a secret request header on every proxied request; this middleware
 * rejects any request that reaches the App Hosting origin without the matching
 * secret, so nobody can bypass the edge (cache, Bot Fight, rate limiting) by
 * hitting the raw backend URL.
 *
 * The secret is server-only: it comes from Cloud Secret Manager via
 * `apphosting.yaml` (RUNTIME availability), never NEXT_PUBLIC, never in the
 * client bundle. The Transform Rule and this middleware share one secret value.
 */

// Header the Cloudflare Transform Rule injects. Keep this in sync with the rule.
const FENCE_HEADER = 'x-origin-fence';

// Constant-time string comparison so a mismatched header cannot be probed by
// timing. Both operands are short shared secrets.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(req: NextRequest) {
  const secret = process.env.ORIGIN_FENCE_SECRET;

  // Fail open until the secret is provisioned (runbook step 7). Once the secret
  // exists in Secret Manager and the Transform Rule is live, every legitimate
  // request carries the header and direct-to-origin traffic is rejected. Before
  // that, enforcing would 403 the whole site, so we let requests through and log.
  if (!secret) {
    console.warn('ORIGIN_FENCE_SECRET is not set; origin fence is disabled.');
    return NextResponse.next();
  }

  // Allow App Hosting / Cloud Run health checks, which hit the origin directly
  // (not through Cloudflare) and cannot carry the injected header.
  const ua = req.headers.get('user-agent') ?? '';
  if (ua.startsWith('GoogleHC/')) return NextResponse.next();

  const provided = req.headers.get(FENCE_HEADER);
  if (provided && safeEqual(provided, secret)) return NextResponse.next();

  return new NextResponse('Forbidden', { status: 403 });
}

// Run on every route. Cloudflare injects the header on all proxied requests
// (pages, API, and static assets), so any path lacking it came direct to origin.
export const config = {
  matcher: '/:path*',
};

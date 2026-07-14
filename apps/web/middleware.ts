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

// Google Cloud health-check prober ranges (stable, documented):
// https://cloud.google.com/load-balancing/docs/health-check-concepts#ip-ranges
const HEALTH_CHECK_CIDRS = ['35.191.0.0/16', '130.211.0.0/22'];

function ipToInt(ip: string): number | null {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
}

function cidrContains(cidr: string, ip: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const baseInt = ipToInt(base);
  const targetInt = ipToInt(ip);
  if (baseInt === null || targetInt === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (baseInt & mask) === (targetInt & mask);
}

// Cloud Run/GFE appends the true TCP peer address as the last entry of
// X-Forwarded-For; every earlier entry is client-suppliable and untrusted.
// This is the documented way to recover a trustworthy client IP behind GFE.
function trueClientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (!xff) return null;
  const parts = xff.split(',').map((s) => s.trim());
  return parts[parts.length - 1] || null;
}

function isGoogleHealthCheck(req: NextRequest): boolean {
  const ip = trueClientIp(req);
  if (!ip) return false;
  return HEALTH_CHECK_CIDRS.some((cidr) => cidrContains(cidr, ip));
}

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
  // (not through Cloudflare) and cannot carry the injected header. Verified by
  // source IP against Google's documented prober ranges, not by User-Agent:
  // User-Agent is client-controlled, so trusting a "GoogleHC/" prefix let
  // anyone bypass the fence by sending that header themselves.
  if (isGoogleHealthCheck(req)) return NextResponse.next();

  const provided = req.headers.get(FENCE_HEADER);
  if (provided && safeEqual(provided, secret)) return NextResponse.next();

  return new NextResponse('Forbidden', { status: 403 });
}

// Run on every route. Cloudflare injects the header on all proxied requests
// (pages, API, and static assets), so any path lacking it came direct to origin.
export const config = {
  matcher: '/:path*',
};

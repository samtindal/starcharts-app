import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRegulatedRegion } from '../../../lib/ads/regions';

// Tiny dynamic endpoint so the consent default can be region-aware without
// making the (statically-generated) content pages dynamic: only this route
// reads a per-request header, everything else stays static/ISR. Cloudflare
// sets cf-ipcountry on every proxied request (F1); locally or pre-Cloudflare
// the header is absent and isRegulatedRegion() fails safe to "regulated".
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const country = req.headers.get('cf-ipcountry');
  const region = isRegulatedRegion(country) ? 'regulated' : 'open';
  return NextResponse.json({ region }, { headers: { 'Cache-Control': 'private, no-store' } });
}

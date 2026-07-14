import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { isRegulatedRegion } from '../lib/ads/regions';
import { GET } from '../app/api/region/route';

describe('isRegulatedRegion', () => {
  it('treats EEA, UK, and Switzerland as regulated (opt-in required)', () => {
    for (const cc of ['DE', 'FR', 'IE', 'NL', 'GB', 'CH', 'IS']) {
      expect(isRegulatedRegion(cc)).toBe(true);
    }
  });

  it('treats other regions as open (opt-out default), including the US and CA', () => {
    for (const cc of ['US', 'CA', 'AU', 'JP', 'BR']) {
      expect(isRegulatedRegion(cc)).toBe(false);
    }
  });

  it('is case-insensitive', () => {
    expect(isRegulatedRegion('de')).toBe(true);
    expect(isRegulatedRegion('us')).toBe(false);
  });

  it('fails safe to regulated when the country is unknown (no Cloudflare header yet)', () => {
    expect(isRegulatedRegion(null)).toBe(true);
    expect(isRegulatedRegion(undefined)).toBe(true);
    expect(isRegulatedRegion('')).toBe(true);
  });
});

// The dynamic /api/region route is the only per-request piece of the E4
// consent flow; everything else (content pages) stays statically generated.
describe('GET /api/region', () => {
  it('reports "regulated" for an EEA country and never caches (per-visitor)', async () => {
    const req = new NextRequest('http://localhost/api/region', { headers: { 'cf-ipcountry': 'DE' } });
    const res = await GET(req);
    expect(await res.json()).toEqual({ region: 'regulated' });
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('reports "open" for a non-regulated country', async () => {
    const req = new NextRequest('http://localhost/api/region', { headers: { 'cf-ipcountry': 'US' } });
    const res = await GET(req);
    expect(await res.json()).toEqual({ region: 'open' });
  });

  it('fails safe to "regulated" when Cloudflare has not set the header (pre-launch, local dev)', async () => {
    const req = new NextRequest('http://localhost/api/region');
    const res = await GET(req);
    expect(await res.json()).toEqual({ region: 'regulated' });
  });
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // astro-core ships TypeScript source; Next compiles it in-place.
  transpilePackages: ['@starcharts/astro-core'],
  // No `output: 'standalone'`: Firebase App Hosting runs `next build` and wraps
  // the standard output with its own adapter (Cloud Run under the hood). The old
  // standalone target was for the retired hand-built Cloud Run container.
  webpack: (config) => {
    // astro-core uses ESM-style `./angles.js` imports that resolve to .ts
    // files (required for tsx/vitest); teach webpack the same trick.
    config.resolve.extensionAlias = { '.js': ['.ts', '.js'] };
    return config;
  },
  // Origin security headers (hardening spec B1, HTTP-1). Applied at the origin so
  // they hold regardless of the Cloudflare edge. The CSP here is framing/base/object
  // only; a nonce-based script-src needs middleware + hydration testing and is a
  // follow-up (HTTP-1b), so we do not ship a script-src that would break the wheel
  // or the JSON-LD script.
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
      },
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;

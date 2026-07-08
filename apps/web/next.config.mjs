/** @type {import('next').NextConfig} */
const nextConfig = {
  // astro-core ships TypeScript source; Next compiles it in-place.
  transpilePackages: ['@starcharts/astro-core'],
  output: 'standalone', // Cloud Run container (see infra/)
  webpack: (config) => {
    // astro-core uses ESM-style `./angles.js` imports that resolve to .ts
    // files (required for tsx/vitest); teach webpack the same trick.
    config.resolve.extensionAlias = { '.js': ['.ts', '.js'] };
    return config;
  },
};

export default nextConfig;

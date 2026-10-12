import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Private client tokens live in URLs. Avoid routine request/fetch/browser log forwarding.
  // This is development logging only; hosted access logs need separate configuration.
  logging: false,
  async headers() { return [{ source: '/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'X-Frame-Options', value: 'DENY' }] }]; },
};
export default config;

// remediations/next.config.js
// Production-grade security header configuration for Cynbit Technologies

const securityHeaders = [
  // 1. Content Security Policy (CSP)
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://sdk.cashfree.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com data:;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://www.google-analytics.com https://api.cynbit.in;
      frame-ancestors 'none';
      form-action 'self';
      base-uri 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  },
  // 2. Prevent Clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  // 3. Prevent MIME Sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  // 4. Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  // 5. Restrict Browser Features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  // 6. Enforce HTTPS Strict Transport Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
];

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false, // Disables X-Powered-By: Next.js leakage
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      },
      // Scoped CORS configuration: Only allow trusted origins for API routes
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://cynbit.in' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization' }
        ]
      }
    ];
  }
};

/** @type {import('next').NextConfig} */
const path = require('path');

// So build and runtime see POSTGRES_URL when only NEW_POSTGRES_URL is set (e.g. Vercel)
if (!process.env.POSTGRES_URL?.trim() && process.env.NEW_POSTGRES_URL?.trim()) {
  process.env.POSTGRES_URL = process.env.NEW_POSTGRES_URL;
}
if (!process.env.POSTGRES_URL_READ_REPLICA?.trim() && process.env.NEW_POSTGRES_URL_READ_REPLICA?.trim()) {
  process.env.POSTGRES_URL_READ_REPLICA = process.env.NEW_POSTGRES_URL_READ_REPLICA;
}

const nextConfig = {
  async redirects() {
    return [
      { source: '/bulk-email', destination: '/admin/bulk-email', permanent: true },
      { source: '/bulk-email/', destination: '/admin/bulk-email', permanent: true },
    ];
  },
  // Set project root to prevent workspace detection issues
  turbopack: {
    // Explicitly set the root directory to prevent workspace detection issues
    root: __dirname,
  },
  async headers() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';
    const allowedOrigin = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self'",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
      {
        // CDN: long-lived cache for static assets (1 year, immutable)
        source: '/(favicon.ico|logo.png|logo.svg|3.jpg|CVerse_Datascience.jpg|CVerse_ProjectMgt.jpg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        // Service worker: shorter cache for faster updates
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate'
          }
        ],
      },
      {
        // Apply restrictive CORS headers only to API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigin
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig


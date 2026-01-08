/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
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


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set project root to prevent workspace detection issues
  experimental: {
    // Next.js 16 uses Turbopack by default
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
            key: 'Content-Security-Policy',
            value: (() => {
              const isDev = process.env.NODE_ENV === 'development';
              const scriptSrc = [
                "'self'",
                "'unsafe-inline'",
                "https://js.paystack.co",
                "https://*.paystack.co"
              ];
              
              // React Refresh in development requires unsafe-eval
              if (isDev) {
                scriptSrc.push("'unsafe-eval'");
              }
              
              return [
                "default-src 'self'",
                // Note: 'unsafe-inline' is required for payment callback redirect scripts
                // 'unsafe-eval' is only allowed in development for React Refresh
                // Consider implementing nonces in the future for better security
                `script-src ${scriptSrc.join(' ')}`,
                // 'unsafe-inline' needed for React inline styles and dynamic styling
                // Font Awesome CDN added for icon stylesheet
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
                "img-src 'self' data: https: blob:",
                "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
                "connect-src 'self' https://api.paystack.co https://*.paystack.co https://api.getbrevo.com",
                "frame-src 'self' https://*.paystack.co https://checkout.paystack.com",
                "frame-ancestors 'self'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests"
              ].join('; ');
            })()
          },
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
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()'
            ].join(', ')
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
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


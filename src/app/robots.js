const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export default function robots() {
  const origin = baseUrl.replace(/\/$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/confirm-spot/',
        '/payment-success/',
        '/payment-failed/',
        '/dashboard/',
        '/facilitator/',
        '/impersonate/',
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  }
}

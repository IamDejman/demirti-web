import { sql } from '@vercel/postgres';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export default async function sitemap() {
  const origin = baseUrl.replace(/\/$/, '')

  const staticRoutes = [
    { url: '', changeFrequency: 'weekly', priority: 1 },
    { url: '/datascience', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/datasciencesifaq', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/datascience/sponsored', changeFrequency: 'weekly', priority: 0.8 },
    { url: '/projectmanagement', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/jobs', changeFrequency: 'weekly', priority: 0.8 },
    { url: '/sample-projects', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/professionals', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/login', changeFrequency: 'monthly', priority: 0.5 },
    { url: '/register', changeFrequency: 'monthly', priority: 0.5 },
  ]

  const entries = staticRoutes.map(({ url, changeFrequency, priority }) => ({
    url: `${origin}${url || '/'}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))

  try {
    const portfolios = await sql`
      SELECT slug, updated_at FROM portfolios WHERE is_public = true AND slug IS NOT NULL LIMIT 500;
    `;
    for (const p of portfolios.rows) {
      entries.push({
        url: `${origin}/portfolio/${p.slug}`,
        lastModified: p.updated_at || new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch {
    // DB may not be available during build
  }

  return entries;
}

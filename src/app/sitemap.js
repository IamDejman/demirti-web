const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export default function sitemap() {
  const publicRoutes = [
    { url: '', changeFrequency: 'weekly', priority: 1 },
    { url: '/datascience', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/datascience/sponsored', changeFrequency: 'weekly', priority: 0.8 },
    { url: '/projectmanagement', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/jobs', changeFrequency: 'weekly', priority: 0.8 },
    { url: '/sample-projects', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/professionals', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/login', changeFrequency: 'monthly', priority: 0.5 },
    { url: '/register', changeFrequency: 'monthly', priority: 0.5 },
  ]

  return publicRoutes.map(({ url, changeFrequency, priority }) => ({
    url: `${baseUrl.replace(/\/$/, '')}${url || '/'}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}

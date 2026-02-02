const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export default function sitemap() {
  const publicRoutes = [
    { url: '', changeFrequency: 'weekly', priority: 1 },
    { url: '/datascience', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/projectmanagement', changeFrequency: 'weekly', priority: 0.9 },
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

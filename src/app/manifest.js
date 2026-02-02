const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'
const origin = baseUrl.replace(/\/$/, '')

export default function manifest() {
  return {
    name: 'CVERSE by Demirti',
    short_name: 'CVERSE',
    description: 'Transform your career through world-class education in Data Science and Technical Product Management at CVERSE, Demirti\'s premier digital training initiative.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0066cc',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}

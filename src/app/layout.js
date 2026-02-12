import './globals.css'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import ClientAppShell from './components/ClientAppShell'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
})

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'
const origin = baseUrl.replace(/\/$/, '')

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'CVERSE by Demirti',
      url: origin,
      logo: `${origin}/logo.png`,
    },
    {
      '@type': 'WebSite',
      name: 'CVERSE by Demirti',
      url: origin,
      description: "Transform your career through world-class education in Data Science and Technical Product Management at CVERSE, Demirti's premier digital training initiative.",
      publisher: { '@type': 'Organization', name: 'CVERSE by Demirti', url: origin, logo: `${origin}/logo.png` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${origin}/jobs?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'CVERSE by Demirti - Digital Skills Training',
    template: '%s | CVERSE by Demirti',
  },
  description: 'Transform your career through world-class education in Data Science and Technical Product Management at CVERSE, Demirti\'s premier digital training initiative.',
  keywords: ['CVERSE', 'Demirti', 'Data Science', 'Product Management', 'digital skills', 'training', 'career'],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CVERSE by Demirti',
    title: 'CVERSE by Demirti - Digital Skills Training',
    description: 'Transform your career through world-class education in Data Science and Technical Product Management at CVERSE, Demirti\'s premier digital training initiative.',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'CVERSE by Demirti' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CVERSE by Demirti - Digital Skills Training',
    description: 'Transform your career through world-class education in Data Science and Technical Product Management at CVERSE, Demirti\'s premier digital training initiative.',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ClientAppShell>{children}</ClientAppShell>
      </body>
    </html>
  )
} 

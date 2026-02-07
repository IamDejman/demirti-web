import './globals.css'
import { ToastProvider } from './components/ToastProvider'
import AnalyticsTracker from './components/AnalyticsTracker'
import ConsentBanner from './components/ConsentBanner'
import PwaRegister from './components/PwaRegister'

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
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ToastProvider>
          <AnalyticsTracker />
          <PwaRegister />
          {children}
          <ConsentBanner />
        </ToastProvider>
      </body>
    </html>
  )
} 

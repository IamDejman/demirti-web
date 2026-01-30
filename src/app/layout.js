import './globals.css'
import { ToastProvider } from './components/ToastProvider'
import AnalyticsTracker from './components/AnalyticsTracker'
import ConsentBanner from './components/ConsentBanner'

export const metadata = {
  title: 'CVERSE by Demirti - Digital Skills Training',
  description: 'Transform your career through world-class education in Data Science and Technical Product Management at CVERSE, Demirti\'s premier digital training initiative.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
      </head>
      <body>
        <ToastProvider>
          <AnalyticsTracker />
          {children}
          <ConsentBanner />
        </ToastProvider>
      </body>
    </html>
  )
} 
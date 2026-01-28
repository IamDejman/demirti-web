import './globals.css'
import { ToastProvider } from './components/ToastProvider'

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
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
} 
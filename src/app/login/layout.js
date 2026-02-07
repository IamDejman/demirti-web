const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export const metadata = {
  title: 'Log in to CVERSE',
  description: 'Sign in to your CVERSE account to access your courses and learning dashboard.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/login` },
  openGraph: {
    title: 'Log in to CVERSE',
    description: 'Sign in to your CVERSE account to access your courses and learning dashboard.',
    url: '/login',
  },
  twitter: {
    title: 'Log in to CVERSE',
    description: 'Sign in to your CVERSE account to access your courses and learning dashboard.',
  },
}

export default function LoginLayout({ children }) {
  return children;
}

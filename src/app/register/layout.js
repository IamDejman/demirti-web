const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export const metadata = {
  title: 'Create your CVERSE account',
  description: 'Register for CVERSE by Demirti to enroll in Data Science or Technical Product Management programs.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/register` },
  openGraph: {
    title: 'Create your CVERSE account',
    description: 'Register for CVERSE by Demirti to enroll in Data Science or Technical Product Management programs.',
    url: '/register',
  },
  twitter: {
    title: 'Create your CVERSE account',
    description: 'Register for CVERSE by Demirti to enroll in Data Science or Technical Product Management programs.',
  },
}

export default function RegisterLayout({ children }) {
  return children;
}

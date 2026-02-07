const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export const metadata = {
  title: 'Jobs',
  description: 'Discover career opportunities for CVERSE graduates. Browse job listings from companies hiring Data Science and Technical Product Management talent.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/jobs` },
  openGraph: {
    title: 'Jobs | CVERSE by Demirti',
    description: 'Career opportunities for CVERSE graduates in Data Science and Product Management.',
    url: '/jobs',
  },
  twitter: {
    title: 'Jobs | CVERSE by Demirti',
    description: 'Career opportunities for CVERSE graduates in Data Science and Product Management.',
  },
}

export default function JobsLayout({ children }) {
  return children
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export const metadata = {
  title: 'Industry Professionals',
  description: 'Meet the industry experts who mentor and inspire CVERSE learners in Data Science and Technical Product Management.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/professionals` },
  openGraph: {
    title: 'Industry Professionals | CVERSE by Demirti',
    description: 'Meet the experts who mentor CVERSE learners in Data Science and Product Management.',
    url: '/professionals',
  },
  twitter: {
    title: 'Industry Professionals | CVERSE by Demirti',
    description: 'Meet the experts who mentor CVERSE learners in Data Science and Product Management.',
  },
}

export default function ProfessionalsLayout({ children }) {
  return children
}

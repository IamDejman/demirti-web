const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export const metadata = {
  title: 'Sponsored Cohort Application',
  description: 'Apply for the sponsored Data Science cohort at CVERSE. Limited spots available for the 12-week bootcamp.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/datascience/sponsored` },
  openGraph: {
    title: 'Sponsored Cohort Application | CVERSE Data Science',
    description: 'Apply for the sponsored Data Science cohort at CVERSE. Limited spots for the 12-week bootcamp.',
    url: '/datascience/sponsored',
  },
  twitter: {
    title: 'Sponsored Cohort Application | CVERSE Data Science',
    description: 'Apply for the sponsored Data Science cohort at CVERSE. Limited spots for the 12-week bootcamp.',
  },
}

export default function SponsoredLayout({ children }) {
  return children
}

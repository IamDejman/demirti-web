const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export const metadata = {
  title: 'Sample Projects',
  description: 'Explore portfolio projects built by CVERSE learners. See Data Science and Project Management work that showcases real-world skills.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/sample-projects` },
  openGraph: {
    title: 'Sample Projects | CVERSE by Demirti',
    description: 'Portfolio projects from CVERSE learners in Data Science and Project Management.',
    url: '/sample-projects',
  },
  twitter: {
    title: 'Sample Projects | CVERSE by Demirti',
    description: 'Portfolio projects from CVERSE learners in Data Science and Project Management.',
  },
}

export default function SampleProjectsLayout({ children }) {
  return children
}

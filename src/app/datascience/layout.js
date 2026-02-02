const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'
const origin = baseUrl.replace(/\/$/, '')

const courseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Data Science Track',
  description: 'Master Data Science at CVERSE: programming, statistics, machine learning, and data visualization. Turn raw data into real-world insights and drive smarter decisions.',
  url: `${origin}/datascience`,
  provider: {
    '@type': 'Organization',
    name: 'CVERSE by Demirti',
    url: origin,
  },
}

export const metadata = {
  title: 'Data Science Track',
  description: 'Master Data Science at CVERSE: programming, statistics, machine learning, and data visualization. Turn raw data into real-world insights and drive smarter decisions.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/datascience` },
  openGraph: {
    title: 'Data Science Track | CVERSE by Demirti',
    description: 'Master Data Science at CVERSE: programming, statistics, machine learning, and data visualization.',
    url: '/datascience',
    images: [{ url: '/CVerse_Datascience.jpg', width: 1200, height: 630, alt: 'CVERSE Data Science Track' }],
  },
  twitter: {
    title: 'Data Science Track | CVERSE by Demirti',
    description: 'Master Data Science at CVERSE: programming, statistics, machine learning, and data visualization.',
    images: ['/CVerse_Datascience.jpg'],
  },
};

export default function DataScienceLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      {children}
    </>
  );
}

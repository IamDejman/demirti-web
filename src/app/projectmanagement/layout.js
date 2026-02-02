const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'
const origin = baseUrl.replace(/\/$/, '')

const courseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Project Management Track',
  description: 'Learn Technical Product Management at CVERSE: lead cross-functional teams, translate user needs into product strategy, and drive innovation from idea to launch.',
  url: `${origin}/projectmanagement`,
  provider: {
    '@type': 'Organization',
    name: 'CVERSE by Demirti',
    url: origin,
  },
}

export const metadata = {
  title: 'Project Management Track',
  description: 'Learn Technical Product Management at CVERSE: lead cross-functional teams, translate user needs into product strategy, and drive innovation from idea to launch.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/projectmanagement` },
  openGraph: {
    title: 'Project Management Track | CVERSE by Demirti',
    description: 'Learn Technical Product Management at CVERSE: lead teams, define product strategy, and drive innovation.',
    url: '/projectmanagement',
    images: [{ url: '/CVerse_ProjectMgt.jpg', width: 1200, height: 630, alt: 'CVERSE Project Management Track' }],
  },
  twitter: {
    title: 'Project Management Track | CVERSE by Demirti',
    description: 'Learn Technical Product Management at CVERSE: lead teams, define product strategy, and drive innovation.',
    images: ['/CVerse_ProjectMgt.jpg'],
  },
};

export default function ProjectManagementLayout({ children }) {
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

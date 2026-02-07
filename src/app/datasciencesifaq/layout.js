const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';

export const metadata = {
  title: 'Data Science Software Installation FAQs',
  description: 'FAQs for installing Python, Anaconda, Jupyter Notebook, and VS Code for the CVERSE Data Science Academy. Step-by-step installation guidance and troubleshooting.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/datasciencesifaq` },
  openGraph: {
    title: 'Data Science Software Installation FAQs | CVERSE by Demirti',
    description: 'FAQs for installing Python, Anaconda, Jupyter Notebook, and VS Code for the Data Science course.',
    url: '/datasciencesifaq',
  },
  twitter: {
    title: 'Data Science Software Installation FAQs | CVERSE by Demirti',
    description: 'FAQs for installing Python, Anaconda, Jupyter Notebook, and VS Code for the Data Science course.',
  },
};

export default function DataScienceSIFaqLayout({ children }) {
  return <>{children}</>;
}

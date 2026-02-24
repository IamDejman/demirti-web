import Navbar from '../components/Navbar';
import CookiePreferencesLink from '../components/CookiePreferencesLink';
import SocialIcons from '../components/SocialIcons';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';

export const metadata = {
  title: 'Professional Readiness Assessment',
  description: 'Take the Professional Readiness Assessment powered by Skilladder.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/assessment` },
  openGraph: {
    title: 'Professional Readiness Assessment',
    description: 'Evaluate your professional readiness with this assessment.',
    url: '/assessment',
  },
  twitter: {
    title: 'Professional Readiness Assessment',
    description: 'Evaluate your professional readiness with this assessment.',
  },
};

export default function AssessmentPage() {
  return (
    <main className="with-fixed-header">
      <Navbar />

      <section className="track-section" style={{ paddingTop: '6rem', paddingBottom: '3rem' }}>
        <div className="container">
          <h1 className="section-title">Professional Readiness Assessment</h1>
          <p style={{ marginTop: '0.75rem', marginBottom: '1.5rem', color: '#666666', maxWidth: '720px' }}>
            Complete this short assessment to evaluate your readiness and identify areas to grow.
          </p>
          <div
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              backgroundColor: '#ffffff',
              marginTop: '2rem',
              maxWidth: '100%',
            }}
          >
            <iframe
              src="https://assessments.skilladder.ai/take/76502935"
              width="100%"
              height="600"
              frameBorder="0"
              allow="camera; microphone"
              title="Professional Readiness Assessment"
              style={{ display: 'block', width: '100%' }}
            />
          </div>
          <div
            style={{
              marginTop: '2rem',
              padding: '1.5rem',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #e5e7eb',
              maxWidth: '720px',
            }}
          >
            <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
              The assessment provider does not allow the test to be embedded inside another website.
              Click the button below to open the assessment in a new tab.
            </p>
            <a
              href="https://assessments.skilladder.ai/take/76502935"
              target="_blank"
              rel="noreferrer"
              className="cta-button"
              style={{
                display: 'inline-block',
                padding: '0.9rem 2.4rem',
                borderRadius: '9999px',
                backgroundColor: '#0066cc',
                color: '#ffffff',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background-color 0.2s ease, transform 0.1s ease',
              }}
            >
              Start Assessment
            </a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <p>
                Empowering the next generation of digital professionals through world-class education and practical training.
              </p>
            </div>
            <div className="footer-section">
              <h3>Follow Us</h3>
              <SocialIcons />
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Demirti Limited. All rights reserved.</p>
            <CookiePreferencesLink />
          </div>
        </div>
      </footer>
    </main>
  );
}


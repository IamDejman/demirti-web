import Navbar from './components/Navbar';
import ContactForm from './components/ContactForm';
import CookiePreferencesLink from './components/CookiePreferencesLink';
import Link from 'next/link';
import Image from 'next/image';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com'

export const metadata = {
  title: 'Home',
  description: 'CVERSE by Demirti offers world-class Data Science and Technical Product Management training. Build skills, boost confidence, and transform your career with our digital programs.',
  alternates: { canonical: `${baseUrl.replace(/\/$/, '')}/` },
  openGraph: {
    title: 'CVERSE by Demirti - Digital Skills Training',
    description: 'CVERSE by Demirti offers world-class Data Science and Technical Product Management training. Build skills and transform your career.',
    url: '/',
  },
  twitter: {
    title: 'CVERSE by Demirti - Digital Skills Training',
    description: 'CVERSE by Demirti offers world-class Data Science and Technical Product Management training.',
  },
};

export default function Home() {
  return (
    <main className="with-fixed-header">
      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-content">
            <h1>Build Skills. Boost Confidence. Transform Your Career.</h1>
            <p>CVERSE is Demirti&apos;s premier digital training initiative, designed to equip you with the skills needed to excel in today&apos;s technology-driven world.</p>
            <a href="#tracks" className="cta-button">Explore Our Courses</a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <div className="container">
          <div className="about-content">
            <h2 className="section-title">About CVERSE</h2>
            <div className="about-text">
              <h3>Our Mission</h3>
              <p>At CVERSE, we&apos;re committed to bridging the digital skills gap by delivering world-class technology education such as Data Science and Technical Product Management. Our mission is to empower individuals with the knowledge and practical skills needed to thrive in the digital economy.</p>
              
              <h3>Our Approach</h3>
              <p>We believe in learning by doing. Our curriculum combines theoretical foundations with hands-on projects that simulate real-world challenges. Small class sizes ensure personalized attention, while our industry-experienced instructors bring practical insights to every lesson.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tracks Overview */}
      <section className="tracks-overview" id="tracks">
        <div className="container">
          <h2 className="section-title">Our Current Tracks</h2>
          <div className="tracks-container">
            <div className="track-card data-science-card">
              <h3>Data Science</h3>
              <p>Master the skills to turn raw data into real-world insights. Learn programming, statistics, machine learning, and data visualization to solve with complex problems and drive smarter business decisions.</p>
              <Link href="/datascience" className="track-button data-science-button">Learn More</Link>
            </div>
            <div className="track-card tpm-card">
              <h3>Project Management</h3>
              <p>Bridge the gap between business and technology. Learn how to lead cross-functional teams, translate user needs into product strategy, and drive technical innovation from idea to launch.</p>
              <Link href="/projectmanagement" className="track-button tpm-button">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-container">
            <h2 className="section-title">Contact Us</h2>
            <div className="contact-grid">
              <div className="contact-info">
                <h3>Get in Touch</h3>
                <p>Have questions about our programs or the application process? We&apos;re here to help!</p>
                
                <div className="contact-details">
                  <p><strong>Email:</strong> admin@demirti.com</p>
                </div>
              </div>
              
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <Image src="/logo.svg" alt="CVERSE Logo" className="footer-logo" width={150} height={50} />
              <p>Empowering the next generation of digital professionals through world-class education and practical training.</p>
            </div>
            <div className="footer-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="https://www.linkedin.com/company/cverse-academy/" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="https://x.com/CVerse_Academy" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-x-twitter"></i>
                </a>
                <a href="https://www.instagram.com/cversedemirti/" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://www.tiktok.com/@cverse_academy" className="social-link" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
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
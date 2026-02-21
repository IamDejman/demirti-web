import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Privacy Policy | CVERSE Academy',
};

export default function PrivacyPage() {
  return (
    <main className="with-fixed-header">
      <Navbar />
      <div className="auth-page" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
      <div className="auth-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="auth-header">
          <Link href="/" className="auth-logo" style={{ display: 'inline-block' }}>
            <Image src="/logo.png" alt="CVERSE" width={48} height={48} priority />
          </Link>
          <h1 className="auth-title">Privacy Policy</h1>
          <p className="auth-subtitle">CVERSE Academy</p>
        </div>

        <div style={{ color: 'var(--text-color)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
          <p style={{ marginBottom: '1rem' }}>
            Last updated: February 2025. CVERSE Academy (&quot;CVERSE&quot;, &quot;we&quot;, &quot;our&quot;) is committed to protecting your privacy. This policy describes how we collect, use, and safeguard your information when you use our education platform.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem' }}>1. Information We Collect</h2>
          <p style={{ marginBottom: '1rem' }}>
            We collect information you provide directly, including:
          </p>
          <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
            <li>Name, email address, and contact details</li>
            <li>Account credentials and profile information</li>
            <li>Academic progress, assignments, submissions, and portfolio content</li>
            <li>Communications with facilitators and support</li>
          </ul>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem' }}>2. How We Use Your Information</h2>
          <p style={{ marginBottom: '1rem' }}>
            We use your data to deliver and improve our services: to provide coursework, track progress, issue certificates, facilitate live classes and office hours, send notifications, and support you. We may use aggregated, anonymized data for analytics and product improvement.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem' }}>3. Cookies</h2>
          <p style={{ marginBottom: '1rem' }}>
            We use cookies and similar technologies to maintain your session, remember preferences, and improve site functionality. You can accept or decline non-essential cookies via our cookie banner. Essential cookies are required for the platform to function.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem' }}>4. Third-Party Services</h2>
          <p style={{ marginBottom: '1rem' }}>
            We may use third-party services for payment processing, email delivery, analytics, and live class hosting (e.g. video conferencing). These providers have their own privacy policies and handle data in accordance with their terms. We do not sell your personal information to third parties.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem' }}>5. Data Retention</h2>
          <p style={{ marginBottom: '1rem' }}>
            We retain your data for as long as your account is active and as needed to provide services, comply with legal obligations, and resolve disputes. If you delete your account, we anonymize or remove your personal data in accordance with this policy.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem' }}>6. Your Rights</h2>
          <p style={{ marginBottom: '1rem' }}>
            You may request access to your personal data, request corrections, or request deletion of your account. You can export your data via the platform (when logged in) or contact us. For account deletion, use the delete account option in your profile or contact support. We will process requests in accordance with applicable law.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem' }}>7. Security</h2>
          <p style={{ marginBottom: '1rem' }}>
            We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or destruction. However, no method of transmission over the internet is completely secure.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem' }}>8. Contact</h2>
          <p style={{ marginBottom: '1rem' }}>
            For privacy-related questions or requests, contact us at the email or address provided on our website or in the CVERSE Academy platform.
          </p>

          <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
            By using CVERSE Academy, you agree to this Privacy Policy. We may update this policy from time to time; we will notify you of material changes via the platform or email.
          </p>
        </div>

        <div className="auth-link-wrap" style={{ marginTop: '2rem' }}>
          <Link href="/" className="auth-link">Return to Home</Link>
        </div>
      </div>
    </div>
    </main>
  );
}

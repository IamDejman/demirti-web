import { notFound } from 'next/navigation';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import Navbar from '../../components/Navbar';

export async function generateMetadata({ params }) {
  const code = params?.code;
  if (!code) return {};
  return {
    title: 'Certificate Verification',
    description: 'Verify the authenticity of a CVERSE Academy certificate.',
    robots: { index: false },
  };
}

export default async function VerifyCertificatePage({ params }) {
  const code = params?.code;
  if (!code) return notFound();
  await ensureLmsSchema();
  const result = await sql`
    SELECT c.*, u.first_name, u.last_name, u.email, co.name AS cohort_name, t.track_name
    FROM certificates c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN cohorts co ON co.id = c.cohort_id
    LEFT JOIN tracks t ON t.id = co.track_id
    WHERE c.verification_code = ${code} OR c.certificate_number = ${code}
    LIMIT 1;
  `;
  const cert = result.rows[0];
  if (!cert) return notFound();
  const fullName = `${cert.first_name || ''} ${cert.last_name || ''}`.trim() || cert.email;

  return (
    <main>
      <Navbar />
      <section className="container" style={{ padding: '6rem 0 3rem' }}>
        <h1 className="text-3xl font-bold text-gray-900">Certificate Verification</h1>
        <p className="text-gray-600 mt-2">This certificate is valid and issued by CVERSE Academy.</p>
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <p className="text-sm text-gray-500">Certificate Number</p>
          <p className="text-lg font-semibold text-gray-900">{cert.certificate_number}</p>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Recipient</p>
            <p className="text-lg font-semibold text-gray-900">{fullName}</p>
          </div>
          {cert.track_name && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Track</p>
              <p className="text-lg font-semibold text-gray-900">{cert.track_name}</p>
            </div>
          )}
          {cert.cohort_name && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Cohort</p>
              <p className="text-lg font-semibold text-gray-900">{cert.cohort_name}</p>
            </div>
          )}
          <div className="mt-4">
            <p className="text-sm text-gray-500">Issued</p>
            <p className="text-lg font-semibold text-gray-900">{new Date(cert.issued_at).toLocaleDateString()}</p>
          </div>
          <a href={`/api/certificates/${cert.id}/pdf`} className="inline-block mt-6 text-sm text-primary font-medium">
            Download certificate PDF
          </a>
        </div>
      </section>
    </main>
  );
}

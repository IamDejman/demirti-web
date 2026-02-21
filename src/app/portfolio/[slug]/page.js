import { notFound } from 'next/navigation';
import Image from 'next/image';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import Navbar from '../../components/Navbar';

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com').replace(/\/$/, '');

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (!slug) return {};
  await ensureLmsSchema();
  const res = await sql`
    SELECT p.headline, p.bio, u.first_name, u.last_name
    FROM portfolios p JOIN users u ON u.id = p.user_id
    WHERE p.slug = ${slug} AND p.is_public = true LIMIT 1;
  `;
  const p = res.rows[0];
  if (!p) return {};
  const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || slug;
  const title = `${name} - Portfolio`;
  const description = p.headline || p.bio?.slice(0, 155) || `${name}'s portfolio on CVERSE`;
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(name)}&subtitle=Portfolio`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/portfolio/${slug}`,
      type: 'profile',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
  };
}

export default async function PortfolioPublicPage({ params }) {
  const { slug } = await params;
  if (!slug) return notFound();
  await ensureLmsSchema();
  const portfolioRes = await sql`
    SELECT p.*, u.first_name, u.last_name, u.email
    FROM portfolios p
    JOIN users u ON u.id = p.user_id
    WHERE p.slug = ${slug} AND p.is_public = true
    LIMIT 1;
  `;
  const portfolio = portfolioRes.rows[0];
  if (!portfolio) return notFound();

  const [projectsRes, linksRes] = await Promise.all([
    sql`SELECT * FROM portfolio_projects WHERE portfolio_id = ${portfolio.id} ORDER BY order_index ASC;`,
    sql`SELECT * FROM portfolio_social_links WHERE portfolio_id = ${portfolio.id} ORDER BY id ASC;`,
  ]);

  const fullName = `${portfolio.first_name || ''} ${portfolio.last_name || ''}`.trim() || portfolio.email;

  const initials = `${(portfolio.first_name || '')[0] || ''}${(portfolio.last_name || '')[0] || ''}`.toUpperCase() || '?';

  return (
    <main style={{ backgroundColor: 'var(--background-light)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero header */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
          padding: 'calc(var(--header-offset) + 3rem) 0 3rem',
          color: '#fff',
        }}
      >
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.04em',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                {fullName}
              </h1>
              {portfolio.headline && (
                <p style={{ fontSize: '1.125rem', opacity: 0.9, marginTop: '0.25rem' }}>{portfolio.headline}</p>
              )}
            </div>
          </div>

          {portfolio.bio && (
            <p style={{ maxWidth: 640, lineHeight: 1.7, opacity: 0.88, marginTop: '1.25rem', fontSize: '1rem' }}>
              {portfolio.bio}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'center' }}>
            {portfolio.resume_url && (
              <a
                href={portfolio.resume_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 1.25rem', borderRadius: '9999px',
                  background: '#fff', color: 'var(--primary-color)',
                  fontWeight: 600, fontSize: '0.875rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Resume
              </a>
            )}
            {linksRes.rows.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: '#fff', fontSize: '0.8125rem', fontWeight: 500,
                  transition: 'background 0.2s, border-color 0.2s',
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                {link.platform}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="container" style={{ maxWidth: 860, padding: '3rem 1.5rem 4rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '1.5rem' }}>
          Projects
        </h2>

        {projectsRes.rows.length === 0 ? (
          <div
            style={{
              textAlign: 'center', padding: '3rem 1rem',
              background: 'var(--background-color)', borderRadius: 16,
              border: '1px solid var(--border-color)',
            }}
          >
            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>No projects listed yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {projectsRes.rows.map((project) => (
              <div
                key={project.id}
                className="portfolio-project-card"
                style={{
                  background: 'var(--background-color)', borderRadius: 16,
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden', transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {project.image_url && (
                  <Image
                    src={project.image_url}
                    alt={project.title}
                    width={400}
                    height={200}
                    className="w-full object-cover"
                    style={{ height: 180 }}
                    unoptimized
                  />
                )}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-color)' }}>{project.title}</h3>
                  {project.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.6, marginTop: '0.5rem' }}>
                      {project.description}
                    </p>
                  )}
                  {project.link_url && (
                    <a
                      href={project.link_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        marginTop: '1rem', fontSize: '0.875rem', fontWeight: 600,
                        color: 'var(--primary-color)', transition: 'color 0.2s',
                      }}
                    >
                      View project
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

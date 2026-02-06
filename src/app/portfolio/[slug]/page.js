import { notFound } from 'next/navigation';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import Navbar from '../../components/Navbar';

export default async function PortfolioPublicPage({ params }) {
  const slug = params?.slug;
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

  return (
    <main>
      <Navbar />
      <section className="container" style={{ padding: '6rem 0 3rem' }}>
        <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
        {portfolio.headline && <p className="text-gray-600 mt-2">{portfolio.headline}</p>}
        {portfolio.bio && <p className="text-gray-600 mt-4 max-w-2xl">{portfolio.bio}</p>}
        {portfolio.resume_url && (
          <a href={portfolio.resume_url} target="_blank" rel="noreferrer" className="text-primary text-sm font-medium mt-4 inline-block">
            View resume
          </a>
        )}
        {linksRes.rows.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {linksRes.rows.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="text-primary">
                {link.platform}
              </a>
            ))}
          </div>
        )}
      </section>
      <section className="container" style={{ paddingBottom: '4rem' }}>
        <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
        {projectsRes.rows.length === 0 ? (
          <p className="text-gray-500 mt-2">No projects listed yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {projectsRes.rows.map((project) => (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-5">
                {project.image_url && (
                  <img src={project.image_url} alt={project.title} className="w-full h-40 object-cover rounded-lg" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 mt-3">{project.title}</h3>
                {project.description && <p className="text-sm text-gray-600 mt-2">{project.description}</p>}
                {project.link_url && (
                  <a href={project.link_url} target="_blank" rel="noreferrer" className="text-sm text-primary mt-3 inline-block">
                    View project
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

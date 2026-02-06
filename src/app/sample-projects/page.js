'use client';

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

export default function SampleProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch('/api/sample-projects');
      const data = await res.json();
      if (res.ok && data.projects) setProjects(data.projects);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main>
      <Navbar />
      <section className="container" style={{ padding: '6rem 0 3rem' }}>
        <h1 className="text-3xl font-bold text-gray-900">Sample Projects</h1>
        <p className="text-gray-600 mt-2">Preview the type of portfolio work you can build with CVERSE.</p>
      </section>
      <section className="container" style={{ paddingBottom: '4rem' }}>
        {loading ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">No projects available yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-5">
                {project.thumbnail_url && (
                  <img src={project.thumbnail_url} alt={project.title} className="w-full h-40 object-cover rounded-lg" />
                )}
                <h2 className="text-lg font-semibold text-gray-900 mt-3">{project.title}</h2>
                {project.description && <p className="text-sm text-gray-600 mt-2">{project.description}</p>}
                <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-2">
                  {project.track_name && <span>{project.track_name}</span>}
                  {Array.isArray(project.tags) && project.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full">{tag}</span>
                  ))}
                </div>
                {project.external_url && (
                  <a href={project.external_url} target="_blank" rel="noreferrer" className="text-sm text-primary mt-3 inline-block">
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

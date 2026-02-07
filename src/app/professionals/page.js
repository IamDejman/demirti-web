'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Navbar from '../components/Navbar';

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch('/api/industry-professionals');
      const data = await res.json();
      if (res.ok && data.professionals) setProfessionals(data.professionals);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main>
      <Navbar />
      <section className="container" style={{ padding: '6rem 0 3rem' }}>
        <h1 className="text-3xl font-bold text-gray-900">Industry Professionals</h1>
        <p className="text-gray-600 mt-2">Meet the experts who mentor and inspire CVERSE learners.</p>
      </section>
      <section className="container" style={{ paddingBottom: '4rem' }}>
        {loading ? (
          <p className="text-gray-500">Loading profiles...</p>
        ) : professionals.length === 0 ? (
          <p className="text-gray-500">No professionals to show yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {professionals.map((person) => (
              <div key={person.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    {person.photo_url ? (
                      <Image src={person.photo_url} alt={person.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        {person.name?.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{person.name}</h2>
                    <p className="text-sm text-gray-600">{person.title || 'Professional'} · {person.company || 'Company'}</p>
                    {person.bio && <p className="text-sm text-gray-600 mt-2">{person.bio}</p>}
                    {person.linkedin_url && (
                      <a href={person.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-primary mt-2 inline-block">
                        View LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

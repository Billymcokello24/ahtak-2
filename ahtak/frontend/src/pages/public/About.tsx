import { useEffect, useState } from 'react';
import { publicApi, type TeamMember, type SiteSettings } from '../../lib/api';

function img(url: string | null): string {
  if (!url) return '';
  return url.startsWith('http') ? url : url;
}

export default function About() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([publicApi.settings(), publicApi.team()])
      .then(([s, t]) => {
        setSettings(s);
        setTeam(Array.isArray(t) ? t : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-slate-500">Loading…</div>;
  if (error) return <div className="py-16 text-center text-red-600">{error}</div>;

  return (
    <div>
      <section className="border-b border-slate-200 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-800">About Us</h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            {settings?.site_name || 'AHTTAK'} is a membership-based organization dedicated to providing savings, benefits, and community support to our members.
          </p>
          {settings?.address && (
            <p className="mt-2 text-sm text-slate-500">{settings.address}</p>
          )}
        </div>
      </section>

      {team.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-800">Board & Team</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  {m.photo && (
                    <img
                      src={img(m.photo) || '#'}
                      alt={m.name}
                      className="h-32 w-32 rounded-full object-cover"
                    />
                  )}
                  <h3 className="mt-4 font-semibold text-slate-900">{m.name}</h3>
                  <p className="text-sm font-medium text-emerald-600">{m.designation}</p>
                  {m.department && <p className="text-xs text-slate-500">{m.department}</p>}
                  {m.qualifications && (
                    <p className="mt-1 text-xs text-slate-600">{m.qualifications}</p>
                  )}
                  {m.years_of_experience && (
                    <p className="mt-1 text-xs text-slate-500">{m.years_of_experience} years experience</p>
                  )}
                  {m.bio && <p className="mt-2 text-sm text-slate-600">{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

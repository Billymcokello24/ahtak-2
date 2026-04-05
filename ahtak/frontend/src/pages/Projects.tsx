import { useEffect, useState } from 'react';
import { publicApi, type Project } from '../lib/api';

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
}

export default function Projects() {
  const [list, setList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    publicApi.projects().then(setList).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' });
    } catch {
      return d;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Projects and Partnerships</h1>
      <p className="mt-4 text-slate-600">
        Our ongoing projects and partnerships with institutions and stakeholders.
      </p>

      {loading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="mt-8 text-slate-500">No projects to display at the moment.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const imgUrl = mediaUrl(p.image);
            return (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                {imgUrl ? (
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={imgUrl}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-slate-200 to-slate-300" />
                )}
                <div className="p-6">
                  <span className="text-xs font-medium uppercase text-slate-500">{p.project_type}</span>
                  <h3 className="mt-1 font-semibold text-slate-900">{p.title}</h3>
                  {p.partners && (
                    <p className="mt-1 text-sm text-slate-500">Partners: {p.partners}</p>
                  )}
                  {p.description && (
                    <div className="mt-2">
                      <p className={expanded[p.id] ? 'text-slate-600 whitespace-pre-wrap' : 'line-clamp-3 text-slate-600'}>
                        {p.description}
                      </p>
                      {p.description.length > 180 && (
                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                          className="mt-2 text-sm font-medium text-emerald-600 hover:underline"
                        >
                          {expanded[p.id] ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )}
                  {(p.start_date || p.end_date) && (
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(p.start_date)} – {formatDate(p.end_date) || 'Ongoing'}
                    </p>
                  )}
                  {p.external_url && (
                    <a
                      href={p.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline"
                    >
                      Learn more
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

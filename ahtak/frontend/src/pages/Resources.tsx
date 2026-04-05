import { useEffect, useState } from 'react';
import { publicApi, type Resource } from '../lib/api';

function mediaUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  guideline: 'Guideline',
  surveillance: 'Surveillance',
  publication: 'Publication',
  link: 'External Link',
};

export default function Resources() {
  const [list, setList] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.resources().then(setList).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Resources</h1>
      <p className="mt-4 text-slate-600">
        Professional guidelines, disease surveillance updates, publications, and links to relevant institutions.
      </p>

      {loading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="mt-8 text-slate-500">No resources available at the moment.</p>
      ) : (
        <div className="mt-10 space-y-4">
          {list.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {RESOURCE_TYPE_LABELS[r.resource_type] || r.resource_type}
                  </span>
                  <h3 className="mt-2 font-semibold text-slate-900">{r.title}</h3>
                  {r.description && (
                    <p className="mt-1 text-slate-600">{r.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.file && (
                    <a
                      href={mediaUrl(r.file)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      Download
                    </a>
                  )}
                  {r.external_url && (
                    <a
                      href={r.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                    >
                      Visit
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

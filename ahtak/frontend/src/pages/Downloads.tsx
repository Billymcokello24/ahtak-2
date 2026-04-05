import { useEffect, useState } from 'react';
import { publicApi, type Download } from '../lib/api';

function mediaUrl(path: string): string {
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  form: 'Form',
  plan: 'Plan',
  report: 'Report',
  cpd: 'CPD',
  constitution: 'Constitution',
  other: 'Other',
};

export default function Downloads() {
  const [list, setList] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.downloads().then(setList).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Downloads</h1>
      <p className="mt-4 text-slate-600">
        Forms, plans, reports, CPD materials, constitution, and other documents.
      </p>

      {loading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="mt-8 text-slate-500">No downloads available at the moment.</p>
      ) : (
        <div className="mt-10 space-y-4">
          {list.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {CATEGORY_LABELS[d.category] || d.category}
                  </span>
                  <h3 className="mt-2 font-semibold text-slate-900">{d.title}</h3>
                  {d.description && (
                    <p className="mt-1 text-slate-600">{d.description}</p>
                  )}
                </div>
                <a
                  href={mediaUrl(d.file)}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

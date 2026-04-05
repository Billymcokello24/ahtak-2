import { useEffect, useState } from 'react';
import { publicApi, type Job } from '../lib/api';

const JOB_TYPE_LABELS: Record<string, string> = {
  job: 'Job',
  internship: 'Internship',
  volunteer: 'Volunteer',
  tender: 'Tender',
};

export default function Jobs() {
  const [list, setList] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.jobs().then(setList).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return d;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Jobs and Opportunities</h1>
      <p className="mt-4 text-slate-600">
        Current job vacancies, internships, volunteer opportunities, and tenders.
      </p>

      {loading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="mt-8 text-slate-500">No opportunities listed at the moment.</p>
      ) : (
        <div className="mt-10 space-y-6">
          {list.map((j) => (
            <article
              key={j.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {JOB_TYPE_LABELS[j.job_type] || j.job_type}
                  </span>
                  {j.organization && (
                    <p className="mt-1 text-sm text-slate-500">{j.organization}</p>
                  )}
                  <h3 className="mt-2 font-semibold text-slate-900">{j.title}</h3>
                  {j.description && (
                    <p className="mt-2 text-slate-600 line-clamp-4 whitespace-pre-wrap">{j.description}</p>
                  )}
                  {j.requirements && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{j.requirements}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    {j.location && <span>{j.location}</span>}
                    {j.application_deadline && (
                      <span>Deadline: {formatDate(j.application_deadline)}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {j.application_url && (
                    <a
                      href={j.application_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      Apply
                    </a>
                  )}
                  {j.contact_email && !j.application_url && (
                    <a
                      href={`mailto:${j.contact_email}`}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:border-slate-300"
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

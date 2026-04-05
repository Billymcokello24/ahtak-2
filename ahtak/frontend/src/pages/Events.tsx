import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi, type Event } from '../lib/api';

export default function Events() {
  const [data, setData] = useState<{ results: Event[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    eventsApi
      .list()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading events…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const list = data?.results ?? [];
  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Events</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((ev) => {
          const cutoff = ev.end_date || ev.start_date;
          const isPastEvent = cutoff ? new Date(cutoff) < now : false;
          return (
          <div
            key={ev.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-emerald-200 transition-colors"
          >
            <h2 className="font-semibold text-slate-800">{ev.title}</h2>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ev.description}</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {new Date(ev.start_date).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
              <span
                className={
                  'px-2 py-0.5 rounded text-xs font-medium ' +
                  (ev.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : ev.status === 'draft'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-slate-100 text-slate-700')
                }
              >
                {ev.status}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Member: KES {ev.price_member} · Non-member: KES {ev.price_non_member}
              </span>
              {ev.status === 'published' && !isPastEvent && (
                <Link
                  to={`/dashboard/events/${ev.id}/register`}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Register →
                </Link>
              )}
              {ev.status === 'published' && isPastEvent && (
                <span className="text-xs font-medium text-slate-500">Registration closed</span>
              )}
            </div>
          </div>
        )})}
      </div>
      {list.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No events yet.
        </div>
      )}
    </div>
  );
}

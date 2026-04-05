import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { events, type Event } from '../lib/api';

export default function CPD() {
  const [list, setList] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    events.cpdList().then((r) => setList(Array.isArray(r) ? r : r.results ?? [])).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">CPD – Continuing Professional Development</h1>
      <p className="mt-4 text-slate-600">
        Earn CPD points through our accredited events, workshops, and training sessions. Track your progress and download certificates from the member portal.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">Upcoming CPD Events</h2>
        {loading ? (
          <p className="mt-4 text-slate-500">Loading…</p>
        ) : list.length === 0 ? (
          <p className="mt-4 text-slate-500">No CPD events scheduled at the moment. Check back later.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {list.map((e) => (
              <Link
                key={e.id}
                to={`/events/${e.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{e.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(e.start_date)}</p>
                    {(e.cpd_points ?? 0) > 0 && (
                      <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-800">
                        {e.cpd_points} CPD points
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-emerald-600 sm:shrink-0">View details →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-semibold text-slate-900">CPD Points & Certificates</h3>
        <p className="mt-2 text-slate-600">
          Members who attend CPD-accredited events can earn points toward their professional development requirements.
          After the event, once you are checked in, you can download your attendance certificate from the member portal.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline"
        >
          Sign in to view your CPD summary
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to="/events"
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          View All Events
        </Link>
        <Link
          to="/events/calendar"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 transition hover:border-slate-300"
        >
          View Events Calendar
        </Link>
        <Link
          to="/register"
          className="rounded-xl border border-slate-200 px-6 py-3 font-medium text-slate-700 transition hover:border-slate-300"
        >
          Become a Member
        </Link>
      </div>
    </div>
  );
}

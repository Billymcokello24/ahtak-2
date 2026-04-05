import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi, type Event } from '../lib/api';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80';

function formatCurrency(amount: string | number) {
  return `KES ${Number(amount).toLocaleString()}`;
}

function getBannerUrl(banner: string | null | undefined): string | null {
  if (!banner) return null;
  if (banner.startsWith('http')) return banner;
  return banner.startsWith('/') ? banner : `/media/${banner}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  agm: 'AGM',
  training: 'Training',
  workshop: 'Workshop',
  seminar: 'Seminar',
  social: 'Social Event',
};

export default function PublicEvents() {
  const [data, setData] = useState<{ results: Event[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    eventsApi
      .list({ status: 'published' })
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => {
        setError(e?.message || String(e) || 'Unable to load events. Is the server running?');
      })
      .finally(() => setLoading(false));
  }, []);

  const list = data && Array.isArray(data.results) ? data.results : [];
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const up: Event[] = [];
    const pa: Event[] = [];
    for (const e of list) {
      const d = e?.start_date ? new Date(e.start_date) : new Date(0);
      if (!isNaN(d.getTime()) && d >= now) up.push(e);
      else pa.push(e);
    }
    up.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    pa.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    return { upcoming: up, past: pa };
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return upcoming;
    return upcoming.filter((ev) => {
      const category = ((ev as any).category as string) || '';
      const categoryLabel = CATEGORY_LABELS[category] || category || 'Event';
      const hay = `${ev.title}\n${ev.description}\n${categoryLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [upcoming, query]);

  return (
    <div className="min-w-0 overflow-x-hidden bg-slate-50">
      {/* Hero Section */}
      <section className="relative h-[420px] w-full overflow-hidden bg-slate-900">
        <img
          src={HERO_IMAGE}
          alt="Community events and gatherings"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Upcoming Events
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200 sm:text-xl">
            Join our workshops, AGMs, training sessions, and social events. Connect, learn, and grow with our community.
          </p>
          <Link
            to="/events/calendar"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:bg-white"
          >
            View calendar
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Registration workflow */}
      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-900">How event registration works</h2>
          <p className="mt-2 text-slate-600">
            Browse events below, click <strong>View full details</strong>, then <strong>Register</strong>. You must sign in to complete registration. Members pay discounted rates; guests pay the standard rate.
          </p>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-800">Member</span>
              <span className="text-slate-600">Discounted rate for active members</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 font-medium text-slate-700">Guest</span>
              <span className="text-slate-600">Standard rate for non-members</span>
            </div>
          </div>
        </div>
      </section>

      {/* Events grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Upcoming events</h2>
            <p className="mt-2 text-slate-600">Browse what’s coming up and register in a few steps.</p>
          </div>
          <div className="w-full max-w-xl">
            <label className="sr-only" htmlFor="event-search">Search events</label>
            <div className="relative">
              <input
                id="event-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events…"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {filtered.length} result(s){query.trim() ? ` for “${query.trim()}”` : ''}.
            </p>
          </div>
        </div>

        {loading && <p className="mt-8 text-slate-500">Loading…</p>}
        {error && (
          <div className="mt-8 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ev) => {
              const bannerUrl = getBannerUrl(ev.banner as string | null);
              const category = (ev.category as string) || '';
              const categoryLabel = CATEGORY_LABELS[category] || category || 'Event';
              return (
                <article
                  key={ev.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {/* Event banner */}
                  <Link to={`/events/${ev.id}`} className="block aspect-[16/10] overflow-hidden bg-slate-100">
                    {bannerUrl ? (
                      <img
                        src={bannerUrl}
                        alt={ev.title ?? 'Event'}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                        <span className="text-4xl font-bold text-slate-400">AHTTAK</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-6">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                      {categoryLabel}
                    </span>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      <Link to={`/events/${ev.id}`} className="hover:text-emerald-600">
                        {ev.title ?? 'Event'}
                      </Link>
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                      {ev.description ?? ''}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(ev.start_date).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-sm">
                        Member: <strong>{formatCurrency(ev.price_member)}</strong>
                      </span>
                      <span className="text-sm">
                        Guest: <strong>{formatCurrency(ev.price_non_member)}</strong>
                      </span>
                    </div>
                    <Link
                      to={`/events/${ev.id}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      View full details
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <p className="text-lg font-semibold text-slate-900">
              {upcoming.length === 0 ? 'No upcoming events right now' : 'No matching events'}
            </p>
            <p className="mt-2 text-slate-600">
              {upcoming.length === 0 ? 'Check back soon for workshops, AGMs, and social gatherings.' : 'Try a different search term.'}
            </p>
          </div>
        )}

        {!loading && !error && past.length > 0 && (
          <div className="mt-14">
            <h3 className="text-lg font-semibold text-slate-900">Past events</h3>
            <p className="mt-2 text-sm text-slate-600">Recent events you may have missed.</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.slice(0, 6).map((ev) => (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow"
                >
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">{ev.title}</p>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{ev.description}</p>
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    {new Date(ev.start_date).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

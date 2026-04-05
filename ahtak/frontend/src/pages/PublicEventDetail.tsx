import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { events as eventsApi, type Event } from '../lib/api';
import { setSeo } from '../lib/seo';

function formatCurrency(amount: string | number) {
  return `KES ${Number(amount).toLocaleString()}`;
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

function formatDateTime(value: unknown, opts: Intl.DateTimeFormatOptions): string | null {
  const d = safeDate(value);
  if (!d) return null;
  try {
    return d.toLocaleString(undefined, opts);
  } catch {
    return null;
  }
}

function getBannerUrl(banner: string | null | undefined): string | null {
  if (!banner) return null;
  if (banner.startsWith('http')) return banner;
  return banner.startsWith('/') ? banner : `/${banner}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  agm: 'AGM',
  training: 'Training',
  workshop: 'Workshop',
  seminar: 'Seminar',
  social: 'Social Event',
};

export default function PublicEventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [autoJoin, setAutoJoin] = useState(false);

  useEffect(() => {
    if (!id) return;
    eventsApi
      .get(Number(id))
      .then(setEvent)
      .catch((e) => setError(e?.message || 'Event not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!event || !id) return;
    const eventTitle = `${event.title} | AHTTAK Event`;
    const eventDesc = event.description
      ? String(event.description).replace(/\s+/g, ' ').slice(0, 160)
      : 'View this AHTTAK event and registration details.';
    setSeo({
      title: eventTitle,
      description: eventDesc,
      path: `/events/${id}`,
      image: getBannerUrl((event.banner as string | null) ?? null) || undefined,
    });
  }, [event, id]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Derived values must be computed before any early return to keep hook order stable.
  const bannerUrl = getBannerUrl((event?.banner as string | null) ?? null);
  const category = ((event as any)?.category as string) || '';
  const categoryLabel = CATEGORY_LABELS[category] || category || 'Event';
  const meetingLink = (event as any)?.meeting_link as string | undefined;
  const meetingPlatform = (event as any)?.meeting_platform as string | undefined;
  const start = useMemo(() => safeDate(event?.start_date), [event?.start_date]);
  const end = useMemo(() => safeDate((event as any)?.end_date), [event]);
  const isPastEvent = Boolean((end || start) && now > (end || start)!);
  const canJoin = Boolean(meetingLink) && Boolean(start) && now >= (start as Date);
  const secondsLeft = start ? Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000)) : 0;
  const countdown = () => {
    const s = secondsLeft;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${ss}s`;
    return `${ss}s`;
  };

  useEffect(() => {
    if (!autoJoin || !canJoin || !meetingLink) return;
    window.open(meetingLink, '_blank', 'noopener,noreferrer');
    setAutoJoin(false);
  }, [autoJoin, canJoin, meetingLink]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-slate-500">Loading event…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-lg bg-red-50 p-6 text-center text-red-700">
          {error || 'Event not found'}
        </div>
        <Link to="/events" className="mt-6 inline-block text-emerald-600 hover:text-emerald-700">
          ← Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-hidden bg-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <span aria-hidden>←</span> Back to events
          </Link>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
            <div className="aspect-video bg-slate-200">
              {bannerUrl ? (
                <img src={bannerUrl} alt={event.title ?? 'Event'} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
                  <span className="text-6xl font-bold text-slate-500">AHTTAK</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-100">
              {categoryLabel}
            </span>
            {meetingLink && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                Online meeting
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {event.title ?? 'Event'}
          </h1>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            {formatDateTime(event.start_date, { dateStyle: 'full', timeStyle: 'short' }) ? (
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {formatDateTime(event.start_date, { dateStyle: 'full', timeStyle: 'short' })}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1">Date/time TBA</span>
            )}
            {event.end_date && (
              <span className="rounded-full bg-slate-100 px-3 py-1">
                Ends {formatDateTime(event.end_date, { dateStyle: 'full', timeStyle: 'short' }) || 'TBA'}
              </span>
            )}
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">About this event</h2>
              <div className="mt-3 whitespace-pre-wrap text-slate-600">{event.description ?? ''}</div>

              {event.agenda && (
                <div className="mt-8 border-t border-slate-200 pt-8">
                  <h3 className="text-lg font-semibold text-slate-900">Agenda</h3>
                  <div className="mt-3 whitespace-pre-wrap text-slate-600">{event.agenda}</div>
                </div>
              )}

              {(event.location || event.address || event.city) && (
                <div className="mt-8 border-t border-slate-200 pt-8">
                  <h3 className="text-lg font-semibold text-slate-900">Venue</h3>
                  <div className="mt-3 space-y-1 text-slate-600">
                    {event.location && <p>{event.location}</p>}
                    {event.address && <p>{event.address}</p>}
                    {event.city && <p>{event.city}</p>}
                    {event.map_link && (
                      <a href={event.map_link} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                        View on map →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* How to register */}
            <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">How to register</h2>
              <ol className="mt-5 space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">1</span>
                  <span>
                    <strong>Sign in</strong> — Click Register. You’ll be asked to sign in (or create an account via Join Us first).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">2</span>
                  <span>
                    <strong>Choose</strong> — Select Member or Guest registration to apply the correct pricing.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">3</span>
                  <span>
                    <strong>Submit</strong> — Complete the form. Your ticket will be created and you can pay later if needed.
                  </span>
                </li>
              </ol>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              {/* Register / pricing */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Registration & pricing</h2>
                <p className="mt-2 text-sm text-slate-600">Members pay discounted rates; guests pay the standard rate.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Member</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(event.price_member)}</p>
                    <p className="mt-1 text-xs text-slate-500">Active members only</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Guest</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(event.price_non_member)}</p>
                    <p className="mt-1 text-xs text-slate-500">Non-members</p>
                  </div>
                </div>
                {isPastEvent ? (
                  <>
                    <span className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
                      Registration closed
                    </span>
                    <p className="mt-2 text-xs text-slate-500">This event has already ended.</p>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/events/${event.id}/register`}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Register for this event
                    </Link>
                    <p className="mt-2 text-xs text-slate-500">Guest registration is open. Members can still sign in for member-rate tracking.</p>
                  </>
                )}
                <Link
                  to="/event-pay"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Already have a guest ticket? Pay here
                </Link>
              </div>

              {/* Online meeting */}
              {meetingLink && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-900">Online meeting</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Platform: <span className="font-semibold">{meetingPlatform || 'Online'}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <a
                      href={canJoin ? meetingLink : undefined}
                      onClick={(e) => {
                        if (!canJoin) e.preventDefault();
                      }}
                      target="_blank"
                      rel="noreferrer"
                      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        canJoin ? 'bg-emerald-600 hover:bg-emerald-700' : 'cursor-not-allowed bg-slate-400'
                      }`}
                      aria-disabled={!canJoin}
                    >
                      {canJoin ? 'Join meeting' : `Join in ${countdown()}`}
                    </a>
                    <a href={meetingLink} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700 hover:underline">
                      Open link
                    </a>
                  </div>
                  {!canJoin && (
                    <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={autoJoin}
                        onChange={(e) => setAutoJoin(e.target.checked)}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      Auto-open at start time
                    </label>
                  )}
                  <p className="mt-3 text-xs text-slate-500">The Join button enables automatically when the start time is reached.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}

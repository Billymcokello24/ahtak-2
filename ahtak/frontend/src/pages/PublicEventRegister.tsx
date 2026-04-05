import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { events as eventsApi, type Event } from '../lib/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);

export default function PublicEventRegister() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const now = new Date();

  useEffect(() => {
    if (!id) return;
    eventsApi
      .get(Number(id))
      .then(setEvent)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load event'))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!guestName.trim()) return setError('Guest name is required');
    const cutoff = event?.end_date || event?.start_date;
    if (cutoff && new Date(cutoff) < new Date()) {
      setError('Registration is closed for this past event.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const reg = await eventsApi.registrations.create({
        event: Number(id),
        is_guest: true,
        member: null,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim(),
      });
      navigate(`/event-pay?ticket=${encodeURIComponent(reg.ticket_number)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register for event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-slate-500">Loading registration form…</div>;
  if (!event) return <div className="mx-auto max-w-4xl px-4 py-16 text-red-600">{error || 'Event not found'}</div>;
  const cutoff = event.end_date || event.start_date;
  const isPastEvent = cutoff ? new Date(cutoff) < now : false;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Guest registration</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{event.title}</h1>
          <p className="mt-2 text-sm text-slate-600">Non-members can register directly and receive a ticket instantly.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Guest price</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(Number(event.price_non_member || 0))}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Start</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(event.start_date).toLocaleString()}</p>
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm space-y-4">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {isPastEvent && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Registration is closed because this event has already ended.
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name *</label>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submitting || isPastEvent} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {submitting ? 'Registering…' : isPastEvent ? 'Registration closed' : 'Register as guest'}
            </button>
            <Link to={`/events/${event.id}`} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
              Back to event
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

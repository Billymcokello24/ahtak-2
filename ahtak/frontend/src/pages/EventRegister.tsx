import { useEffect, useState, type ComponentProps } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { events as eventsApi, members as membersApi, auth, type Event, type EventRegistration, type Member } from '../lib/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);

export default function EventRegister() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<EventRegistration>>({
    member: null,
    is_guest: false,
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    dietary_requirements: '',
    special_needs: '',
  });

  useEffect(() => {
    if (!eventId) return;

    Promise.all([
      eventsApi.get(Number(eventId)),
      membersApi.list(),
      auth.me().catch(() => null),
    ])
      .then(([eventResponse, memberResponse, user]) => {
        setEvent(eventResponse);
        const list = memberResponse.results || [];
        setMembers(list);
        if (user?.member_id) {
          setCurrentMemberId(user.member_id);
          setForm((f) => ({ ...f, member: user.member_id!, is_guest: false }));
        }
      })
      .catch((e) => setError(e.message || 'Unable to load event registration details.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    if (!eventId || !event) return;
    setSubmitting(true);
    setError('');
    const data: Partial<EventRegistration> = {
      event: Number(eventId),
      member: form.is_guest ? null : form.member || null,
      is_guest: form.is_guest || false,
      guest_name: form.is_guest ? form.guest_name : '',
      guest_email: form.is_guest ? form.guest_email : '',
      guest_phone: form.is_guest ? form.guest_phone : '',
      dietary_requirements: form.dietary_requirements || '',
      special_needs: form.special_needs || '',
    };
    eventsApi.registrations
      .create(data)
      .then((reg) => {
        navigate(`/dashboard/events/${eventId}/ticket/${reg.id}`, {
          state: {
            notice: `Registration successful. Ticket ${reg.ticket_number} was created for ${formatCurrency(Number(reg.amount_payable || 0))}.`,
          },
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  };

  if (!eventId) return <div className="text-red-600">Invalid event route.</div>;
  if (loading) return <div className="text-slate-500">Loading event registration form…</div>;
  if (error && !event) return <div className="text-red-600">{error}</div>;
  if (!event) return <div className="text-slate-500">Event details are not available for this registration link.</div>;
  const cutoff = event.end_date || event.start_date;
  const isPastEvent = cutoff ? new Date(cutoff) < new Date() : false;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/dashboard/events')} className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800">
        ← Back to events
      </button>

      {/* Workflow steps */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-emerald-600 px-3 py-1 font-medium text-white">Step 1: Signed in ✓</span>
        <span className="rounded-full bg-emerald-600 px-3 py-1 font-medium text-white">Step 2: Complete form below</span>
        <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-600">Step 3: Get your ticket</span>
      </div>

      <section className="rounded-[32px] border border-white/70 bg-white/85 px-6 py-7 shadow-xl shadow-slate-200/60 backdrop-blur sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">Event registration</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Register: {event.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{event.description}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Start date</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{new Date(event.start_date).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Member price</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{formatCurrency(Number(event.price_member || 0))}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Guest price</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{formatCurrency(Number(event.price_non_member || 0))}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-sm shadow-slate-200/70 backdrop-blur sm:p-7">
          <div className="space-y-5">
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {isPastEvent && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Registration is closed because this event has already ended.
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-800">Who are you registering?</p>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-200 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="registrant"
                  checked={!form.is_guest}
                  onChange={() => setForm({ ...form, is_guest: false, member: currentMemberId ?? form.member ?? null })}
                  className="h-4 w-4 border-slate-300 text-emerald-600"
                />
                <span>Member</span>
                <span className="text-slate-500">— Select member, pay member rate</span>
              </label>
              <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-200 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="registrant"
                  checked={form.is_guest || false}
                  onChange={() => setForm({ ...form, is_guest: true, member: null })}
                  className="h-4 w-4 border-slate-300 text-emerald-600"
                />
                <span>Guest</span>
                <span className="text-slate-500">— Non-member, pay guest rate</span>
              </label>
            </div>

            {form.is_guest ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Guest name *</label>
                  <input
                    type="text"
                    value={form.guest_name || ''}
                    onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={form.guest_email || ''}
                    onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={form.guest_phone || ''}
                    onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Select member *
                  {currentMemberId && <span className="ml-2 text-slate-500">(You are a member — select yourself or another)</span>}
                </label>
                <select
                  value={form.member || ''}
                  onChange={(e) => setForm({ ...form, member: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  required
                >
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_number} - {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Dietary requirements</label>
                <input
                  type="text"
                  value={form.dietary_requirements || ''}
                  onChange={(e) => setForm({ ...form, dietary_requirements: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Special needs</label>
                <input
                  type="text"
                  value={form.special_needs || ''}
                  onChange={(e) => setForm({ ...form, special_needs: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isPastEvent}
              className="inline-flex items-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Registering…' : isPastEvent ? 'Registration closed' : 'Submit registration → Get ticket'}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-sm shadow-slate-200/70 backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-900">Pricing preview</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Member registration</span>
                <span className="font-medium text-slate-900">{formatCurrency(Number(event.price_member || 0))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Guest registration</span>
                <span className="font-medium text-slate-900">{formatCurrency(Number(event.price_non_member || 0))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Status</span>
                <span className="font-medium capitalize text-slate-900">{event.status}</span>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-sm shadow-slate-200/70 backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-900">What happens next</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-slate-600">
              <li>You submit the form above.</li>
              <li>Your ticket is created immediately.</li>
              <li>You’ll see your ticket with payment details.</li>
              <li>Pay before or at the event as required.</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

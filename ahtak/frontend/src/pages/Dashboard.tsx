import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, dashboard, events, type KPIs, type CpdSummary } from '../lib/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [cpdSummary, setCpdSummary] = useState<CpdSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboard
      .kpis()
      .then(setKpis)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    auth
      .me()
      .then((u) => {
        if (!u.member_id) {
          setCpdSummary(null);
          return;
        }
        return events.registrations.myCpdSummary().then(setCpdSummary).catch(() => setCpdSummary(null));
      })
      .catch(() => setCpdSummary(null));
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!kpis) return <div className="text-slate-500">No dashboard data is available right now.</div>;

  const highlights = [
    {
      title: 'Collections this month',
      value: formatCurrency(kpis.payments.this_month),
      detail: `${formatCurrency(kpis.payments.today)} collected today`,
    },
    {
      title: 'Pending event payments',
      value: kpis.events.registrations_pending_payment,
      detail: 'Registrations still unpaid',
    },
    {
      title: 'Pending approvals',
      value: kpis.members.pending_approval,
      detail: 'Applications awaiting review',
    },
  ];

  const cards = [
    { title: 'Active members', value: kpis.members.active, note: 'Current approved members', tone: 'from-emerald-500/15 to-white' },
    { title: 'New this month', value: kpis.members.new_this_month, note: 'Recently added members', tone: 'from-blue-500/15 to-white' },
    { title: 'Expiring in 30 days', value: kpis.members.expiring_30_days, note: 'Renewals needing attention', tone: 'from-orange-500/15 to-white' },
    { title: 'Expiring in 60 days', value: kpis.members.expiring_60_days, note: 'Members to remind soon', tone: 'from-amber-500/15 to-white' },
    { title: 'Expiring in 90 days', value: kpis.members.expiring_90_days, note: 'Upcoming renewals pipeline', tone: 'from-yellow-500/15 to-white' },
    { title: 'Expired members', value: kpis.members.expired, note: 'Memberships already overdue', tone: 'from-rose-500/15 to-white' },
    { title: 'Upcoming events', value: kpis.events.upcoming, note: 'Published activities ahead', tone: 'from-violet-500/15 to-white' },
  ];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Operational overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Review member growth, renewals, collections, and event activity.
        </p>
      </section>

      {cpdSummary !== null && (cpdSummary.total_cpd_points > 0 || (cpdSummary.events?.length ?? 0) > 0) && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Your CPD Summary</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{cpdSummary.total_cpd_points} CPD points</p>
          <p className="mt-1 text-sm text-slate-600">
            From {cpdSummary.events?.length ?? 0} attended event(s)
          </p>
          {cpdSummary.events && cpdSummary.events.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {cpdSummary.events.slice(0, 5).map((ev, i) => (
                <li key={i}>{ev.event_title} – {ev.cpd_points} pts</li>
              ))}
            </ul>
          )}
          <Link
            to="/dashboard/events"
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline"
          >
            View events
          </Link>
        </section>
      )}

      {kpis.membership_fees && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100/80">
          <h2 className="text-lg font-semibold text-slate-900">Membership fee collections</h2>
          <p className="mt-1 text-sm text-slate-600">
            From recorded payments (registration / membership / renewal). Welfare is estimated from retention receipts using your published fee ratio.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Members paid</th>
                  <th className="py-3 pr-4">Receipts</th>
                  <th className="py-3">Total</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">Registration fee</td>
                  <td className="py-3 pr-4 tabular-nums">{kpis.membership_fees.registration_fee.members_paid_count}</td>
                  <td className="py-3 pr-4 tabular-nums">{kpis.membership_fees.registration_fee.receipts_count}</td>
                  <td className="py-3 tabular-nums font-medium">{formatCurrency(kpis.membership_fees.registration_fee.total_kes)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">Retention (membership + renewal)</td>
                  <td className="py-3 pr-4 tabular-nums">{kpis.membership_fees.retention_fee.members_paid_count}</td>
                  <td className="py-3 pr-4 tabular-nums">{kpis.membership_fees.retention_fee.receipts_count}</td>
                  <td className="py-3 tabular-nums font-medium">{formatCurrency(kpis.membership_fees.retention_fee.total_kes)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">Welfare (from retention, est.)</td>
                  <td className="py-3 pr-4 text-slate-500">—</td>
                  <td className="py-3 pr-4 text-slate-500">{kpis.membership_fees.retention_fee.receipts_count}</td>
                  <td className="py-3 tabular-nums font-medium">{formatCurrency(kpis.membership_fees.welfare_from_retention.estimated_total_kes)}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium">Student (all membership-related)</td>
                  <td className="py-3 pr-4 tabular-nums">{kpis.membership_fees.student_membership.members_paid_count}</td>
                  <td className="py-3 pr-4 tabular-nums">{kpis.membership_fees.student_membership.receipts_count}</td>
                  <td className="py-3 tabular-nums font-medium">{formatCurrency(kpis.membership_fees.student_membership.total_kes)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Reference amounts (public site): registration {formatCurrency(kpis.membership_fees.reference_fees_kes.registration)} · retention/year{' '}
            {formatCurrency(kpis.membership_fees.reference_fees_kes.retention_per_year)} · welfare share{' '}
            {formatCurrency(kpis.membership_fees.reference_fees_kes.welfare_allocation_per_retention)} · student{' '}
            {formatCurrency(kpis.membership_fees.reference_fees_kes.student_membership)}
          </p>
          <p className="mt-2 text-xs text-slate-400">{kpis.membership_fees.welfare_from_retention.note}</p>
          <p className="mt-3 text-xs text-slate-500">
            Edit public fees in Django Admin → Website → Membership page content. Record payments with the correct type so totals stay accurate.
          </p>
        </section>
      )}

      <section className="grid gap-5 sm:grid-cols-3">
        {highlights.map(({ title, value, detail }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100/80">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, note, tone }) => (
          <div
            key={title}
            className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${tone} p-6 shadow-sm`}
          >
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

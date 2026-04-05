import { useEffect, useState } from 'react';
import { contributions, type ContributionType } from '../lib/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);

export default function Contributions() {
  const [types, setTypes] = useState<ContributionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    contributions
      .types()
      .then(setTypes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const monthlyExpected = types.reduce((sum, type) => sum + Number(type.amount || 0), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-white/85 px-6 py-7 shadow-xl shadow-slate-200/60 backdrop-blur sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">Contributions</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Contribution products</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Keep monthly contribution products organized with clearer pricing, descriptions, and expected monthly totals.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Active contribution types', types.length],
          ['Expected monthly total', formatCurrency(monthlyExpected)],
          ['Average contribution', formatCurrency(types.length ? monthlyExpected / types.length : 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-200/60 backdrop-blur">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-sm shadow-slate-200/70 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50/90">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Code</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Name</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Description</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Amount</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {types.map((type) => (
                <tr key={type.id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-4 font-mono text-sm text-slate-700">{type.code}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{type.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{type.description || 'No description provided.'}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{formatCurrency(Number(type.amount || 0))}</td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ' +
                        (type.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700')
                      }
                    >
                      {type.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{new Date(type.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {types.length === 0 && (
          <div className="p-10 text-center text-slate-500">No contribution types exist yet. Add them through the Django admin to begin monthly contribution tracking.</div>
        )}
      </section>
    </div>
  );
}

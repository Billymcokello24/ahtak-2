import { useEffect, useState } from 'react';
import { savings, type SavingsAccount } from '../lib/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);

export default function Savings() {
  const [data, setData] = useState<{ results: SavingsAccount[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    savings
      .list()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading savings accounts…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const list = data?.results ?? [];
  const totalBalance = list.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const activeAccounts = list.filter((account) => account.is_active).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-white/85 px-6 py-7 shadow-xl shadow-slate-200/60 backdrop-blur sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">Savings</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Savings accounts portfolio</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Review savings products, active accounts, member references, and balances in a cleaner finance workspace.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Total accounts', list.length],
          ['Active accounts', activeAccounts],
          ['Portfolio balance', formatCurrency(totalBalance)],
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
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Account #</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Member #</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Product</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Balance</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Opened</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((account) => (
                <tr key={account.id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-4 font-mono text-sm text-slate-700">{account.account_number}</td>
                  <td className="px-5 py-4 text-slate-700">{account.member_number || `#${account.member}`}</td>
                  <td className="px-5 py-4 text-slate-700">{account.account_type_name}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{formatCurrency(Number(account.balance || 0))}</td>
                  <td className="px-5 py-4 text-slate-600">{new Date(account.opened_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ' +
                        (account.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700')
                      }
                    >
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            No savings accounts exist yet. Create accounts from the members workflow or the Django admin panel.
          </div>
        )}
      </section>
    </div>
  );
}

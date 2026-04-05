import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { members as membersApi, type Member } from '../lib/api';

function statusClass(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'expired':
      return 'bg-rose-100 text-rose-800';
    case 'pending_renewal':
      return 'bg-sky-100 text-sky-800';
    case 'suspended':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function Members() {
  const [data, setData] = useState<{ results: Member[]; count?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    membersApi
      .list(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  if (loading) return <div className="text-slate-500">Loading members…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const list = data?.results ?? [];
  const total = data?.count ?? list.length;
  const activeCount = list.filter((member) => member.status === 'active').length;
  const pendingCount = list.filter((member) => member.status === 'pending').length;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-[32px] border border-white/70 bg-white/85 px-6 py-7 shadow-xl shadow-slate-200/60 backdrop-blur sm:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">Members</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Membership registry</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Search, filter, approve, and review member records from a cleaner responsive list.
          </p>
        </div>
        <Link
          to="/dashboard/members/new"
          className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Add member
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Total results', total],
          ['Active in current view', activeCount],
          ['Pending approval', pendingCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-200/60 backdrop-blur">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-200/60 backdrop-blur sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Search members</label>
            <input
              type="search"
              placeholder="Search by name, number, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="pending_renewal">Pending renewal</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-sm shadow-slate-200/70 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50/90">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Member #</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Name</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Email</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Expiry</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((m) => (
                <tr key={m.id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-4 font-mono text-sm text-slate-700">{m.member_number}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{m.first_name} {m.last_name}</td>
                  <td className="px-5 py-4 text-slate-600">{m.email}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(m.status)}`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {m.membership_expiry ? new Date(m.membership_expiry).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      to={`/dashboard/members/${m.id}`}
                      className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && list.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            No members matched your current search and filter selection.
          </div>
        )}
      </section>
    </div>
  );
}

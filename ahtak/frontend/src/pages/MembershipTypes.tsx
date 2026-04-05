import { useEffect, useState } from 'react';
import { membershipTypes as api, type MembershipType } from '../lib/api';

export default function MembershipTypes() {
  const [list, setList] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Membership Types</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">Code</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">Annual fee (KES)</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">Registration fee (KES)</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">Validity (months)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono">{t.code}</td>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3">{Number(t.annual_fee).toLocaleString()}</td>
                <td className="px-4 py-3">{Number(t.registration_fee).toLocaleString()}</td>
                <td className="px-4 py-3">{t.validity_months}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="p-8 text-center text-slate-500">No membership types configured. Add them in Django admin.</div>
        )}
      </div>
    </div>
  );
}

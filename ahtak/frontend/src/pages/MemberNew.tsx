import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { members as membersApi, membershipTypes as typesApi, type Member, type MembershipType } from '../lib/api';

export default function MemberNew() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<Member>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    kvb_number: '',
    physical_address: '',
    postal_address: '',
    status: 'pending',
    membership_type: null,
    membership_expiry: null,
  });

  useEffect(() => {
    typesApi.list().then(setTypes).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const created = await membersApi.create(form);
      navigate(`/members/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Add member</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First name *</label>
            <input
              type="text"
              value={form.first_name ?? ''}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last name *</label>
            <input
              type="text"
              value={form.last_name ?? ''}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
          <input
            type="text"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">KVB number (optional)</label>
          <input
            type="text"
            value={String((form as any).kvb_number ?? '')}
            onChange={(e) => setForm({ ...form, kvb_number: e.target.value } as any)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Membership type</label>
          <select
            value={form.membership_type != null ? String(form.membership_type) : ''}
            onChange={(e) => setForm({ ...form, membership_type: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">— Select —</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save member'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/members')}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

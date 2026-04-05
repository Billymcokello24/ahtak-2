import { useState, useEffect, type ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { publicApi, membershipTypes, type MembershipType } from '../lib/api';

export default function MemberRegister() {
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    kvb_number: '',
    password: '',
    password_confirm: '',
    date_of_birth: '',
    gender: '',
    physical_address: '',
    membership_type: '' as string | number,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ member_number: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    membershipTypes.list().then(setTypes).catch(() => setTypes([]));
  }, []);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault();
    setError('');

    const kvb = form.kvb_number.trim();
    if (!kvb) {
      setError('KVB number is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        membership_type: form.membership_type ? Number(form.membership_type) : null,
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender || undefined,
        physical_address: form.physical_address || undefined,
        kvb_number: kvb,
      };
      if (form.password) payload.password = form.password;
      if (form.password_confirm) payload.password_confirm = form.password_confirm;
      const res = await publicApi.register(payload);
      setSuccess({ member_number: res.member_number });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
          <h2 className="text-xl font-semibold text-emerald-900">Application Submitted</h2>
          <p className="mt-4 text-emerald-800">
            Thank you for applying. Your reference number is{' '}
            <strong>{success.member_number}</strong>. We will review your application and
            email you once approved. You can then sign in with your email and password.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-emerald-600 hover:underline"
          >
            Go to Sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Join as a Member</h1>
      <p className="mt-2 text-slate-600">
        Complete the form below to apply for membership. We will review and notify you.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">First name *</label>
            <input
              type="text"
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Last name *</label>
            <input
              type="text"
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-4 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone *</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-4 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">KVB number *</label>
          <input
            type="text"
            required
            autoComplete="off"
            value={form.kvb_number}
            onChange={(e) => setForm({ ...form, kvb_number: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-4 py-2"
            placeholder="Kenya Veterinary Board registration number"
          />
          <p className="mt-1 text-xs text-slate-500">Your official KVB registration number is required to apply.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 pr-10"
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.password_confirm}
                onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date of birth</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2"
            >
              <option value="">—</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Physical address</label>
          <textarea
            rows={2}
            value={form.physical_address}
            onChange={(e) => setForm({ ...form, physical_address: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-4 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Membership type</label>
          <select
            value={form.membership_type}
            onChange={(e) => setForm({ ...form, membership_type: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-4 py-2"
          >
            <option value="">Select…</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

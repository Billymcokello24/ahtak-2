import { Link, useSearchParams } from 'react-router-dom';

export default function Pay() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const amount = params.get('amount') || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-white/80 bg-white p-8 shadow-xl shadow-slate-200/50 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Pay AHTTAK</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Make a payment</h1>
          {amount && (
            <p className="mt-4 text-xl font-semibold text-slate-700">
              KES {Number(amount).toLocaleString()}
            </p>
          )}
          {ref && (
            <p className="mt-1 text-sm text-slate-500">Reference: {ref}</p>
          )}
          <p className="mt-6 text-sm text-slate-600">
            Log in to your member account to pay with M-Pesa, or pay with cash at our office.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Log in to pay
            </Link>
            <Link
              to="/"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

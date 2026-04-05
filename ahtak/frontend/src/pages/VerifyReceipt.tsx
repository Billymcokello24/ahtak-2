import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = '/api';

interface VerifyResult {
  receipt_number: string;
  status: string;
  date: string | null;
  time: string | null;
  amount: string;
  currency: string;
  payment_type: string;
  method: string;
  event_title: string | null;
  member_number: string | null;
  member_name: string | null;
}

export default function VerifyReceipt() {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const [data, setData] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!receiptNumber) {
      setLoading(false);
      setError('Invalid receipt');
      return;
    }
    const n = receiptNumber.trim().toUpperCase();
    fetch(`${API_BASE}/payments/verify/${encodeURIComponent(n)}/`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Receipt not found' : 'Verification failed');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [receiptNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Verifying receipt…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-md">
          <p className="text-lg font-semibold text-red-800">Receipt verification failed</p>
          <p className="mt-2 text-slate-600">{error}</p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-white/80 bg-white p-8 shadow-xl shadow-slate-200/50">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Receipt verified
          </p>
          <h1 className="mt-2 text-center text-2xl font-bold text-slate-900">{data.receipt_number}</h1>
          <div
            className={`mt-4 inline-flex w-full justify-center rounded-xl px-4 py-2 text-sm font-bold ${
              data.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {data.status}
          </div>

          <div className="mt-8 space-y-4">
            <Row label="Date" value={data.date || '—'} />
            <Row label="Time" value={data.time || '—'} />
            <Row label="Amount" value={`${data.currency} ${data.amount}`} />
            <Row label="Payment Type" value={data.payment_type} />
            <Row label="Method" value={data.method} />
            <Row label="Event Title" value={data.event_title || '—'} />
            <Row label="Payer No" value={data.member_number || '—'} />
            <Row label="Payer Name" value={data.member_name || '—'} />
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            This receipt has been verified against AHTTAK records.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={`/api/payments/receipt/${encodeURIComponent(data.receipt_number)}/pdf/`}
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Download PDF
              </a>
              <Link to="/" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                ← Back to AHTTAK
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

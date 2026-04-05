import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { payments as paymentsApi, type Payment } from '../lib/api';

type Notice = { tone: 'success' | 'error'; message: string } | null;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);

export default function Payments() {
  const [data, setData] = useState<{ results: Payment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailing, setEmailing] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    paymentsApi
      .list()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleReceiptPdf = (p: Payment) => {
    paymentsApi.downloadReceipt(p.id);
  };

  const handleEmailReceipt = (p: Payment) => {
    setEmailing(p.id);
    paymentsApi
      .emailReceipt(p.id)
      .then((result) => setNotice({ tone: 'success', message: result.detail || 'Receipt emailed successfully.' }))
      .catch((e) => setNotice({ tone: 'error', message: e.message }))
      .finally(() => setEmailing(null));
  };

  if (loading) return <div className="text-slate-500">Loading payments…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const list = data?.results ?? [];
  const totalAmount = list.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Payments</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Receipts and collections
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Review recorded collections, download receipt PDFs, and send receipt emails.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        {[
          ['Recorded payments', list.length],
          ['Collection total', formatCurrency(totalAmount)],
          ['Email actions pending', emailing ? 1 : 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      {notice && (
        <div
          className={
            'flex items-start justify-between gap-4 rounded-xl border px-5 py-4 text-sm ' +
            (notice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700')
          }
        >
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-medium text-slate-600 hover:text-slate-900">
            Dismiss
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Receipt #</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Payer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Event Ticket</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Method</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/80">
                  <td className="px-6 py-4 font-mono text-sm text-slate-700">{p.receipt_number}</td>
                  <td className="px-6 py-4 text-slate-700">{p.member_number || (p.member ? `#${p.member}` : 'Guest')}</td>
                  <td className="px-6 py-4 text-slate-600">{String(p.payment_type).replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{p.event_ticket_number || '—'}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(Number(p.amount || 0))}</td>
                  <td className="px-6 py-4 capitalize text-slate-700">{p.method}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleReceiptPdf(p)}
                      className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      PDF
                    </button>
                    <Link
                      to={`/verify-receipt/${encodeURIComponent(p.receipt_number)}`}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      Verify
                    </Link>
                    <button
                      onClick={() => handleEmailReceipt(p)}
                      disabled={emailing === p.id}
                      className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {emailing === p.id ? 'Sending…' : 'Email'}
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <div className="p-10 text-center text-slate-500">No payments recorded yet.</div>
        )}
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { payments, publicApi } from '../lib/api';
import { membershipPaymentInfo } from '../lib/membershipFees';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);

type PaymentStatus = {
  registration_id: number;
  ticket_number: string;
  event_title: string;
  guest_name: string;
  guest_email: string;
  amount_payable: string;
  paid: boolean;
  receipt_number: string | null;
  payment_method: string | null;
};

export default function PublicEventPay() {
  const [params] = useSearchParams();
  const [ticketNumber, setTicketNumber] = useState((params.get('ticket') || '').toUpperCase());
  const [guestEmail, setGuestEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [paymentInfo, setPaymentInfo] = useState(() => membershipPaymentInfo(null));

  const normalizedTicket = useMemo(() => ticketNumber.trim().toUpperCase(), [ticketNumber]);

  const loadStatus = async (ticket = normalizedTicket) => {
    if (!ticket) return;
    setLoading(true);
    setError('');
    try {
      const res = await payments.publicEventPaymentStatus(ticket);
      setStatus(res);
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!normalizedTicket) return;
    void loadStatus(normalizedTicket);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    publicApi
      .membershipContent()
      .then((content) => setPaymentInfo(membershipPaymentInfo(content)))
      .catch(() => setPaymentInfo(membershipPaymentInfo(null)));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedTicket) {
      setError('Enter your ticket number.');
      return;
    }
    await loadStatus(normalizedTicket);
  };

  const onPayNow = async () => {
    if (!status) return;
    if (!transactionCode.trim()) {
      setError('Enter M-Pesa transaction code.');
      return;
    }
    setPaying(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ticket_number: status.ticket_number,
        transaction_code: transactionCode.trim().toUpperCase(),
        phone_number: phoneNumber.trim()
          ? (phoneNumber.trim().startsWith('0') ? phoneNumber.trim() : `0${phoneNumber.trim()}`)
          : undefined,
        guest_email: guestEmail.trim() || undefined,
      };
      const res = await payments.publicGuestPaybillConfirm(payload);
      setMessage(`${res.detail} Receipt: ${res.receipt_number}`);
      void loadStatus(status.ticket_number);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initiate payment');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Guest event payment</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Pay and get your receipt</h1>
          <p className="mt-2 text-sm text-slate-600">
            For non-member event attendees. Enter your ticket number to view status and complete payment via M-Pesa.
          </p>
          <form onSubmit={onSubmit} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              placeholder="Ticket number (e.g. TKT-00000012)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'Check status'}
            </button>
          </form>
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}

        {status && (
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Ticket" value={status.ticket_number} mono />
              <Info label="Event" value={status.event_title || 'Event'} />
              <Info label="Guest" value={status.guest_name || 'Guest attendee'} />
              <Info label="Amount" value={formatCurrency(Number(status.amount_payable || 0))} />
            </div>

            {!status.paid ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Pay via M-Pesa Paybill then confirm</p>
                <p className="mt-1 text-sm text-slate-600">
                  Pay to Paybill <strong>{paymentInfo.paybill}</strong>, Account <strong>{paymentInfo.accountFormat}</strong>, then enter the transaction code below to generate your receipt.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Guest email (optional)"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="07XXXXXXXX"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                  <input
                    type="text"
                    value={transactionCode}
                    onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
                    placeholder="M-Pesa transaction code (e.g. QWE123ABC)"
                    className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onPayNow}
                    disabled={paying}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {paying ? 'Confirming…' : 'I have paid, generate receipt'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadStatus(status.ticket_number)}
                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Refresh status
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-900">Payment confirmed</p>
                <p className="mt-1 text-sm text-emerald-800">Your event payment is complete.</p>
                {status.receipt_number && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-800">{status.receipt_number}</span>
                    <Link to={`/verify-receipt/${encodeURIComponent(status.receipt_number)}`} className="font-semibold text-emerald-700 hover:underline">
                      Verify receipt
                    </Link>
                    <a
                      href={`/api/payments/receipt/${encodeURIComponent(status.receipt_number)}/pdf/`}
                      className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
                    >
                      Download PDF
                    </a>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-1 text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

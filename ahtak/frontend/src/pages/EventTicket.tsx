import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, events, payments, publicApi } from '../lib/api';
import type { EventRegistration } from '../lib/api';
import { membershipPaymentInfo } from '../lib/membershipFees';

type TicketRouteState = { notice?: string };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);

export default function EventTicket() {
  const { regId } = useParams<{ regId: string }>();
  const location = useLocation();
  const [reg, setReg] = useState<EventRegistration | null>(null);
  const [error, setError] = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [receiptPaymentId, setReceiptPaymentId] = useState<number | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(() => membershipPaymentInfo(null));

  const fetchReg = useCallback(() => {
    if (!regId) return;
    api<EventRegistration>(`/registrations/${regId}/`).then(setReg).catch((e) => setError(e.message));
  }, [regId]);

  useEffect(() => {
    fetchReg();
  }, [fetchReg]);

  useEffect(() => {
    publicApi
      .membershipContent()
      .then((content) => setPaymentInfo(membershipPaymentInfo(content)))
      .catch(() => setPaymentInfo(membershipPaymentInfo(null)));
  }, []);

  useEffect(() => {
    if (!reg?.id || !reg.paid) return;
    payments
      .list({ event_registration: String(reg.id) })
      .then((res) => {
        const first = res.results?.[0];
        if (!first) return;
        setReceiptPaymentId(first.id);
        setReceiptNumber(String(first.receipt_number || ''));
      })
      .catch(() => {
        setReceiptPaymentId(null);
        setReceiptNumber('');
      });
  }, [reg?.id, reg?.paid]);

  if (!regId) return <div className="text-red-600">Invalid ticket route.</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!reg) return <div className="text-slate-500">Loading…</div>;

  // QR code: use ticket_number as data. For display we can use a simple text block or embed qrcode lib
  const qrData = reg.ticket_number || reg.qr_code;
  const notice = (location.state as TicketRouteState | null)?.notice;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {notice && <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">{notice}</div>}

      <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 text-center shadow-xl shadow-slate-200/60 backdrop-blur sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">Event ticket</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Registration confirmed</h1>
        <p className="mt-4 font-mono text-3xl font-bold text-emerald-600">{reg.ticket_number}</p>

        <div className="mt-6 rounded-[24px] bg-slate-100 p-5 font-mono text-sm text-slate-700 break-all">
          {qrData}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount payable</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(Number(reg.amount_payable || 0))}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payment status</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{reg.paid ? 'Paid' : 'Payment pending'}</p>
          </div>
        </div>

        {!reg.paid && Number(reg.amount_payable || 0) > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
            <p className="text-sm font-semibold text-slate-900">Pay now</p>
            {reg.member ? (
              <>
                <p className="mt-2 text-sm text-slate-600">
                  Pay via M-Pesa Paybill <strong>{paymentInfo.paybill}</strong>, Account <strong>{paymentInfo.accountFormat}</strong>, then enter your transaction code.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="M-Pesa code (e.g. QWE123ABC)"
                    value={transactionCode}
                    onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
                  />
                  <button
                    type="button"
                    disabled={mpesaLoading || transactionCode.trim().length < 5}
                    onClick={async () => {
                      setMpesaLoading(true);
                      setMpesaMessage('');
                      try {
                        const result = await payments.memberEventPaybillConfirm({
                          event_registration_id: reg.id,
                          transaction_code: transactionCode.trim().toUpperCase(),
                          phone_number: mpesaPhone.trim()
                            ? (mpesaPhone.startsWith('0') ? mpesaPhone : `0${mpesaPhone}`)
                            : undefined,
                        });
                        setMpesaMessage(`${result.detail} (${result.receipt_number})`);
                        fetchReg();
                      } catch (e) {
                        setMpesaMessage(e instanceof Error ? e.message : 'Failed to record payment');
                      } finally {
                        setMpesaLoading(false);
                      }
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {mpesaLoading ? 'Confirming…' : 'I have paid, generate receipt'}
                  </button>
                </div>
                {mpesaMessage && <p className="mt-2 text-sm text-slate-600">{mpesaMessage}</p>}
                <p className="mt-3 text-xs text-slate-500">Or pay with cash at the office. Staff will mark your ticket as paid.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Pay with cash at the office. Staff will record your payment and mark this ticket as paid.</p>
            )}
          </div>
        )}

        <p className="mt-6 text-sm text-slate-600">Present this ticket or the QR/ticket data block during event check-in.</p>

        {reg.paid && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
            <p className="text-sm font-semibold text-slate-900">Payment receipt</p>
            {receiptNumber ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">{receiptNumber}</span>
                <Link to={`/verify-receipt/${encodeURIComponent(receiptNumber)}`} className="font-medium text-emerald-700 hover:underline">
                  Verify
                </Link>
                {receiptPaymentId && (
                  <button
                    type="button"
                    onClick={() => payments.downloadReceipt(receiptPaymentId)}
                    className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
                  >
                    Download PDF
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-600">Payment is marked as paid. Receipt will appear once recorded.</p>
            )}
          </div>
        )}

        {reg.paid && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
            <p className="text-sm font-semibold text-slate-900">Attendance Certificate</p>
            <p className="mt-1 text-sm text-slate-600">
              After you attend the event and are checked in, you can download your CPD/attendance certificate here.
            </p>
            <div className="mt-3">
              <button
                type="button"
                disabled={certLoading}
                onClick={async () => {
                  setCertError('');
                  setCertLoading(true);
                  try {
                    await events.registrations.downloadCertificate(reg.id);
                  } catch (e) {
                    setCertError(e instanceof Error ? e.message : 'Failed to download certificate');
                  } finally {
                    setCertLoading(false);
                  }
                }}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {certLoading ? 'Downloading…' : 'Download Certificate'}
              </button>
              {certError && <p className="mt-2 text-sm text-red-600">{certError}</p>}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard/events" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Back to events
          </Link>
          <Link to="/dashboard/check-in" className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
            Open check-in
          </Link>
        </div>
      </div>
    </div>
  );
}

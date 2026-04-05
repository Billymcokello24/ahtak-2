import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi, membershipTypes, type MembershipPageContent, type MembershipType } from '../lib/api';
import { membershipFeeRows, membershipPaymentInfo } from '../lib/membershipFees';

function Icon({ name, className }: { name: 'fees' | 'mpesa' | 'steps' | 'shield'; className?: string }) {
  const cls = className ?? 'h-5 w-5';
  if (name === 'fees') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 7h12M6 12h12M6 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 4h14a2 2 0 0 1 2 2v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'mpesa') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'steps') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10 13l2 2 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 6h4M4 12h4M4 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Membership() {
  const [content, setContent] = useState<MembershipPageContent | null>(null);
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      publicApi.membershipContent().catch(() => null),
      membershipTypes.list().catch(() => []),
    ]).then(([c, t]) => {
      setContent(c);
      setTypes(t);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">
        Loading…
      </div>
    );
  }

  const intro = content?.intro_text?.trim() || '';
  const renewal = content?.renewal_info?.trim() || '';

  const fees = membershipFeeRows(content);
  const payment = membershipPaymentInfo(content);

  return (
    <div className="min-w-0 overflow-x-hidden bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
            <Icon name="shield" className="h-4 w-4" />
            Membership
          </div>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Join AHTTAK
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Registration fees, annual retention, and the official payment process.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Apply for Membership
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {intro && (
          <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="whitespace-pre-wrap text-slate-600">{intro}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Fees */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Icon name="fees" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Fees</h2>
                  <p className="mt-0.5 text-sm text-slate-600">Official membership charges.</p>
                </div>
              </div>

              <dl className="mt-6 space-y-4">
                {fees.map((f) => (
                  <div key={f.label} className="flex items-start justify-between gap-6 rounded-2xl bg-slate-50 px-4 py-3">
                    <dt className="text-sm font-semibold text-slate-700">{f.label}</dt>
                    <dd className="text-sm font-semibold text-slate-900">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Payment process */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Icon name="mpesa" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Payment process</h2>
                  <p className="mt-0.5 text-sm text-slate-600">Pay via M-Pesa Paybill.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paybill</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{payment.paybill}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account No.</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 break-words">{payment.accountFormat}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <Icon name="steps" className="h-5 w-5" />
                  </span>
                  <div className="text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">PROCESS</p>
                    <p className="mt-1">
                      M-Pesa Paybill <strong>{payment.paybill}</strong>, Account No. <strong>{payment.accountFormat}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {renewal && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-900">Renewal information</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{renewal}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Narrative sections */}
        <div className="mt-12 space-y-10">
          {content?.eligibility && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">Eligibility</h2>
              <p className="mt-3 whitespace-pre-wrap text-slate-600">{content.eligibility}</p>
            </section>
          )}
          {content?.requirements && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">Requirements</h2>
              <p className="mt-3 whitespace-pre-wrap text-slate-600">{content.requirements}</p>
            </section>
          )}
          {content?.benefits && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">Benefits</h2>
              <p className="mt-3 whitespace-pre-wrap text-slate-600">{content.benefits}</p>
            </section>
          )}
        </div>

        {types.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Membership categories</h2>
                <p className="mt-2 text-slate-600">Browse category pricing and validity.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {types.map((t) => (
                <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow">
                  <h3 className="text-lg font-semibold text-slate-900">{t.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{t.code}</p>
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">KES {Number(t.registration_fee || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Annual fee</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">KES {Number(t.annual_fee || 0).toLocaleString()}</p>
                      <p className="mt-1 text-xs text-slate-500">Valid for {t.validity_months} months</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

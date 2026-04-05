import { useEffect, useState, type ComponentProps } from 'react';
import { publicApi, type SiteSettings } from '../lib/api';

function Icon({
  name,
  className,
}: {
  name: 'pin' | 'phone' | 'mail' | 'clock' | 'alert' | 'message';
  className?: string;
}) {
  const cls = className ?? 'h-5 w-5';
  if (name === 'pin') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'phone') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6.5 3h3l1.5 5-2 1c1.6 3.3 4.4 6.1 7.7 7.7l1-2 5 1.5v3c0 .8-.6 1.5-1.4 1.6-8.9 1-16.1-6.2-15.1-15.1C5 3.6 5.7 3 6.5 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'mail') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 6h16v12H4V6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m4 7 8 6 8-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'clock') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 6v6l4 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'alert') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M10.3 3.3 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H6l-3 3v-6.5A8.5 8.5 0 1 1 21 11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Contact() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    publicApi.settings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const officeAddress = settings?.address?.trim() || '';
  const officeEmail = settings?.email?.trim() || '';
  const officePhone = settings?.phone_numbers?.trim() || '';
  const openingHours = settings?.opening_hours?.trim() || '';
  const emergency = settings?.emergency_number?.trim() || '';

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await publicApi.contact(form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-10 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow">
            <Icon name="message" className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-emerald-900 sm:text-3xl">
            Message received
          </h1>
          <p className="mt-3 text-emerald-900/80">
            Thank you! Your message has been sent. We will get back to you soon.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-hidden bg-slate-50">
      {/* Hero / intro */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                <Icon name="message" className="h-4 w-4" />
                Contact
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Get in touch
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Have a question, feedback, or need support? Send us a message and we’ll respond as soon as possible.
              </p>
            </div>
            {(officeEmail || officePhone) && (
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                {officeEmail && (
                  <a href={`mailto:${officeEmail}`} className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:underline">
                    <Icon name="mail" className="h-4 w-4" />
                    {officeEmail}
                  </a>
                )}
                {officePhone && (
                  <a href={`tel:${officePhone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-semibold text-slate-700 hover:underline">
                    <Icon name="phone" className="h-4 w-4" />
                    {officePhone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Info cards (like reference) */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-900 px-6 py-4 text-center">
              <h2 className="text-sm font-semibold tracking-wide text-white">AHTTAK Head Office</h2>
            </div>
            <div className="space-y-5 px-6 py-6">
              {officeAddress && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <Icon name="pin" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Address</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{officeAddress}</p>
                  </div>
                </div>
              )}
              {officePhone && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <Icon name="phone" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Call us</p>
                    <a
                      href={`tel:${officePhone.replace(/\s/g, '')}`}
                      className="mt-1 inline-block text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      {officePhone}
                    </a>
                  </div>
                </div>
              )}
              {officeEmail && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <Icon name="mail" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email</p>
                    <a
                      href={`mailto:${officeEmail}`}
                      className="mt-1 inline-block text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      {officeEmail}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-900 px-6 py-4 text-center">
              <h2 className="text-sm font-semibold tracking-wide text-white">Customer Support</h2>
            </div>
            <div className="space-y-5 px-6 py-6">
              {openingHours && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <Icon name="clock" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Opening hours</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{openingHours}</p>
                  </div>
                </div>
              )}
              {officeEmail && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <Icon name="mail" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email support</p>
                    <a
                      href={`mailto:${officeEmail}`}
                      className="mt-1 inline-block text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      {officeEmail}
                    </a>
                  </div>
                </div>
              )}
              {officePhone && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <Icon name="phone" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Phone</p>
                    <a
                      href={`tel:${officePhone.replace(/\s/g, '')}`}
                      className="mt-1 inline-block text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      {officePhone}
                    </a>
                  </div>
                </div>
              )}
              {!openingHours && !officeEmail && !officePhone && (
                <p className="text-sm text-slate-600">
                  Add support contact details in Django Admin → Website → Site Settings.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-900 px-6 py-4 text-center">
              <h2 className="text-sm font-semibold tracking-wide text-white">Complaints & Reporting</h2>
            </div>
            <div className="space-y-5 px-6 py-6">
              {emergency && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <Icon name="alert" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Hotline</p>
                    <a
                      href={`tel:${emergency.replace(/\s/g, '')}`}
                      className="mt-1 inline-block text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      {emergency}
                    </a>
                  </div>
                </div>
              )}
              {officeEmail && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <Icon name="mail" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email</p>
                    <a
                      href={`mailto:${officeEmail}`}
                      className="mt-1 inline-block text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      {officeEmail}
                    </a>
                  </div>
                </div>
              )}
              {!emergency && !officeEmail && (
                <p className="text-sm text-slate-600">
                  Add a hotline or reporting email in Django Admin → Website → Site Settings.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form + optional map */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Send us a message</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Fill the form below and we’ll respond through the contact details you provide.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Your name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Your email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      placeholder="+254..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Subject *</label>
                    <input
                      type="text"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      placeholder="How can we help?"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Message *</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Write your message here…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-60 sm:w-auto"
                >
                  {loading ? 'Sending…' : 'Send message'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5">
            {settings?.google_map_embed ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">Find us</h3>
                  <p className="mt-1 text-sm text-slate-600">Our location on the map.</p>
                </div>
                <div className="[&>iframe]:h-[420px] [&>iframe]:w-full" dangerouslySetInnerHTML={{ __html: settings.google_map_embed }} />
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Follow us</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Social links can be configured in Django Admin → Website → Site Settings.
                </p>
                {settings?.social_links && Object.keys(settings.social_links).some((k) => settings.social_links[k]) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {Object.entries(settings.social_links).map(([name, url]) =>
                      url ? (
                        <a
                          key={name}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          {name}
                        </a>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

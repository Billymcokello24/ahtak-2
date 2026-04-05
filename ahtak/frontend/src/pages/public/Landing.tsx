import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Welcome to AHTTAK
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Your trusted membership and organization management partner. Join us for savings, events, and a community that supports your goals.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-600"
            >
              Join as Member
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800">Why AHTTAK?</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Savings and benefits', desc: 'Competitive savings products and member benefits.' },
              { title: 'Events and Networking', desc: 'AGMs, trainings, workshops, and social events.' },
              { title: 'Transparent Operations', desc: 'Clear reporting, receipts, and member portal access.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800">Ready to join?</h2>
          <p className="mt-3 text-slate-600">Create an account and submit your membership application.</p>
          <Link
            to="/register"
            className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
          >
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}

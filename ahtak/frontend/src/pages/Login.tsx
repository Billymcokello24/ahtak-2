import { useEffect, useState, type ComponentProps } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setSeo } from '../lib/seo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
  const isFromEventRegistration = from.includes('/events/') && from.includes('/register');

  useEffect(() => {
    setSeo({
      title: 'Sign In | AHTTAK',
      description: 'Member and admin sign in.',
      path: '/login',
      noindex: true,
    });
  }, []);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.32),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.28),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.45em] text-emerald-300">AHTTAK</p>
              <h1 className="mt-6 max-w-lg text-5xl font-semibold leading-tight tracking-tight">
                Professional membership and organization operations in one workspace.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-300">
                Manage members, approvals, payments, savings, events, and reports from a cleaner, faster dashboard.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {[
                ['Responsive workspace', 'Optimized layout for desktop, tablet, and mobile navigation.'],
                ['Operational visibility', 'Quick access to KPIs, collections, portfolios, and approvals.'],
                ['Audit-friendly flows', 'Structured records for members, receipts, tickets, and exports.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                  <h2 className="text-sm font-semibold text-white">{title}</h2>
                  <p className="mt-2 text-sm text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10 xl:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300 lg:hidden">AHTTAK</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {isFromEventRegistration ? 'Sign in to register' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {isFromEventRegistration
                  ? 'You must sign in before you can register for an event. Members get discounted rates; guests pay the standard rate.'
                  : 'Sign in to continue to the operations dashboard.'}
              </p>
              {isFromEventRegistration && (
                <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
                  <strong>Not a member yet?</strong> Join first at <Link to="/register" className="underline">Join Us</Link>, get your application approved, then sign in here to register at member rates.
                </p>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[28px] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-2xl shadow-black/25 backdrop-blur sm:p-8"
            >
              <div className="space-y-5">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email or username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    required
                    autoComplete="username"
                    placeholder="Enter your email or username"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-xs text-slate-500 lg:text-left">
              Members: use your email and password. Staff: use your username and password.
            </p>
            {isFromEventRegistration && (
              <p className="mt-3 text-center text-sm text-slate-400 lg:text-left">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium text-emerald-400 hover:text-emerald-300">
                  Join as a member
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

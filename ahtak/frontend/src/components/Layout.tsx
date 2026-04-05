import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, publicApi, type SiteSettings } from '../lib/api';
import type { CurrentUser } from '../lib/api';
import { setSeo } from '../lib/seo';

const navAll = [
  { to: '/dashboard', label: 'Dashboard', hint: 'KPIs and activity', roles: ['super_admin', 'admin', 'loan_officer', 'member'] },
  { to: '/dashboard/members', label: 'Members', hint: 'Registry and approvals', roles: ['super_admin', 'admin', 'loan_officer'] },
  { to: '/dashboard/membership-types', label: 'Membership Types', hint: 'Products and fees', roles: ['super_admin', 'admin', 'loan_officer'] },
  { to: '/dashboard/events', label: 'Events', hint: 'Registrations and tickets', roles: ['super_admin', 'admin', 'loan_officer', 'member'] },
  { to: '/dashboard/check-in', label: 'Check-in', hint: 'Entrance validation', roles: ['super_admin', 'admin'] },
  { to: '/dashboard/payments', label: 'Payments', hint: 'Receipts and collections', roles: ['super_admin', 'admin', 'loan_officer'] },
  { to: '/dashboard/savings', label: 'Savings', hint: 'Accounts and balances', roles: ['super_admin', 'admin', 'loan_officer', 'member'] },
  { to: '/dashboard/contributions', label: 'Contributions', hint: 'Monthly contribution types', roles: ['super_admin', 'admin', 'loan_officer', 'member'] },
  { to: '/dashboard/reports', label: 'Reports', hint: 'Exports and summaries', roles: ['super_admin', 'admin', 'loan_officer'] },
];

export default function Layout() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    publicApi.settings().then(setSite).catch(() => setSite(null));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setSeo({
      title: 'AHTTAK Member Dashboard',
      description: 'Secure member operations dashboard.',
      path: location.pathname,
      noindex: true,
    });
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to: string) =>
    to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname === to || location.pathname.startsWith(`${to}/`);

  const role = user?.role || 'admin';
  const nav = navAll.filter((n) => n.roles.includes(role));

  const brand = useMemo(() => {
    const name = site?.site_name || 'AHTTAK';
    const logo = site?.logo || '/static/ahtklogo.png';
    return { name, logo };
  }, [site]);

  const mediaUrl = (path: string | null): string => {
    if (!path) return '';
    return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
  };

  const renderNav = () => (
    <nav className="space-y-1">
      {user?.member_id && (
        <Link
          to={`/dashboard/members/${user.member_id}`}
          className={
            'group flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors ' +
            (location.pathname === `/dashboard/members/${user.member_id}`
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
          }
        >
          <p className="text-sm font-medium">My account</p>
        </Link>
      )}
      {nav.map(({ to, label, hint }) => (
        <Link
          key={to}
          to={to}
          className={
            'group flex flex-col gap-0.5 rounded-xl px-4 py-2.5 transition-colors ' +
            (isActive(to)
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
          }
        >
          <p className="text-sm font-medium">{label}</p>
          <p className={isActive(to) ? 'text-xs text-white/70' : 'text-xs text-slate-500 group-hover:text-slate-600'}>{hint}</p>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-2.5 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-3">
          {brand.logo ? (
            <img src={mediaUrl(brand.logo)} alt={brand.name} className="h-9 w-auto" />
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">AHTTAK</p>
              <h1 className="text-sm font-semibold text-slate-900">Membership System</h1>
            </div>
          )}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
            {(user?.username || 'U').slice(0, 1).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:inline">{user?.username || '—'}</span>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" d={mobileOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
            </svg>
            Menu
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          role="button"
          tabIndex={0}
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
          aria-label="Close menu"
        >
          <aside
            className="flex h-full w-[88vw] max-w-sm flex-col border-r border-slate-200 bg-white px-4 pb-4 pt-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Link to="/dashboard" className="mb-4 flex items-center gap-3">
              {brand.logo ? (
                <img src={mediaUrl(brand.logo)} alt={brand.name} className="h-10 w-auto" />
              ) : (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">AHTTAK</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">Membership System</h2>
                </div>
              )}
            </Link>
            <div className="flex-1 overflow-auto pb-3">{renderNav()}</div>
            <button
              onClick={handleLogout}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Log out
            </button>
          </aside>
        </div>
      )}

      <div className="lg:flex">
        <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-100 px-5 py-5">
            <Link to="/dashboard" className="flex items-center gap-3">
              {brand.logo ? (
                <img src={mediaUrl(brand.logo)} alt={brand.name} className="h-11 w-auto" />
              ) : (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">AHTTAK</p>
                  <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Membership System</h1>
                </div>
              )}
            </Link>
          </div>

          <div className="flex-1 overflow-auto px-3 py-4">{renderNav()}</div>

          <div className="border-t border-slate-100 p-3">
            <button
              onClick={handleLogout}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto bg-slate-50/50">
          <header className="sticky top-0 z-20 flex items-center justify-end border-b border-slate-200/80 bg-white/95 backdrop-blur-sm px-6 py-2.5 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-800">{user?.username || 'Loading…'}</p>
                <p className="text-xs text-slate-400">{user?.email || '—'}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                {(user?.username || 'U').slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:inline">
                {user?.role || 'admin'}
              </span>
              <div className="h-4 w-px bg-slate-200" />
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                Sign out
              </button>
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

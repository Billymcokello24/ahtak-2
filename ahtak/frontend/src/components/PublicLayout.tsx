import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { publicApi, type NoticeItem, type SeoPage, type SiteSettings } from '../lib/api';
import { setSeo, seoDefaults } from '../lib/seo';

const BRAND_GREEN = '#166534';
const BRAND_GREEN_DARK = '#14532d';
const NOTICE_RED = '#dc2626';

function mediaUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
}

export default function PublicLayout() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [seoByPage, setSeoByPage] = useState<Record<string, SeoPage | null>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    publicApi.settings().then(setSettings).catch(() => setSettings(null));
  }, []);

  useEffect(() => {
    const path = location.pathname || '/';
    const pageName = path === '/' ? 'home' : path.replace(/^\/+/, '').replaceAll('/', '_');
    if (Object.prototype.hasOwnProperty.call(seoByPage, pageName)) {
      const cached = seoByPage[pageName];
      if (cached) {
        setSeo({
          title: cached.meta_title || `${seoDefaults.title}`,
          description: cached.meta_description || seoDefaults.description,
          keywords: cached.keywords || undefined,
          path,
          image: cached.og_image || undefined,
        });
      } else {
        setSeo({ path });
      }
      return;
    }
    publicApi
      .seoPage(pageName)
      .then((row) => {
        setSeoByPage((prev) => ({ ...prev, [pageName]: row }));
      setSeo({
          title: row.meta_title || seoDefaults.title,
          description: row.meta_description || seoDefaults.description,
          keywords: row.keywords || undefined,
        path,
          image: row.og_image || undefined,
      });
      })
      .catch(() => {
        setSeoByPage((prev) => ({ ...prev, [pageName]: null }));
        setSeo({ path });
      });
  }, [location.pathname, seoByPage]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const defaultNav = [
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about' },
    { label: 'Membership', url: '/membership' },
    { label: 'CPD', url: '/cpd' },
    { label: 'Events', url: '/events' },
    { label: 'Resources', url: '/resources' },
    { label: 'Downloads', url: '/downloads' },
    { label: 'Jobs', url: '/jobs' },
    { label: 'Projects', url: '/projects' },
    { label: 'Gallery', url: '/gallery' },
    { label: 'News', url: '/blog' },
    { label: 'Contact', url: '/contact' },
    { label: 'Join Us', url: '/register' },
  ];
  const nav = (settings?.nav_links?.length ? settings.nav_links : defaultNav) as { label: string; url: string }[];
  const footerNav = (settings?.footer_links?.length ? settings.footer_links : nav) as { label: string; url: string }[];
  const footerSections = settings?.footer_sections ?? [];
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  const announcementsRaw = settings?.announcements ?? [];
  const announcements: NoticeItem[] = useMemo(() => {
    return announcementsRaw
      .map((a) => {
        if (typeof a === 'string') return { text: a } as NoticeItem;
        if (a && typeof a === 'object' && 'text' in a) return a as NoticeItem;
        return null;
      })
      .filter(Boolean) as NoticeItem[];
  }, [announcementsRaw]);
  const hasAnnouncements = announcements.length > 0;

  const isExternal = (url: string) => url.startsWith('http://') || url.startsWith('https://');
  const NavLinkItem = ({ item, className }: { item: { label: string; url: string }; className?: string }) =>
    isExternal(item.url) ? (
      <a href={item.url} target="_blank" rel="noreferrer" className={className}>
        {item.label}
      </a>
    ) : (
      <Link to={item.url} className={className}>
        {item.label}
      </Link>
    );

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    return location.pathname.startsWith(url);
  };

  const siteName = settings?.site_name || 'Animal Health Technicians and Technologists Association (AHTTAK)';
  const tagline = settings?.tagline || 'Upholding Professional Standards';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 focus:shadow"
      >
        Skip to main content
      </a>
      {/* Top bar - slim green with tagline */}
      <div
        className="hidden md:block text-white text-sm py-1.5"
        style={{ backgroundColor: BRAND_GREEN_DARK }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="font-medium">AHTTAK – {tagline}</span>
          <div className="flex items-center gap-4">
            <Link to="/register" className="hover:underline">Join Us</Link>
            <Link to="/login" className="hover:underline">Member Portal</Link>
          </div>
        </div>
      </div>

      {/* Notice Board - running message */}
      {hasAnnouncements && (
        <div className="flex items-stretch overflow-hidden border-b border-slate-200 bg-white">
          <div
            className="flex shrink-0 items-center px-4 py-2 font-bold text-white"
            style={{ backgroundColor: NOTICE_RED, minWidth: 140 }}
          >
            Notice Board
          </div>
          <div className="flex-1 overflow-hidden bg-slate-50 py-2">
            <div
              className={`marquee-viewport ${reducedMotion ? 'marquee-stop' : ''}`}
              role="region"
              aria-label="Announcements"
            >
              <div className="marquee-track">
                {[...announcements, ...announcements].map((n, idx) => {
                  const href = n.file ? mediaUrl(n.file) : n.url || '';
                  const clickable = Boolean(href);
                  const isExt = href ? isExternal(href) : false;
                  const content = (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-slate-800 font-medium">{n.text}</span>
                      {clickable && (
                        <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                          Open
                        </span>
                      )}
                    </span>
                  );
                  return (
                    <span key={`${idx}-${n.text}`} className="marquee-item">
                      {clickable ? (
                        isExt ? (
                          <a href={href} target="_blank" rel="noreferrer" className="hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-600">
                            {content}
                          </a>
                        ) : (
                          <Link to={href} className="hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-600">
                            {content}
                          </Link>
                        )
                      ) : (
                        content
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          {settings?.social_links && Object.keys(settings.social_links).length > 0 && (
            <div className="hidden lg:flex shrink-0 items-center gap-2 px-4">
              {Object.entries(settings.social_links).map(([name, url]) =>
                url ? (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                    aria-label={name}
                  >
                    {name === 'facebook' && (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    )}
                    {name === 'twitter' && (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    )}
                    {name === 'linkedin' && (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    )}
                    {!['facebook', 'twitter', 'linkedin'].includes(name) && (
                      <span className="text-xs capitalize">{name}</span>
                    )}
                  </a>
                ) : null
              )}
            </div>
          )}
        </div>
      )}

      {/* Main header - logo + contact */}
      <header
        className="border-b border-slate-200 bg-white"
        style={{ borderTopColor: hasAnnouncements ? 'transparent' : undefined }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            {settings?.logo ? (
              <img src={mediaUrl(settings.logo)} alt={siteName} className="h-14 w-auto" />
            ) : (
              <img src="/static/ahtklogo.png" alt={siteName} className="h-14 w-auto" />
            )}
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
            {settings?.email && (
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-slate-900">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {settings.email}
              </a>
            )}
            {settings?.phone_numbers && (
              <a href={`tel:${settings.phone_numbers.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-slate-900">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {settings.phone_numbers}
              </a>
            )}
          </div>
        </div>

        {/* Primary navigation */}
        <div
          className="text-white"
          style={{ backgroundColor: BRAND_GREEN }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <NavLinkItem
                  key={`${item.url}-${item.label}`}
                  item={item}
                  className={`px-4 py-3 text-sm font-medium transition ${
                    isActive(item.url)
                      ? 'bg-emerald-800/80'
                      : 'hover:bg-emerald-700/80'
                  }`}
                />
              ))}
              {!nav.some((i) => i.url === '/login' || i.label.toLowerCase() === 'sign in') && (
                <Link
                  to="/login"
                  className="ml-2 rounded bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"
                >
                  Sign In
                </Link>
              )}
            </nav>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-3 text-white hover:bg-emerald-700/80 md:hidden"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-emerald-600 md:hidden">
              <nav className="flex flex-col py-2">
                {nav.map((item) => (
                  <NavLinkItem
                    key={`${item.url}-${item.label}`}
                    item={item}
                    className={`px-6 py-3 text-sm font-medium ${
                      isActive(item.url) ? 'bg-emerald-800/80' : 'hover:bg-emerald-700/80'
                    }`}
                  />
                ))}
                {!nav.some((i) => i.url === '/login') && (
                  <Link to="/login" className="mx-4 mt-2 rounded bg-white/20 px-4 py-3 text-center">
                    Sign In
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main id="main-content">
        <Outlet />
      </main>

      {/* Footer - professional multi-column */}
      <footer
        className="mt-20 text-white"
        style={{ backgroundColor: BRAND_GREEN_DARK }}
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Column 1 - Logo & contact */}
            <div>
              <Link to="/" className="inline-block">
                {settings?.logo ? (
                  <img src={mediaUrl(settings.logo)} alt={siteName} className="h-12 w-auto opacity-95" />
                ) : (
                  <span className="text-lg font-bold">AHTTAK</span>
                )}
              </Link>
              {tagline && <p className="mt-2 text-sm text-emerald-200">{tagline}</p>}
              {settings?.phone_numbers && (
                <p className="mt-4 flex items-start gap-2 text-sm text-emerald-100">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {settings.phone_numbers}
                </p>
              )}
              {settings?.address && (
                <p className="mt-2 flex items-start gap-2 text-sm text-emerald-100">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {settings.address}
                </p>
              )}
              {settings?.email && (
                <p className="mt-2 flex items-start gap-2 text-sm text-emerald-100">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <a href={`mailto:${settings.email}`} className="hover:underline">{settings.email}</a>
                </p>
              )}
            </div>

            {/* Footer sections from backend */}
            {footerSections.length > 0 ? (
              footerSections.map((section, i) => (
                <div key={i}>
                  <h4 className="font-semibold text-white">{section.title}</h4>
                  <ul className="mt-4 space-y-2">
                    {(section.links ?? []).map((link: { label: string; url: string }, j: number) => (
                      <li key={j}>
                        {isExternal(link.url) ? (
                          <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-emerald-100 hover:underline">
                            {link.label}
                          </a>
                        ) : (
                          <Link to={link.url} className="text-sm text-emerald-100 hover:underline">
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <>
                <div>
                  <h4 className="font-semibold text-white">Quick Links</h4>
                  <ul className="mt-4 space-y-2">
                    {footerNav.slice(0, 6).map((item) => (
                      <li key={`${item.url}-${item.label}`}>
                        <NavLinkItem item={item} className="text-sm text-emerald-100 hover:underline" />
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Support</h4>
                  <ul className="mt-4 space-y-2">
                    <li><Link to="/contact" className="text-sm text-emerald-100 hover:underline">Contact Us</Link></li>
                    <li><Link to="/register" className="text-sm text-emerald-100 hover:underline">Join Us</Link></li>
                    <li><Link to="/login" className="text-sm text-emerald-100 hover:underline">Member Portal</Link></li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-emerald-800/50 pt-8 sm:flex-row">
            <p className="text-center text-sm text-emerald-200 sm:text-left">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
            {settings?.social_links && Object.keys(settings.social_links).filter((k) => settings.social_links[k]).length > 0 && (
              <div className="flex gap-3">
                {Object.entries(settings.social_links).map(([name, url]) =>
                  url ? (
                    <a key={name} href={url} target="_blank" rel="noreferrer" className="rounded p-2 text-emerald-200 hover:bg-emerald-800/50 hover:text-white" aria-label={name}>
                      {name === 'facebook' && <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                      {name === 'twitter' && <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
                      {name === 'linkedin' && <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>}
                      {!['facebook', 'twitter', 'linkedin'].includes(name) && <span className="text-xs capitalize">{name}</span>}
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scroll to top */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 rounded-lg bg-slate-700 p-2 text-white shadow-lg transition hover:bg-slate-600"
          aria-label="Scroll to top"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      </footer>

      <style>{`
        .marquee-viewport { overflow: hidden; width: 100%; }
        .marquee-track {
          display: inline-flex;
          align-items: center;
          gap: 2.5rem;
          padding-left: 1rem;
          width: max-content;
          animation: marquee 28s linear infinite;
          will-change: transform;
        }
        .marquee-item { white-space: nowrap; }
        .marquee-stop .marquee-track { animation: none; }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

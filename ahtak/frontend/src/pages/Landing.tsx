import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { events as eventsApi, publicApi, type BlogPost, type Event, type HeroSlide, type HomePageContent, type MembershipPageContent, type NoticeItem, type SiteSettings } from '../lib/api';
import { membershipFeeRows, membershipPaymentInfo } from '../lib/membershipFees';

function mediaUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
}

/** Turn admin copy into separate blocks (blank line = new paragraph). */
function splitIntoParagraphs(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const parts = t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [t];
}

/** Shown in the hero eyebrow — always the spelled-out name. */
const HERO_ORG_FULL_NAME =
  'Animal Health Technicians and Technologists Association (AHTTAK)';

const PUBLIC_FALLBACK_HERO_SLIDES: HeroSlide[] = Array.from({ length: 9 }, (_, i) => ({
  id: 10000 + i,
  image: `/ahttak${i + 1}.jpeg`,
  title: HERO_ORG_FULL_NAME,
  link_url: '/gallery',
  link_label: 'View gallery',
}));

/** Drop copy that shouldn’t appear in the public hero (e.g. legacy CMS text). */
function sanitizeHeroCopy(s: string | undefined): string {
  const t = s?.trim() ?? '';
  if (!t) return '';
  if (/membership\s*system/i.test(t)) return '';
  return t;
}

export default function Landing() {
  const [content, setContent] = useState<HomePageContent | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [cpdHighlights, setCpdHighlights] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<NoticeItem[]>([]);
  const [membershipPage, setMembershipPage] = useState<MembershipPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const slideTimer = useRef<number | null>(null);

  useEffect(() => {
    Promise.all([
      publicApi.homeContent().catch(() => null),
      publicApi.settings().catch(() => null),
      publicApi.heroSlides().catch(() => []),
      publicApi.blogPosts().catch(() => []),
      eventsApi.list({ status: 'published' }).catch(() => ({ results: [] as Event[] })),
      eventsApi.cpdList({ status: 'published' }).catch(() => ({ results: [] as Event[] })),
      publicApi.membershipContent().catch(() => null),
    ])
      .then(([c, s, slides, postsRaw, eventsRaw, cpdRaw, mem]) => {
        setContent(c);
        setSettings(s);
        setMembershipPage(mem);
        setHeroSlides(Array.isArray(slides) ? slides : (slides as { results?: HeroSlide[] }).results ?? []);

        const raw = (s?.announcements ?? []) as Array<string | NoticeItem>;
        const normalized: NoticeItem[] = raw
          .map((a) => (typeof a === 'string' ? ({ text: a } as NoticeItem) : a))
          .filter((a) => a && typeof a.text === 'string' && a.text.trim().length > 0);
        setAnnouncements(normalized.slice(0, 6));

        const postsArr = Array.isArray(postsRaw) ? postsRaw : (postsRaw as { results?: BlogPost[] }).results ?? [];
        setLatestPosts(postsArr.slice(0, 3));

        const allEvents = (eventsRaw as { results?: Event[] })?.results ?? [];
        const now = new Date();
        const upcoming = allEvents
          .filter((e) => {
            const d = e?.start_date ? new Date(e.start_date) : new Date(0);
            return !isNaN(d.getTime()) && d >= now;
          })
          .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
          .slice(0, 3);
        setUpcomingEvents(upcoming);

        const cpdEvents = (cpdRaw as { results?: Event[] })?.results ?? [];
        const cpdUpcoming = cpdEvents
          .filter((e) => {
            const d = e?.start_date ? new Date(e.start_date) : new Date(0);
            return !isNaN(d.getTime()) && d >= now;
          })
          .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
          .slice(0, 3);
        setCpdHighlights(cpdUpcoming);
      })
      .finally(() => setLoading(false));
  }, []);

  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    // Respect reduced motion by default, but allow user to enable autoplay manually.
    setAutoplayEnabled(!reducedMotion);
  }, [reducedMotion]);

  const slidesFromModel = heroSlides.filter((s) => s && s.image);
  const slidesFromSettings = (settings?.hero_slides ?? []).filter((s) => s && (s as HeroSlide).image) as HeroSlide[];
  const slides: HeroSlide[] =
    slidesFromModel.length > 0
      ? slidesFromModel
      : slidesFromSettings.length > 0
        ? slidesFromSettings
        : PUBLIC_FALLBACK_HERO_SLIDES;
  const hasSlides = slides.length > 0;

  useEffect(() => {
    if (!hasSlides) return;
    if (paused || !autoplayEnabled) return;
    if (slideTimer.current) window.clearInterval(slideTimer.current);
    slideTimer.current = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length);
    }, 6000);
    return () => {
      if (slideTimer.current) window.clearInterval(slideTimer.current);
      slideTimer.current = null;
    };
  }, [hasSlides, paused, autoplayEnabled, slides.length]);

  useEffect(() => {
    if (!hasSlides) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setSlideIdx((i) => (i - 1 + slides.length) % slides.length);
      if (e.key === 'ArrowRight') setSlideIdx((i) => (i + 1) % slides.length);
      if (e.key === ' ') setAutoplayEnabled((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasSlides, slides.length]);

  const chairPhoto = mediaUrl(content?.chairperson_photo ?? null);
  const hasContent = content && (content.chairperson_name || content.chairperson_message || content.intro_text);
  const quickLinks = content?.quick_links ?? [];

  const chairMessageRaw = content?.chairperson_message?.trim() ?? '';
  const introRaw = content?.intro_text?.trim() ?? '';
  const normalizeMsg = (s: string) => s.replace(/\s+/g, ' ').trim();
  /** Second block only when both fields exist and differ (no duplicate copy). */
  const showWelcomeSubsection =
    Boolean(chairMessageRaw) &&
    Boolean(introRaw) &&
    normalizeMsg(introRaw) !== normalizeMsg(chairMessageRaw);
  /** Main narrative: chair message, else intro if no chair text. */
  const leadershipMainText =
    chairMessageRaw || introRaw || '';
  const leadershipPlaceholder =
    !chairMessageRaw && !introRaw
      ? 'Add the Chairperson/President welcome message in Django Admin → Website → Home Page Content.'
      : '';

  const currentSlide = slides[slideIdx];
  const ctaUrl = currentSlide?.link_url || '/about';
  const ctaLabel = currentSlide?.link_label || 'Learn more »';
  const ctaExternal = ctaUrl.startsWith('http://') || ctaUrl.startsWith('https://');

  const homeFeeRows = membershipFeeRows(membershipPage);
  const homePayment = membershipPaymentInfo(membershipPage);

  const heroEyebrow = HERO_ORG_FULL_NAME;
  const slideTitleSafe = sanitizeHeroCopy(currentSlide?.title);
  const settingsTaglineSafe = sanitizeHeroCopy(settings?.tagline);
  const heroHeadline =
    slideTitleSafe ||
    settingsTaglineSafe ||
    'Advancing animal health through professional excellence.';
  const heroTagline =
    settingsTaglineSafe && settingsTaglineSafe !== heroHeadline && Boolean(slideTitleSafe)
      ? settingsTaglineSafe
      : '';

  const fallbackHeroSubhead =
    settingsTaglineSafe ||
    'Your professional home for training, community, and excellence in animal health.';

  return (
    <div className="min-w-0 overflow-x-hidden bg-white">
      {/* Full-width hero — primary first impression */}
      <section
        className="relative w-full overflow-hidden bg-slate-900"
        aria-roledescription="carousel"
        aria-label="Homepage highlights"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {hasSlides ? (
          <div className="relative aspect-[21/9] min-h-[420px] w-full sm:min-h-[460px] lg:min-h-[480px]">
            {slides.map((s, i) => {
              const active = i === slideIdx;
              const img = mediaUrl(s.image);
              if (!img) return null;
              return (
                <div
                  key={`${s.id || i}-${s.image}`}
                  className={`absolute inset-0 transition-opacity duration-700 ${active ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
                  aria-hidden={!active}
                >
                  <img
                    src={img}
                    alt={s.title || HERO_ORG_FULL_NAME}
                    className="h-full w-full object-cover"
                    loading={active ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </div>
              );
            })}

            {/* Cinematic read layer */}
            <div
              className="pointer-events-none absolute inset-0 z-[12] bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[12] bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(16,185,129,0.12),transparent)]"
              aria-hidden
            />

            {/* Subtle left arrow */}
            <button
              type="button"
              onClick={() => setSlideIdx((i) => (i - 1 + slides.length) % slides.length)}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white/90 backdrop-blur-sm transition hover:bg-black/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60 sm:left-4"
              aria-label="Previous slide"
            >
              <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Subtle right arrow */}
            <button
              type="button"
              onClick={() => setSlideIdx((i) => (i + 1) % slides.length)}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white/90 backdrop-blur-sm transition hover:bg-black/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60 sm:right-4"
              aria-label="Next slide"
            >
              <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Headline + primary actions */}
            <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-6 pt-20 sm:px-6 lg:px-10">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
                <div className="max-w-3xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300/95 sm:text-xs">
                    {heroEyebrow}
                  </p>
                  <h1 className="mt-3 text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {heroHeadline}
                  </h1>
                  {heroTagline && (
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300/95 sm:text-base">{heroTagline}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/80"
                  >
                    Become a member
                  </Link>
                  {ctaExternal ? (
                    <a
                      href={ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
                    >
                      {ctaLabel}
                      <span aria-hidden>→</span>
                    </a>
                  ) : (
                    <Link
                      to={ctaUrl}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
                    >
                      {ctaLabel}
                      <span aria-hidden>→</span>
                    </Link>
                  )}
                </div>
              </div>

              {slides.length > 1 && (
                <div
                  className="mx-auto mt-8 flex w-full max-w-6xl items-center justify-between gap-4 border-t border-white/10 pt-5"
                  role="tablist"
                  aria-label="Select slide"
                >
                  <div className="flex flex-1 justify-center gap-2 sm:justify-start">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSlideIdx(i)}
                        className={`h-1.5 rounded-full transition focus:outline-none focus:ring-2 focus:ring-white/60 ${
                          i === slideIdx ? 'w-10 bg-white' : 'w-6 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={i === slideIdx}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoplayEnabled((v) => !v)}
                    className="hidden rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/50 sm:inline-flex"
                    aria-label={autoplayEnabled ? 'Pause autoplay' : 'Start autoplay'}
                  >
                    {autoplayEnabled ? 'Pause' : 'Play'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.2),transparent)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            <div className="relative mx-auto max-w-6xl">
              {loading ? (
                <div className="text-center">
                  <p className="text-slate-300">Loading…</p>
                </div>
              ) : hasContent ? (
                <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
                  {chairPhoto && (
                    <div className="flex-shrink-0">
                      <img
                        src={chairPhoto}
                        alt={content?.chairperson_name || 'Chairperson'}
                        className="mx-auto h-52 w-52 rounded-3xl object-cover shadow-2xl ring-2 ring-white/10 lg:h-64 lg:w-64"
                      />
                    </div>
                  )}
                  <div className="flex-1 text-center lg:text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300/90">
                      {heroEyebrow}
                    </p>
                    <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                      {content?.chairperson_name ? (
                        <>Welcome from {content.chairperson_name}</>
                      ) : (
                        <>{HERO_ORG_FULL_NAME}</>
                      )}
                    </h1>
                    {content?.chairperson_title && (
                      <p className="mt-2 text-base font-medium text-emerald-300/95">{content.chairperson_title}</p>
                    )}
                    {content?.chairperson_message && (
                      <p className="mt-6 text-pretty text-lg leading-relaxed text-slate-300">{content.chairperson_message}</p>
                    )}
                    {content?.intro_text && (
                      <p className="mt-4 text-pretty text-slate-400">{content.intro_text}</p>
                    )}
                    {quickLinks.length > 0 && (
                      <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                        {quickLinks.map((link, i) => (
                          <Link
                            key={i}
                            to={link.url.startsWith('/') ? link.url : `/${link.url}`}
                            className="rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-4xl text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/95">
                    {heroEyebrow}
                  </p>
                  <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                    {HERO_ORG_FULL_NAME}
                  </h1>
                  <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-slate-300 sm:text-xl">
                    {fallbackHeroSubhead}
                  </p>
                  <div className="mt-12 flex flex-wrap justify-center gap-4">
                    <Link
                      to="/register"
                      className="rounded-2xl bg-emerald-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400"
                    >
                      Become a member
                    </Link>
                    <Link
                      to="/events"
                      className="rounded-2xl border border-white/25 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                    >
                      View events
                    </Link>
                    <Link
                      to="/login"
                      className="rounded-2xl border border-white/25 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              )}
              {hasContent && (
                <div className="mt-12 flex flex-wrap justify-center gap-4">
                  <Link
                    to="/register"
                    className="rounded-2xl bg-emerald-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400"
                  >
                    Become a member
                  </Link>
                  <Link
                    to="/events"
                    className="rounded-2xl border border-white/25 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                  >
                    View events
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-2xl border border-white/25 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Chairperson + intro — portrait uses fixed aspect ratio (no stretched strip) */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50/40 to-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Leadership</span>
            <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Message from the Chairperson
            </h2>
            <p className="mt-2 text-pretty text-slate-600">
              A welcome from our leadership and an overview of the association.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-start">
              {/* Portrait: fixed 3:4 frame — does not stretch with text height */}
              <div className="flex flex-shrink-0 flex-col items-center border-b border-slate-200 bg-slate-50/70 px-6 py-8 sm:px-8 lg:w-[300px] lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
                <div className="w-full max-w-[280px]">
                  <div className="overflow-hidden rounded-2xl bg-slate-200 shadow-md ring-1 ring-slate-200/80">
                    <div className="aspect-[3/4] w-full">
                      {chairPhoto ? (
                        <img
                          src={chairPhoto}
                          alt={content?.chairperson_name || 'Chairperson'}
                          className="h-full w-full object-cover object-[center_20%]"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center bg-slate-100">
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">AHTTAK</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 w-full max-w-[280px] text-center lg:text-left">
                  <p className="text-base font-semibold text-slate-900">
                    {content?.chairperson_name || 'Chairperson / President'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{content?.chairperson_title || 'Association leadership'}</p>
                </div>
              </div>

              <div className="min-w-0 flex-1 px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-10">
                <div className="max-w-3xl space-y-5 text-[17px] leading-[1.75] text-slate-700">
                  {splitIntoParagraphs(leadershipMainText || leadershipPlaceholder).map((para, i) => (
                    <p key={i} className="text-pretty">
                      {para}
                    </p>
                  ))}
                </div>

                {content?.updated_at && (
                  <p className="mt-8 border-t border-slate-100 pt-6 text-sm text-slate-500">
                    Updated {new Date(content.updated_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>
                )}

                {showWelcomeSubsection && (
                  <div className="mt-10 border-t border-slate-200 pt-10">
                    <h3 className="text-lg font-semibold text-slate-900">Welcome to AHTTAK</h3>
                    <div className="mt-4 max-w-3xl space-y-5 text-[17px] leading-[1.75] text-slate-600">
                      {splitIntoParagraphs(introRaw).map((para, i) => (
                        <p key={i} className="text-pretty">
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {quickLinks.length > 0 && (
                  <div className="mt-10 flex flex-wrap gap-2">
                    {quickLinks.slice(0, 6).map((link, i) => (
                      <Link
                        key={i}
                        to={link.url.startsWith('/') ? link.url : `/${link.url}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        {link.label}
                        <span className="text-slate-400" aria-hidden>
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership — light, restrained palette (aligned with rest of site) */}
      <section className="border-b border-slate-200 bg-slate-50/90">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-8 sm:px-8 sm:py-9">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Membership</span>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    Registration &amp; payment
                  </h2>
                  <p className="mt-2 text-pretty text-slate-600">
                    Official fees and M‑Pesa details (managed in Django admin).
                  </p>
                </div>
                <Link
                  to="/membership"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Full membership details →
                </Link>
              </div>
            </div>

            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7">
                <div className="grid gap-3 sm:grid-cols-2">
                  {homeFeeRows.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition hover:border-slate-300"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                      <p className="mt-2 text-base font-semibold tabular-nums text-slate-900 sm:text-lg">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="h-full rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Payment process</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <p className="text-xs font-medium text-slate-500">M‑Pesa Paybill</p>
                      <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{homePayment.paybill}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <p className="text-xs font-medium text-slate-500">Account No.</p>
                      <p className="mt-1.5 break-words font-mono text-sm font-semibold leading-snug text-slate-800">
                        {homePayment.accountFormat}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-slate-600">
                    Use your phone number in the account format above to complete payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements (from SiteSettings.announcements) */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-[1.5rem] border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800/80">
                Updates
              </span>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Announcements</h2>
              <p className="mt-1 text-sm text-slate-600">
                Notices and important updates from the association.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {announcements.map((n, idx) => {
              const href = n.file ? mediaUrl(n.file) : n.url || '';
              const clickable = Boolean(href);
              const external = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/media/');
              const Card = (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">{n.text}</p>
                  {clickable && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">Open →</p>
                  )}
                </div>
              );
              if (!clickable) return <div key={idx}>{Card}</div>;
              return external ? (
                <a key={idx} href={href} target="_blank" rel="noreferrer" className="focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded-xl">
                  {Card}
                </a>
              ) : (
                <Link key={idx} to={href} className="focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded-xl">
                  {Card}
                </Link>
              );
            })}
            {!loading && announcements.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 sm:col-span-2 lg:col-span-3">
                No announcements yet. Add them in Django Admin → Website → Site Settings → Announcements.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest news & announcements (from Blog) */}
      <section className="border-y border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800/80">
                Newsroom
              </span>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Latest news &amp; announcements
              </h2>
              <p className="mt-2 max-w-xl text-slate-600">Stories, notices, and updates from AHTTAK.</p>
            </div>
            <Link
              to="/blog"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-800 transition hover:text-emerald-600"
            >
              View all <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-video bg-slate-100">
                  {post.featured_image ? (
                    <img
                      src={mediaUrl(post.featured_image)}
                      alt={post.title}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-slate-400">
                      {post.title?.charAt(0) || 'N'}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700">{post.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{post.excerpt}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
                  </p>
                </div>
              </Link>
            ))}
            {!loading && latestPosts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-600 sm:col-span-2 lg:col-span-3">
                No posts yet. Add announcements in Django Admin → Website → Blog posts.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming events + CPD highlights (from Events) */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800/80">
                  Calendar
                </span>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Upcoming events</h2>
                <p className="mt-2 text-slate-600">Conferences, workshops, seminars and more.</p>
              </div>
              <Link to="/events" className="text-sm font-semibold text-emerald-800 hover:text-emerald-600">
                View all →
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {upcomingEvents.map((e) => (
                <Link
                  key={e.id}
                  to={`/events/${e.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{e.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {e.start_date ? new Date(e.start_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-700">Details →</span>
                  </div>
                </Link>
              ))}
              {!loading && upcomingEvents.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                  No upcoming events right now.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800/80">
                  Professional development
                </span>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">CPD highlights</h2>
                <p className="mt-2 text-slate-600">Upcoming CPD-accredited events and trainings.</p>
              </div>
              <Link to="/cpd" className="text-sm font-semibold text-emerald-800 hover:text-emerald-600">
                View CPD →
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {cpdHighlights.map((e) => (
                <Link
                  key={e.id}
                  to={`/events/${e.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{e.title}</h3>
                        {(e.cpd_points ?? 0) > 0 && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            {e.cpd_points} CPD
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {e.start_date ? new Date(e.start_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-700">Details →</span>
                  </div>
                </Link>
              ))}
              {!loading && cpdHighlights.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                  No upcoming CPD events right now.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-slate-50/80">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800/80">
              Member value
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Why join AHTTAK?</h2>
            <p className="mt-4 text-pretty text-slate-600">
              Programs, events, and a community built around professional excellence in animal health.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Empowering communities',
                desc: 'Programs and resources that help members grow where they work and live.',
                image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80',
                alt: 'Community',
              },
              {
                title: 'Member events',
                desc: 'Training, CPD, workshops, and AGMs at member rates.',
                image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
                alt: 'Events',
              },
              {
                title: 'Support & governance',
                desc: 'Transparent leadership and dedicated support for members.',
                image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
                alt: 'Support',
              },
            ].map(({ title, desc, image, alt }) => (
              <div
                key={title}
                className="group overflow-hidden rounded-[1.25rem] border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={image}
                    alt={alt}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            <Link
              to="/events"
              className="rounded-2xl border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300/80 hover:bg-emerald-50/50"
            >
              Upcoming events →
            </Link>
            <Link
              to="/cpd"
              className="rounded-2xl border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300/80 hover:bg-emerald-50/50"
            >
              CPD events →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { publicApi, type TeamMember, type AboutPageContent } from '../lib/api';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&q=80';

function mediaFile(path: string): string {
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
}

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

type SectionKey = 'board' | 'management' | 'regional' | 'team';

function getSection(member: TeamMember): SectionKey {
  const dep = member.department?.toLowerCase().trim() ?? '';
  const region = member.region?.trim();
  if (region) return 'regional';
  if (dep.includes('board')) return 'board';
  if (dep.includes('management') || dep.includes('executive') || dep.includes('ceo') || dep.includes('director')) return 'management';
  return 'team';
}

function groupBySection(members: TeamMember[]): Record<SectionKey, TeamMember[]> {
  const groups: Record<SectionKey, TeamMember[]> = {
    board: [],
    management: [],
    regional: [],
    team: [],
  };
  for (const m of members) {
    groups[getSection(m)].push(m);
  }
  return groups;
}

const SECTION_CONFIG: { key: SectionKey; title: string }[] = [
  { key: 'board', title: 'Board of Directors' },
  { key: 'management', title: 'Management' },
  { key: 'regional', title: 'Regional Representatives' },
  { key: 'team', title: 'Our Team' },
];

type IconName = 'history' | 'vision' | 'mission' | 'values' | 'objectives' | 'document' | 'shield' | 'team';

// Real images (vet / animal-health themed) for the narrative cards.
// These are intentionally consistent in style: editorial, clean backgrounds, and work well as small thumbnails.
const CARD_IMAGE: Partial<Record<IconName, { src: string; alt: string }>> = {
  history: {
    src: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=160&h=160&q=80',
    alt: 'Veterinary care and animal health',
  },
  vision: {
    src: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=160&h=160&q=80',
    alt: 'Healthy cattle in the field',
  },
  mission: {
    src: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=160&h=160&q=80',
    alt: 'Veterinary stethoscope and animal health care',
  },
  objectives: {
    src: 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=160&h=160&q=80',
    alt: 'Training and professional development',
  },
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  const cls = className ?? 'h-5 w-5';
  const cardImg = CARD_IMAGE[name];
  if (cardImg) {
    // Square thumbnail used in cards (replaces generic icons).
    return (
      <img
        src={cardImg.src}
        alt={cardImg.alt}
        className={`${cls} rounded-2xl object-cover`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }
  if (name === 'history') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 8v5l3 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 12a9 9 0 1 0 3-6.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 4v4h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'vision') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'mission') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'values') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6.5-7 11-7 11Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'objectives') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M10 13l2 2 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'document') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M14 2v6h6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === 'shield') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // team
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 11a4 4 0 1 0-8 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 22a9 9 0 0 1 18 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MemberCard({
  member,
  onViewFull,
}: {
  member: TeamMember;
  onViewFull: (m: TeamMember) => void;
}) {
  const photoUrl = mediaUrl(member.photo);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* Photo: portrait aspect, object-cover with focus on top (face) */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={member.name}
            className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <span className="text-4xl font-bold text-slate-500">
              {member.name
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        {/* Designation first (role), then name */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {member.designation}
        </p>
        <h3 className="mt-1 text-lg font-bold text-slate-900">{member.name}</h3>
        {(member.department || member.region) && (
          <p className="mt-0.5 text-xs text-slate-500">
            {member.region ? `${member.department || ''} • ${member.region}` : member.department}
          </p>
        )}
        {member.years_of_experience && (
          <p className="mt-2 text-xs text-slate-500">
            {member.years_of_experience} years experience
          </p>
        )}
        {member.qualifications && (
          <p className="mt-2 text-sm text-slate-600 line-clamp-2">
            {member.qualifications}
          </p>
        )}
        {member.bio && (
          <p className="mt-3 text-sm text-slate-600 line-clamp-3">{member.bio}</p>
        )}
        <button
          type="button"
          onClick={() => onViewFull(member)}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          View full profile
          <span className="transition group-hover:translate-x-0.5" aria-hidden>
            →
          </span>
        </button>
      </div>
    </article>
  );
}

export default function About() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [content, setContent] = useState<AboutPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullProfile, setFullProfile] = useState<TeamMember | null>(null);

  useEffect(() => {
    Promise.all([
      publicApi.team().catch(() => []),
      publicApi.aboutContent().catch(() => null),
    ]).then(([t, c]) => {
      setTeam(t);
      setContent(c);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullProfile(null);
    };
    if (fullProfile) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [fullProfile]);

  const grouped = groupBySection(team);
  const hasNarrative = Boolean(
    content?.history?.trim() ||
      content?.vision?.trim() ||
      content?.mission?.trim() ||
      content?.core_values?.trim() ||
      content?.objectives?.trim()
  );

  const overviewCards = useMemo(
    () =>
      [
        { key: 'history', title: 'Our History', icon: 'history' as const, body: content?.history || '' },
        { key: 'vision', title: 'Vision', icon: 'vision' as const, body: content?.vision || '' },
        { key: 'mission', title: 'Mission', icon: 'mission' as const, body: content?.mission || '' },
        { key: 'values', title: 'Core Values', icon: 'values' as const, body: content?.core_values || '' },
        { key: 'objectives', title: 'Objectives', icon: 'objectives' as const, body: content?.objectives || '' },
      ].filter((c) => c.body && c.body.trim().length > 0),
    [content]
  );

  return (
    <div className="min-w-0 overflow-x-hidden">
      {/* Hero section */}
      <section className="relative w-full overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover opacity-35"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.25),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_45%),linear-gradient(to_bottom,rgba(2,6,23,0.25),rgba(2,6,23,0.92))]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
              <Icon name="shield" className="h-4 w-4 text-emerald-300" />
              About the Association
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Animal Health Technicians and Technologists Association (AHTTAK)
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-200 sm:text-lg">
              {content?.history?.trim()
                ? 'Learn who we are, what we stand for, and how we serve members and the broader community.'
                : 'Learn who we are, what we stand for, and how we serve members and the broader community.'}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        {loading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : (
          <>
            {/* Narrative + cards */}
            {content && hasNarrative && (
              <section className="mb-14">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Our foundation</h2>
                    <p className="mt-2 max-w-2xl text-slate-600">
                      A clear purpose, strong governance, and a member-first culture.
                    </p>
                  </div>
                  {content?.updated_at && (
                    <p className="text-xs font-medium text-slate-500">
                      Updated {new Date(content.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {overviewCards.length > 0 && (
                  <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    {overviewCards.map((card) => (
                      <article
                        key={card.key}
                        className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                            <Icon name={card.icon} className="h-12 w-12" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                              {card.body}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {(content.constitution_file || content.governance_document) && (
                  <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Governance documents</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Key reference documents available for download.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {content.constitution_file && (
                        <a
                          href={mediaFile(content.constitution_file)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Icon name="document" className="h-4 w-4" />
                          Constitution
                        </a>
                      )}
                      {content.governance_document && (
                        <a
                          href={mediaFile(content.governance_document)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Icon name="document" className="h-4 w-4" />
                          Governance document
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Leadership */}
            <section className="mt-2">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <Icon name="team" className="h-4 w-4" />
                      Leadership directory
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                      Leadership
                    </h2>
                    <p className="mt-2 max-w-2xl text-slate-600">
                      Meet the people guiding AHTTAK’s direction and delivering member services.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-100">
                      {team.length} profiles
                    </span>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {SECTION_CONFIG.map(({ key, title }) => {
                    const members = grouped[key];
                    if (!members.length) return null;
                    const blurb =
                      key === 'board'
                        ? 'Strategic leadership and governance.'
                        : key === 'management'
                          ? 'Day-to-day operations and execution.'
                          : key === 'regional'
                            ? 'Representation across regions and networks.'
                            : 'Member support and program delivery.';

                    return (
                      <section key={key} className="rounded-3xl border border-slate-200 bg-slate-50/60">
                        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h3>
                            <p className="mt-1 text-sm text-slate-600">{blurb}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {members.length} people
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {members.map((member) => (
                              <MemberCard key={member.id} member={member} onViewFull={setFullProfile} />
                            ))}
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
        {!loading && team.length === 0 && (
          <p className="py-16 text-center text-slate-500">No team members to display.</p>
        )}
      </div>

      {/* Full profile modal */}
      {fullProfile && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal
          aria-labelledby="profile-title"
          onClick={() => setFullProfile(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullProfile(null)}
              className="absolute right-3 top-3 z-10 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:right-4 sm:top-4"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
              {mediaUrl(fullProfile.photo) ? (
                <img
                  src={mediaUrl(fullProfile.photo)!}
                  alt={fullProfile.name}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-200 text-5xl font-bold text-slate-400">
                  {fullProfile.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                {fullProfile.designation}
              </p>
              <h2 id="profile-title" className="mt-1 text-2xl font-bold text-slate-900">
                {fullProfile.name}
              </h2>
              {fullProfile.department && (
                <p className="mt-1 text-slate-500">{fullProfile.department}</p>
              )}
              {fullProfile.years_of_experience && (
                <p className="mt-2 text-sm text-slate-600">
                  {fullProfile.years_of_experience} years of experience
                </p>
              )}
              {fullProfile.qualifications && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-900">Qualifications</h3>
                  <p className="mt-1 text-slate-600 whitespace-pre-wrap">
                    {fullProfile.qualifications}
                  </p>
                </div>
              )}
              {fullProfile.bio && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-900">About</h3>
                  <p className="mt-1 text-slate-600 whitespace-pre-wrap">{fullProfile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

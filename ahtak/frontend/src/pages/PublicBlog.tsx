import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { publicApi, type BlogCategory, type BlogPost, type Paginated } from '../lib/api';

function mediaUrl(path: string | null) {
  if (!path) return null;
  return path.startsWith('http') ? path : path.startsWith('/') ? path : `/${path}`;
}

function normalizePosts(data: Paginated<BlogPost> | BlogPost[]): Paginated<BlogPost> {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data;
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

/** When BlogCategory rows are empty in admin, still show chips from published posts. */
function deriveCategoriesFromPosts(posts: BlogPost[]): BlogCategory[] {
  const seen = new Map<string, BlogCategory>();
  let nid = 0;
  for (const p of posts) {
    const slug = (p.category_slug || '').trim();
    const name = (p.category_name || '').trim();
    if (!slug && !name) continue;
    const key = slug || name.toLowerCase().replace(/\s+/g, '-');
    if (seen.has(key)) continue;
    nid += 1;
    seen.set(key, {
      id: nid,
      name: name || slug,
      slug: slug || key,
      description: '',
    });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function mergeCategoryLists(api: BlogCategory[], derived: BlogCategory[]): BlogCategory[] {
  const bySlug = new Map<string, BlogCategory>();
  for (const c of api) {
    if (c.slug) bySlug.set(c.slug, c);
  }
  for (const c of derived) {
    if (!bySlug.has(c.slug)) bySlug.set(c.slug, c);
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default function PublicBlog() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [featured, setFeatured] = useState<BlogPost | null>(null);
  const [list, setList] = useState<Paginated<BlogPost> | null>(null);
  const [recent, setRecent] = useState<BlogPost[]>([]);
  const [relatedStrip, setRelatedStrip] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [newsletterErr, setNewsletterErr] = useState('');

  const pageSize = 6;

  const loadFeatured = useCallback(async () => {
    try {
      const data = normalizePosts(await publicApi.blogPosts({ is_featured: true, page_size: 1 }));
      let f = data.results[0] ?? null;
      if (!f) {
        const latest = normalizePosts(await publicApi.blogPosts({ page_size: 1 }));
        f = latest.results[0] ?? null;
      }
      setFeatured(f);
    } catch {
      try {
        const latest = normalizePosts(await publicApi.blogPosts({ page_size: 1 }));
        setFeatured(latest.results[0] ?? null);
      } catch {
        setFeatured(null);
      }
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = normalizePosts(
        await publicApi.blogPosts({
          page,
          page_size: pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(categorySlug ? { category: categorySlug } : {}),
        }),
      );
      setList(data);
    } catch {
      setList({ count: 0, next: null, previous: null, results: [] });
    } finally {
      setLoading(false);
    }
  }, [page, search, categorySlug]);

  const loadSidebar = useCallback(async () => {
    try {
      const [catsRaw, postsForCats, latest] = await Promise.all([
        publicApi.blogCategories().catch(() => [] as BlogCategory[]),
        publicApi.blogPosts({ page_size: 50 }).catch(() => ({
          count: 0,
          next: null,
          previous: null,
          results: [] as BlogPost[],
        })),
        publicApi.blogPosts({ page_size: 8 }).then((d) => normalizePosts(d).results).catch(() => [] as BlogPost[]),
      ]);

      const fromApi = Array.isArray(catsRaw) ? catsRaw : [];
      const postList = normalizePosts(postsForCats as Paginated<BlogPost> | BlogPost[]).results;
      const derived = deriveCategoriesFromPosts(postList);
      const merged = mergeCategoryLists(fromApi, derived);

      const recentPosts = latest.slice(0, 5);
      const relatedPosts = latest.slice(5, 8);

      setCategories(merged);
      setRecent(recentPosts);
      setRelatedStrip(page === 1 ? relatedPosts : []);
    } catch {
      setCategories([]);
      setRecent([]);
      setRelatedStrip([]);
    }
  }, [page]);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadSidebar();
  }, [loadSidebar]);

  const gridPosts = useMemo(() => {
    const rows = list?.results ?? [];
    if (!featured) return rows;
    const filtered = rows.filter((p) => p.id !== featured.id);
    // Avoid empty grid when the only published post is featured
    if (filtered.length === 0 && rows.length > 0) return rows;
    return filtered;
  }, [list, featured]);

  const totalPages = Math.max(1, Math.ceil((list?.count ?? 0) / pageSize));

  const runSearch = (e?: FormEvent) => {
    e?.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const newsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNewsletterErr('');
    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterErr('Enter your email.');
      return;
    }
    try {
      await publicApi.contact({
        name: 'Newsletter subscriber',
        email,
        subject: 'Newsletter subscription',
        message: `Please add this address to the newsletter list: ${email}`,
      });
      setNewsletterDone(true);
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterErr(err instanceof Error ? err.message : 'Could not subscribe.');
    }
  };

  return (
    <div className="min-w-0 overflow-x-hidden bg-slate-100/80">
      {/* Featured */}
      {featured && page === 1 && !search && !categorySlug && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <span className="inline-block rounded-md bg-lime-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
              Featured article
            </span>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="flex flex-col justify-center p-8 sm:p-10">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                      {featured.author_name || 'AHTTAK'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                      </svg>
                      {formatDate(featured.published_at)}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="mt-4 line-clamp-4 text-slate-600">{featured.excerpt}</p>
                  )}
                  <Link
                    to={`/blog/${featured.slug}`}
                    className="mt-8 inline-flex w-fit items-center justify-center rounded-lg bg-lime-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-lime-600"
                  >
                    Read article
                  </Link>
                </div>
                <div className="relative min-h-[240px] bg-slate-200 lg:min-h-[320px]">
                  {featured.featured_image ? (
                    <img
                      src={mediaUrl(featured.featured_image)!}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[240px] items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-5xl font-bold text-slate-500">
                      {featured.title.charAt(0)}
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:bg-gradient-to-l" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search */}
      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={runSearch} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search articles…"
                className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-900 shadow-sm outline-none ring-lime-500/20 transition focus:border-lime-500 focus:ring-4"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-lime-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-lime-600"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Main column */}
          <div className="lg:col-span-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Latest articles</h1>
              <p className="mt-1 text-slate-600">Explore our latest insights and updates.</p>
              {categorySlug && (
                <button
                  type="button"
                  onClick={() => {
                    setCategorySlug(null);
                    setPage(1);
                  }}
                  className="mt-2 text-sm font-semibold text-lime-700 hover:underline"
                >
                  Clear category filter
                </button>
              )}
            </div>

            {loading && <p className="text-slate-500">Loading…</p>}

            {!loading && gridPosts.length > 0 && (
              <div className="grid gap-8 sm:grid-cols-2">
                {gridPosts.map((post) => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {!loading && gridPosts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="font-semibold text-slate-900">No articles found</p>
                <p className="mt-2 text-slate-600">Try another search or category.</p>
              </div>
            )}

            {!loading && totalPages > 1 && (
              <nav className="mt-10 flex flex-wrap items-center justify-center gap-3" aria-label="Pagination">
                <button
                  type="button"
                  disabled={!list?.previous}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={!list?.next}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8 lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Recent posts</h2>
              <ul className="mt-4 space-y-4">
                {recent.map((p) => (
                  <li key={p.id}>
                    <Link to={`/blog/${p.slug}`} className="group block">
                      <span className="line-clamp-2 font-medium text-slate-800 group-hover:text-lime-700">
                        {p.title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{formatDate(p.published_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Categories</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategorySlug(c.slug);
                      setPage(1);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      categorySlug === c.slug
                        ? 'border-lime-500 bg-lime-50 text-lime-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-lime-300'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-lime-500 p-6 text-white shadow-md">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-8 w-8 shrink-0 opacity-90" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <div>
                  <h2 className="text-lg font-bold">Newsletter</h2>
                  <p className="mt-1 text-sm text-white/90">
                    Get updates and announcements from AHTTAK in your inbox.
                  </p>
                </div>
              </div>
              {newsletterDone ? (
                <p className="mt-4 text-sm font-medium text-white">Thanks — we&apos;ll be in touch.</p>
              ) : (
                <form onSubmit={newsletterSubmit} className="mt-5 space-y-3">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full rounded-lg border-2 border-white/40 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/70 outline-none focus:border-white"
                  />
                  {newsletterErr && <p className="text-sm text-amber-100">{newsletterErr}</p>}
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-lime-700 transition hover:bg-slate-50"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Related strip — page 1 only, extra stories */}
      {page === 1 && relatedStrip.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900">Related articles</h2>
            <p className="mt-1 text-slate-600">More stories you might find interesting.</p>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedStrip.map((post) => (
                <ArticleCard key={post.id} post={post} compact />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ArticleCard({ post, compact }: { post: BlogPost; compact?: boolean }) {
  const img = mediaUrl(post.featured_image);
  const cat = post.category_name || post.tags?.[0]?.name;
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] bg-slate-100">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-slate-400">
            {post.title.charAt(0)}
          </div>
        )}
        {cat && (
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-800 shadow">
            {cat}
          </span>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${compact ? 'p-4' : 'p-5'}`}>
        <p className="text-xs text-slate-500">
          {formatDate(post.published_at)}
          {post.author_name ? ` · ${post.author_name}` : ''}
        </p>
        <h3 className={`mt-2 font-bold text-slate-900 group-hover:text-lime-700 ${compact ? 'text-base line-clamp-2' : 'text-lg line-clamp-2'}`}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className={`mt-2 flex-1 text-slate-600 ${compact ? 'line-clamp-2 text-sm' : 'line-clamp-3 text-sm'}`}>
            {post.excerpt}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-lime-600">
          Read <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

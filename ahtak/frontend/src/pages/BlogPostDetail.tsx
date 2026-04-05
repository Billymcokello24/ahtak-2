import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicApi, type BlogPost } from '../lib/api';
import { setSeo } from '../lib/seo';

function mediaUrl(path: string | null) {
  if (!path) return null;
  return path.startsWith('http') ? path : path.startsWith('/') ? path : `/${path}`;
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function ArticleCard({ post }: { post: BlogPost }) {
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
          <div className="flex h-full items-center justify-center text-3xl font-bold text-slate-400">
            {post.title.charAt(0)}
          </div>
        )}
        {cat && (
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-800 shadow">
            {cat}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-slate-500">
          {formatDate(post.published_at)}
          {post.author_name ? ` · ${post.author_name}` : ''}
        </p>
        <h3 className="mt-2 line-clamp-2 text-base font-bold text-slate-900 group-hover:text-lime-700">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{post.excerpt}</p>}
        <span className="mt-3 text-sm font-semibold text-lime-600">
          Read <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    publicApi
      .blogPost(slug)
      .then(setPost)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    setSeo({
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || 'Read this AHTTAK news article.',
      keywords: post.keywords || undefined,
      path: `/blog/${post.slug}`,
      image: mediaUrl(post.featured_image) || undefined,
    });
  }, [post]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-red-600">{error || 'Post not found.'}</p>
        <Link to="/blog" className="mt-4 inline-block font-semibold text-lime-700 hover:underline">
          ← Back to News
        </Link>
      </div>
    );
  }

  const related = post.related_posts ?? [];

  return (
    <div className="min-w-0 overflow-x-hidden bg-slate-100/80">
      <article>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <span aria-hidden>←</span> Back to News
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              {(post.category_name || (typeof post.category === 'object' && post.category?.name)) && (
                <span className="rounded-md bg-lime-500 px-2.5 py-1 text-white">
                  {post.category_name || (typeof post.category === 'object' ? post.category?.name : '')}
                </span>
              )}
              {post.published_at && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{formatDate(post.published_at)}</span>
              )}
              {post.reading_time_minutes ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{post.reading_time_minutes} min read</span>
              ) : null}
            </div>

            <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              {post.title}
            </h1>

            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                {post.author_name || 'AHTTAK'}
              </span>
            </p>

            {post.excerpt && (
              <p className="mt-6 text-lg leading-relaxed text-slate-600">{post.excerpt}</p>
            )}
          </div>

          {post.featured_image && (
              <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md">
                  <img
                    src={mediaUrl(post.featured_image)!}
                    alt=""
                    className="max-h-[min(70vh,520px)] w-full object-cover"
                  />
                </div>
              </div>
            )}
        </header>

        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              <div
                className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10
                  [&_p]:mb-6 [&_p]:mt-0 [&_p]:text-[17px] [&_p]:leading-[1.75] [&_p]:text-slate-700
                  [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-900
                  [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900
                  [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900
                  [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6
                  [&_li]:mb-2 [&_li]:text-slate-700 [&_a]:font-medium [&_a]:text-lime-700 [&_a]:underline-offset-2 hover:[&_a]:underline
                  [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-lime-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600
                  [&_img]:my-6 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-md
                  [&_strong]:font-semibold [&_strong]:text-slate-900"
                dangerouslySetInnerHTML={{ __html: post.content || '' }}
              />
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">Share</p>
                  <p className="mt-1 text-sm text-slate-600">Copy link to share this article.</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 1500);
                        } catch {
                          setCopied(false);
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-xl bg-lime-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-lime-600"
                    >
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-lime-700 hover:underline"
                    >
                      Open
                    </a>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">More from AHTTAK</p>
                  <Link
                    to="/blog"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-lime-700 hover:underline"
                  >
                    Browse all articles <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {related.length > 0 && (
          <section className="border-t border-slate-200 bg-white py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-slate-900">Related articles</h2>
              <p className="mt-1 text-slate-600">More stories you might find interesting.</p>
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <ArticleCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

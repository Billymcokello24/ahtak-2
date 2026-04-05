import { useEffect, useMemo, useState } from 'react';
import { publicApi, type GalleryAlbum, type GalleryMedia } from '../lib/api';

const PUBLIC_FALLBACK_GALLERY: GalleryAlbum[] = [
  {
    id: 50001,
    title: 'AHTTAK Highlights',
    description: 'Public-folder fallback gallery shown when backend albums are unavailable.',
    event: null,
    cover_image: '/ahttak1.jpeg',
    media_count: 9,
    created_at: new Date().toISOString(),
    media: Array.from({ length: 9 }, (_, i) => ({
      id: 60001 + i,
      title: `AHTTAK ${i + 1}`,
      media_type: 'image',
      image: `/ahttak${i + 1}.jpeg`,
      video_url: null,
      display_order: i,
      created_at: new Date().toISOString(),
    })),
  },
];

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
}

/** Extract YouTube video id for embed / thumbnail. */
function parseYouTubeId(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname.startsWith('/embed/')) {
        const id = u.pathname.split('/')[2]?.split('?')[0];
        return id && /^[\w-]{11}$/.test(id) ? id : null;
      }
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2]?.split('?')[0];
        return id && /^[\w-]{11}$/.test(id) ? id : null;
      }
      const v = u.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
    }
  } catch {
    return null;
  }
  return null;
}

function parseVimeoId(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (!u.hostname.replace(/^www\./, '').endsWith('vimeo.com')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i])) return parts[i];
    }
  } catch {
    return null;
  }
  return null;
}

type VideoEmbed =
  | { kind: 'iframe'; src: string; title: string }
  | { kind: 'video'; src: string; title: string };

/** YouTube / Vimeo iframe, or direct file for <video>. Otherwise null → open-in-tab fallback. */
function getVideoEmbed(url: string, title: string): VideoEmbed | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const yt = parseYouTubeId(trimmed);
  if (yt) {
    return {
      kind: 'iframe',
      title,
      src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`,
    };
  }

  const vm = parseVimeoId(trimmed);
  if (vm) {
    return {
      kind: 'iframe',
      title,
      src: `https://player.vimeo.com/video/${vm}?dnt=1`,
    };
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) {
    return { kind: 'video', src: trimmed, title };
  }

  return null;
}

function youtubePosterUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const id = parseYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

function Icon({ name, className }: { name: 'photo' | 'video' | 'close' | 'left' | 'right'; className?: string }) {
  const cls = className ?? 'h-5 w-5';
  if (name === 'close') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'left') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 19 8 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'right') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'video') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 10.5V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5l6 4v-11l-6 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h16v14H4V5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m8 14 2-2 3 3 3-4 4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: GalleryMedia[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];
  const img = item?.image ? mediaUrl(item.image) : null;
  const videoEmbed =
    item?.media_type === 'video' && item.video_url
      ? getVideoEmbed(item.video_url, item.title || 'Video')
      : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6"
      role="dialog"
      aria-modal
      aria-label="Gallery viewer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
            {index + 1} / {items.length}
          </span>
          {item?.media_type === 'video' && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              Video
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-white/90 backdrop-blur transition hover:bg-white/20"
          aria-label="Close"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onPrev}
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 hidden items-center justify-center rounded-full bg-white/10 p-2 text-white/90 backdrop-blur transition hover:bg-white/20 sm:inline-flex"
          aria-label="Previous"
        >
          <Icon name="left" className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 hidden items-center justify-center rounded-full bg-white/10 p-2 text-white/90 backdrop-blur transition hover:bg-white/20 sm:inline-flex"
          aria-label="Next"
        >
          <Icon name="right" className="h-6 w-6" />
        </button>

        <div className="flex max-h-[80vh] min-h-[200px] w-full items-center justify-center bg-black sm:min-h-[320px]">
          {item?.media_type === 'video' && item.video_url && videoEmbed?.kind === 'iframe' ? (
            <div className="aspect-video w-full max-h-[min(80vh,720px)] max-w-full">
              <iframe
                title={videoEmbed.title}
                src={videoEmbed.src}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : item?.media_type === 'video' && item.video_url && videoEmbed?.kind === 'video' ? (
            <video
              className="max-h-[80vh] w-full max-w-full bg-black"
              controls
              playsInline
              preload="metadata"
              src={videoEmbed.src}
            />
          ) : item?.media_type === 'video' && item.video_url ? (
            <a
              href={item.video_url}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full w-full items-center justify-center p-10 text-center"
            >
              <div className="max-w-md">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition group-hover:bg-white/15">
                  <Icon name="video" className="h-7 w-7" />
                </div>
                <p className="mt-5 text-base font-semibold text-white">Open video</p>
                <p className="mt-2 text-sm text-white/70">
                  Embed is not available for this link. It opens in a new tab.
                </p>
                <p className="mt-4 text-xs text-white/60 break-all">{item.video_url}</p>
              </div>
            </a>
          ) : img ? (
            <img src={img} alt={item?.title || 'Gallery item'} className="max-h-[80vh] w-auto max-w-full object-contain" />
          ) : (
            <div className="p-10 text-white/70">No media to display.</div>
          )}
        </div>

        {(item?.title || item?.created_at) && (
          <div className="border-t border-white/10 bg-slate-950 px-5 py-4">
            <p className="text-sm font-semibold text-white">{item.title || 'Untitled'}</p>
            {item.created_at && (
              <p className="mt-1 text-xs text-white/60">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AlbumCard({
  album,
  onOpenMedia,
}: {
  album: GalleryAlbum;
  onOpenMedia: (album: GalleryAlbum, mediaIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const first = album.media?.[0];
  const cover =
    mediaUrl(album.cover_image) ??
    (first?.image ? mediaUrl(first.image) : null) ??
    (first?.media_type === 'video' && first.video_url ? youtubePosterUrl(first.video_url) : null);
  const mediaItems = album.media ?? [];
  const images = mediaItems.filter((m) => m.media_type !== 'video' && m.image);
  const videos = mediaItems.filter((m) => m.media_type === 'video' && m.video_url);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {cover ? (
            <img
              src={cover}
              alt={album.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/50">
                  <Icon name="photo" className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold">No cover image</p>
              </div>
            </div>
          )}
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow">
              {album.media_count ?? mediaItems.length} items
            </span>
            {videos.length > 0 && (
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow">
                {videos.length} video
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-slate-900">{album.title}</h3>
              {album.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{album.description}</p>}
            </div>
            <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              {expanded ? 'Hide' : 'View'}
              <span aria-hidden className={`transition ${expanded ? 'rotate-180' : ''}`}>▾</span>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-100">
              <Icon name="photo" className="h-4 w-4" />
              {images.length} photos
            </span>
            {videos.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-slate-700 ring-1 ring-slate-200">
                <Icon name="video" className="h-4 w-4" />
                {videos.length} videos
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && mediaItems.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/60 p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {mediaItems.map((m, idx) => {
              const img = m.image ? mediaUrl(m.image) : null;
              const isVideo = m.media_type === 'video' && m.video_url;
              const ytPoster = isVideo && m.video_url ? youtubePosterUrl(m.video_url) : null;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onOpenMedia(album, idx)}
                  className="group/thumb relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow"
                >
                  <div className="aspect-square bg-slate-100">
                    {isVideo && ytPoster ? (
                      <div className="relative h-full w-full">
                        <img
                          src={ytPoster}
                          alt=""
                          className="h-full w-full object-cover transition group-hover/thumb:scale-[1.03]"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow">
                            <Icon name="video" className="h-4 w-4" />
                            Play
                          </span>
                        </div>
                      </div>
                    ) : isVideo ? (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                        <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-900">
                          <Icon name="video" className="h-4 w-4" />
                          Video
                        </div>
                      </div>
                    ) : img ? (
                      <img src={img} alt={m.title || album.title} className="h-full w-full object-cover transition group-hover/thumb:scale-[1.03]" loading="lazy" decoding="async" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">No media</div>
                    )}
                  </div>
                  {(m.title || m.media_type === 'video') && (
                    <div className="px-3 py-2">
                      <p className="truncate text-xs font-semibold text-slate-700">{m.title || (m.media_type === 'video' ? 'Video' : 'Photo')}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

export default function Gallery() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAlbum, setActiveAlbum] = useState<GalleryAlbum | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    publicApi
      .gallery()
      .then((rows) => setAlbums(rows.length > 0 ? rows : PUBLIC_FALLBACK_GALLERY))
      .catch(() => setAlbums(PUBLIC_FALLBACK_GALLERY))
      .finally(() => setLoading(false));
  }, []);

  const allMedia = useMemo(() => (activeAlbum?.media ?? []) as GalleryMedia[], [activeAlbum]);

  const openMedia = (album: GalleryAlbum, mediaIndex: number) => {
    setActiveAlbum(album);
    setActiveIndex(mediaIndex);
  };
  const closeMedia = () => setActiveAlbum(null);
  const prev = () => setActiveIndex((i) => (allMedia.length ? (i - 1 + allMedia.length) % allMedia.length : 0));
  const next = () => setActiveIndex((i) => (allMedia.length ? (i + 1) % allMedia.length : 0));

  return (
    <div className="min-w-0 overflow-x-hidden bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
            <Icon name="photo" className="h-4 w-4" />
            Gallery
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Photos & Media
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Highlights from events, trainings, workshops, and association activities.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <p className="mt-4 text-slate-500">Loading…</p>
        ) : albums.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">No albums yet</p>
            <p className="mt-2 text-slate-600">Add albums and media in Django Admin → Website → Gallery.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} onOpenMedia={openMedia} />
            ))}
          </div>
        )}
      </section>

      {activeAlbum && allMedia.length > 0 && (
        <Lightbox items={allMedia} index={activeIndex} onClose={closeMedia} onPrev={prev} onNext={next} />
      )}
    </div>
  );
}

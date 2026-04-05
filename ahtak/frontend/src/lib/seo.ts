const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://ahttak.or.ke").replace(/\/$/, "");

const DEFAULT_TITLE = "AHTTAK | Animal Health Technicians and Technologists Association";
const DEFAULT_DESCRIPTION =
  "Official AHTTAK website for membership, events, professional resources, news, and member services in Kenya.";
const DEFAULT_IMAGE = `${SITE_URL}/static/ahtklogo.png`;

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function setSeo(opts: {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
}) {
  if (typeof document === "undefined") return;
  const title = opts.title?.trim() || DEFAULT_TITLE;
  const description = opts.description?.trim() || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${opts.path || "/"}`;
  const image = opts.image || DEFAULT_IMAGE;
  const robots = opts.noindex ? "noindex, nofollow" : "index, follow";

  document.title = title;
  upsertMeta("name", "description", description);
  if (opts.keywords) upsertMeta("name", "keywords", opts.keywords);
  upsertMeta("name", "robots", robots);

  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:site_name", "AHTTAK");

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", image);

  upsertLink("canonical", url);
}

export const seoDefaults = {
  siteUrl: SITE_URL,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
};

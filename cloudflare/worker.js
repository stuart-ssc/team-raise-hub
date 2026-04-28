/**
 * Sponsorly social-share prerender Worker
 * ----------------------------------------
 * Runs on the Cloudflare zone for sponsorly.io. For real users it is a pure
 * passthrough (zero perf impact). For social-media crawlers it fetches
 * per-page metadata from the `get-page-meta` Supabase Edge Function and
 * rewrites the <title>, description, canonical, Open Graph, and Twitter
 * Card tags inside index.html before returning the response.
 *
 * Deploy instructions: see cloudflare/README.md
 */

const ORIGIN = "https://sponsorly.io";
const META_ENDPOINT =
  "https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/get-page-meta";

// Lower-cased substrings. If the request UA contains any of these we treat
// the request as a crawler and serve rewritten HTML.
const CRAWLER_UA_FRAGMENTS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "slack-imgproxy",
  "discordbot",
  "whatsapp",
  "telegrambot",
  "applebot",
  "pinterest",
  "redditbot",
  "embedly",
  "quora link preview",
  "skypeuripreview",
  "vkshare",
  "w3c_validator",
  "googlebot",
  "bingbot",
  "yandexbot",
  "duckduckbot",
  "baiduspider",
  "ia_archiver",
  "msnbot",
];

function isCrawler(ua) {
  if (!ua) return false;
  const u = ua.toLowerCase();
  return CRAWLER_UA_FRAGMENTS.some((f) => u.includes(f));
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Replace tags in <head> with per-page meta. Strategy: strip any existing
 * og:*, twitter:*, description, canonical, and <title> tags, then inject a
 * fresh block right before </head>.
 */
function rewriteHtml(html, meta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const image = escapeHtml(meta.image);
  const imageAlt = escapeHtml(meta.image_alt || meta.title);
  const siteName = escapeHtml(meta.site_name || "Sponsorly");
  const fbAppId = escapeHtml(meta.fb_app_id || "");

  // Remove existing tags we will replace.
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta[^>]+property=["']fb:app_id["'][^>]*>/gi, "");

  const block = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${imageAlt}" />
    ${fbAppId ? `<meta property="fb:app_id" content="${fbAppId}" />` : ""}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@sponsorly_io" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />
  `;

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${block}</head>`);
  } else {
    out = block + out;
  }
  return out;
}

async function fetchMeta(path) {
  const url = `${META_ENDPOINT}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`meta fetch failed ${res.status}`);
  return await res.json();
}

async function fetchOriginHtml(request) {
  // Fetch the SPA shell from origin. We deliberately request "/" so we get
  // the unmodified index.html regardless of the requested path.
  const shellRequest = new Request(`${ORIGIN}/`, {
    headers: { "User-Agent": "SponsorlySocialMetaWorker/1.0" },
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  const res = await fetch(shellRequest);
  if (!res.ok) throw new Error(`origin fetch failed ${res.status}`);
  return await res.text();
}

export default {
  async fetch(request) {
    const ua = request.headers.get("User-Agent") || "";
    const url = new URL(request.url);

    // Always passthrough non-GET, asset paths, edge function calls, and
    // anything with a file extension (images, css, js, sitemaps, etc.).
    const isAsset =
      /\.[a-z0-9]{2,5}$/i.test(url.pathname) ||
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/lovable-uploads/") ||
      url.pathname.startsWith("/functions/") ||
      url.pathname.startsWith("/rest/") ||
      url.pathname.startsWith("/auth/") ||
      url.pathname.startsWith("/storage/");

    if (request.method !== "GET" || isAsset || !isCrawler(ua)) {
      return fetch(request);
    }

    try {
      const path = url.pathname + (url.search || "");
      const [meta, html] = await Promise.all([
        fetchMeta(url.pathname),
        fetchOriginHtml(request),
      ]);
      const rewritten = rewriteHtml(html, meta);
      return new Response(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "X-Sponsorly-Prerender": "crawler",
        },
      });
    } catch (err) {
      // On any failure, fall back to the unmodified origin response so we
      // never break a crawler with a 5xx.
      return fetch(request);
    }
  },
};
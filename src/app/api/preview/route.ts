// API : extrait les Open Graph d'une URL (image, titre, description)
// Détecte automatiquement le format Instagram/TikTok/YouTube et utilise
// les oEmbed APIs officielles quand disponible (TikTok, YouTube)

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
  format: "REEL" | "POST" | "CAROUSEL" | "STORY" | "LIVE" | "OTHER";
  detected_platform: "instagram" | "tiktok" | "youtube" | "x" | "other";
  hashtags: string[];
}

function detectFormat(url: string): PreviewData["format"] {
  const u = url.toLowerCase();
  if (u.includes("/reel/") || u.includes("/reels/") || u.includes("/shorts/")) return "REEL";
  if (u.includes("/p/")) return "POST";
  if (u.includes("/stories/")) return "STORY";
  if (u.includes("/tv/") || u.includes("/live/")) return "LIVE";
  if (u.includes("/carousel/")) return "CAROUSEL";
  // TikTok video URLs : /@user/video/123
  if (u.includes("tiktok.com") && u.includes("/video/")) return "REEL";
  // YouTube standard videos = REEL bucket pour simplifier (catégorisation par utilisateur sinon)
  if (u.includes("youtube.com/watch") || u.includes("youtu.be/")) return "OTHER";
  return "OTHER";
}

function detectPlatform(url: string): PreviewData["detected_platform"] {
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("twitter.com") || u.includes("x.com")) return "x";
  return "other";
}

function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/#[\p{L}0-9_]+/gu);
  return matches ? matches.map((h) => h.slice(1)) : [];
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function getMeta(html: string, attr: string, value: string): string | null {
  const regex = new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']`, "i");
  const m1 = html.match(regex);
  if (m1) return decodeEntities(m1[1]);
  const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`, "i");
  const m2 = html.match(regex2);
  if (m2) return decodeEntities(m2[1]);
  return null;
}

async function tiktokPreview(url: string): Promise<PreviewData | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
      author_name?: string;
      author_url?: string;
      provider_name?: string;
    };
    if (!data.thumbnail_url && !data.title) return null;
    return {
      url,
      title: data.title || data.author_name || null,
      description: data.author_name ? `Par ${data.author_name}` : null,
      image: data.thumbnail_url ?? null,
      site_name: data.provider_name ?? "TikTok",
      format: detectFormat(url),
      detected_platform: "tiktok",
      hashtags: extractHashtags(data.title),
    };
  } catch {
    return null;
  }
}

async function youtubePreview(url: string): Promise<PreviewData | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
      author_name?: string;
      provider_name?: string;
    };
    return {
      url,
      title: data.title ?? null,
      description: data.author_name ? `Par ${data.author_name}` : null,
      image: data.thumbnail_url ?? null,
      site_name: data.provider_name ?? "YouTube",
      format: detectFormat(url),
      detected_platform: "youtube",
      hashtags: extractHashtags(data.title),
    };
  } catch {
    return null;
  }
}

async function htmlPreview(url: string, platform: PreviewData["detected_platform"]): Promise<PreviewData | null> {
  try {
    // User agent : iPhone Safari → meilleur pour Instagram/TikTok que Chrome desktop
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    const title =
      getMeta(html, "property", "og:title") ||
      getMeta(html, "name", "twitter:title") ||
      (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null);

    const description =
      getMeta(html, "property", "og:description") ||
      getMeta(html, "name", "twitter:description") ||
      getMeta(html, "name", "description");

    const image =
      getMeta(html, "property", "og:image") ||
      getMeta(html, "property", "og:image:secure_url") ||
      getMeta(html, "name", "twitter:image") ||
      // Instagram : parfois <meta property="og:image" content="..."> est dynamique
      // → fallback : tenter de trouver une image dans le HTML (display_url, etc.)
      extractInstagramImage(html);

    const site_name = getMeta(html, "property", "og:site_name");

    if (!title && !image) return null;

    return {
      url,
      title: title ? decodeEntities(title).trim() : null,
      description: description ? decodeEntities(description).trim() : null,
      image,
      site_name,
      format: detectFormat(url),
      detected_platform: platform,
      hashtags: extractHashtags(description),
    };
  } catch {
    return null;
  }
}

function extractInstagramImage(html: string): string | null {
  // Try to find display_url in JSON-LD or inline scripts
  const m1 = html.match(/"display_url":"([^"]+)"/);
  if (m1) {
    return m1[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
  }
  const m2 = html.match(/"thumbnail_url":"([^"]+)"/);
  if (m2) {
    return m2[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
  }
  return null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Paramètre 'url' manquant" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  const platform = detectPlatform(url);

  // 1) Routes spécialisées (oEmbed) en priorité
  let preview: PreviewData | null = null;
  if (platform === "tiktok") {
    preview = await tiktokPreview(url);
  } else if (platform === "youtube") {
    preview = await youtubePreview(url);
  }

  // 2) Fallback HTML scraping (Instagram + autres)
  if (!preview) {
    preview = await htmlPreview(url, platform);
  }

  if (!preview) {
    // 3) Dernier recours : retourner les infos minimales détectées
    return NextResponse.json({
      url,
      title: null,
      description: null,
      image: null,
      site_name: null,
      format: detectFormat(url),
      detected_platform: platform,
      hashtags: [],
    } satisfies PreviewData, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json(preview, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}

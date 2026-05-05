// API : extrait les Open Graph d'une URL (image, titre, description)
// Détecte automatiquement le format Instagram (Reel, Post, Carousel, Story)

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

function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[\p{L}0-9_]+/gu);
  return matches ? matches.map((h) => h.slice(1)) : [];
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

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
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

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EditorialCalendar/1.0; +https://calendar-demonio.vercel.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Page inaccessible (HTTP ${res.status})` }, { status: 502 });
    }

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
      getMeta(html, "name", "twitter:image");

    const site_name = getMeta(html, "property", "og:site_name");

    const data: PreviewData = {
      url,
      title: title ? decodeEntities(title).trim() : null,
      description: description ? decodeEntities(description).trim() : null,
      image,
      site_name,
      format: detectFormat(url),
      detected_platform: detectPlatform(url),
      hashtags: extractHashtags(description ?? ""),
    };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur fetch" },
      { status: 500 }
    );
  }
}

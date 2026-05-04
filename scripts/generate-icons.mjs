import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SVG_PATH = join(ROOT, "public/icon.svg");
const OUT_DIR = join(ROOT, "public/icons");

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const BADGE_SIZE = 72;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const svg = await readFile(SVG_PATH);

  for (const size of SIZES) {
    const out = join(OUT_DIR, `icon-${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log(`✓ ${out}`);
  }

  // Apple touch icon
  await sharp(svg).resize(180, 180).png().toFile(join(ROOT, "public/apple-touch-icon.png"));
  console.log(`✓ apple-touch-icon.png`);

  // Favicon
  await sharp(svg).resize(32, 32).png().toFile(join(ROOT, "public/favicon-32.png"));
  await sharp(svg).resize(16, 16).png().toFile(join(ROOT, "public/favicon-16.png"));
  console.log(`✓ favicons`);

  // Badge (monochrome white on transparent)
  const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72">
    <circle cx="36" cy="36" r="32" fill="#ffffff"/>
    <text x="36" y="48" font-family="Arial Black,sans-serif" font-size="40" font-weight="900" text-anchor="middle" fill="#7c3aed">E</text>
  </svg>`;
  await sharp(Buffer.from(badgeSvg)).resize(BADGE_SIZE, BADGE_SIZE).png().toFile(join(OUT_DIR, "badge-72.png"));
  console.log(`✓ badge-72.png`);

  // OG image (1200x630)
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0d0a14"/>
        <stop offset="100%" stop-color="#1a0d2e"/>
      </linearGradient>
      <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#7c3aed"/>
        <stop offset="50%" stop-color="#d946ef"/>
        <stop offset="100%" stop-color="#f97316"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <text x="80" y="200" font-family="-apple-system,sans-serif" font-size="76" font-weight="900" fill="#ffffff">Editorial Calendar</text>
    <text x="80" y="280" font-family="-apple-system,sans-serif" font-size="42" font-weight="700" fill="url(#brand)">SKOOL Funnel · 8 semaines</text>
    <text x="80" y="380" font-family="-apple-system,sans-serif" font-size="28" font-weight="500" fill="#a5a5b8">Planifie ta stratégie d'acquisition Instagram → SKOOL.</text>
    <text x="80" y="420" font-family="-apple-system,sans-serif" font-size="28" font-weight="500" fill="#a5a5b8">Calendrier interactif · Notifs · Templates · Analytics.</text>
  </svg>`;
  await sharp(Buffer.from(ogSvg)).png().toFile(join(ROOT, "public/og-image.png"));
  console.log(`✓ og-image.png`);

  console.log("\n🎨 Toutes les icônes générées avec succès.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

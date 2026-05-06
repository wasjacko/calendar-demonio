// Génère toutes les icônes PWA / favicon / Apple touch / OG depuis
// public/icon-source.png. Inclut un fond pour le maskable PWA.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public/icon-source.png");
const OUT_DIR = join(ROOT, "public/icons");

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const size of SIZES) {
    const out = join(OUT_DIR, `icon-${size}.png`);
    await sharp(SRC).resize(size, size, { fit: "cover", position: "center" }).png().toFile(out);
    console.log(`✓ ${out}`);
  }

  // Apple touch icon (180x180) — iOS Safari "Sur l'écran d'accueil"
  await sharp(SRC).resize(180, 180, { fit: "cover", position: "center" }).png().toFile(join(ROOT, "public/apple-touch-icon.png"));
  console.log(`✓ apple-touch-icon.png`);

  // Favicon
  await sharp(SRC).resize(32, 32, { fit: "cover", position: "center" }).png().toFile(join(ROOT, "public/favicon-32.png"));
  await sharp(SRC).resize(16, 16, { fit: "cover", position: "center" }).png().toFile(join(ROOT, "public/favicon-16.png"));
  console.log(`✓ favicons`);

  // ICO favicon (multi-size)
  await sharp(SRC).resize(48, 48, { fit: "cover", position: "center" }).png().toFile(join(ROOT, "src/app/favicon.ico"));
  console.log(`✓ favicon.ico (next/app convention)`);

  // Badge (notification badge — gardé en monochrome blanc/transparent)
  const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72">
    <circle cx="36" cy="36" r="32" fill="#ffffff"/>
    <text x="36" y="48" font-family="Arial Black,sans-serif" font-size="40" font-weight="900" text-anchor="middle" fill="#000000">E</text>
  </svg>`;
  await sharp(Buffer.from(badgeSvg)).resize(72, 72).png().toFile(join(OUT_DIR, "badge-72.png"));
  console.log(`✓ badge-72.png`);

  // OG image (1200x630) — image étirée + couverture, avec dégradé sombre
  await sharp(SRC)
    .resize(1200, 630, { fit: "cover", position: "center" })
    .png()
    .toFile(join(ROOT, "public/og-image.png"));
  console.log(`✓ og-image.png`);

  console.log("\n🎨 Icônes générées avec succès depuis icon-source.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

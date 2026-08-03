// Generate PWA icons from scripts/icon.svg into public/icons/.
// Usage: npm run gen:icons
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, "public", "icons");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  await mkdir(outDir, { recursive: true });
  const svg = await readFile(join(here, "icon.svg"));

  for (const size of sizes) {
    // Standard (any) icon
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(outDir, `icon-${size}.png`));
  }

  // Maskable icons: add ~20% safe-zone padding on a solid background.
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.8);
    const pad = Math.round((size - inner) / 2);
    const resized = await sharp(svg).resize(inner, inner).png().toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 234, g: 88, b: 12, alpha: 1 }, // brand-600
      },
    })
      .composite([{ input: resized, top: pad, left: pad }])
      .png()
      .toFile(join(outDir, `maskable-${size}.png`));
  }

  // Apple touch icon
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(join(outDir, "apple-touch-icon.png"));

  // Favicon (32)
  await sharp(svg)
    .resize(32, 32)
    .png()
    .toFile(join(root, "public", "favicon.ico"));

  console.log(`Generated ${sizes.length + 3} icons in public/icons/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

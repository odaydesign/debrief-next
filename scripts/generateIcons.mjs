/**
 * Generate the PWA icon set from inline SVG artwork.
 *
 * The mark is "a brief": a kicker line in the accent green over two serif-
 * weight headline bars and a muted dek line — geometry only, no fonts, so
 * rasterization is deterministic everywhere.
 *
 * Run once (then commit the PNGs):  node scripts/generateIcons.mjs
 */

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "icons");

const BG = "#26231f"; // ink --bg
const INK = "#f3efe6"; // ink --ink
const ACCENT = "#50c878"; // ink --accent

// scale: how much of the canvas the mark occupies (maskable needs ≤ ~65%).
// rounded: corner radius on the background (0 for maskable/apple full-bleed).
const artwork = ({ rounded, scale }) => {
  // Mark drawn in a 280×240 box, centered on the 512 canvas and scaled so it
  // spans `scale` of the canvas width.
  const k = (512 * scale) / 280;
  const m = (w, h, yy, fill, opacity = 1) =>
    `<rect x="${(280 - w) / 2}" y="${yy}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="${opacity}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rounded}" fill="${BG}"/>
  <g transform="translate(256 256) scale(${k.toFixed(4)}) translate(-140 -120)">
    ${m(116, 26, 0, ACCENT)}
    ${m(280, 46, 62, INK)}
    ${m(218, 46, 132, INK)}
    ${m(164, 24, 216, INK, 0.38)}
  </g>
</svg>`;
};

const regular = artwork({ rounded: 104, scale: 0.66 });
const fullBleed = artwork({ rounded: 0, scale: 0.56 });

const render = (svg, size, file) =>
  sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "debrief-icon.svg"), regular);

await render(regular, 192, path.join(outDir, "icon-192.png"));
await render(regular, 512, path.join(outDir, "icon-512.png"));
await render(fullBleed, 192, path.join(outDir, "maskable-192.png"));
await render(fullBleed, 512, path.join(outDir, "maskable-512.png"));
// app/apple-icon.png is auto-linked by Next as apple-touch-icon.
await render(fullBleed, 180, path.join(root, "app", "apple-icon.png"));

console.log("Icons written to public/icons/ and app/apple-icon.png");

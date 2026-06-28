/**
 * Genera los íconos PWA de Ruzosky (mark: edificio en burdeo).
 * Uso: node scripts/gen-icons.mjs
 * Salida: public/icons/icon-192.png, icon-512.png, icon-maskable-512.png
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const BURG = "#7c1d3f";
const OUT = "public/icons";

/** SVG 512×512: fondo burdeo redondeado + edificio blanco con ventanas caladas. */
function svg({ contentScale = 1, radius = 110 } = {}) {
  const k = contentScale;
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="${radius}" fill="${BURG}"/>
  <g transform="translate(256,256) scale(${k}) translate(-256,-256)">
    <path d="M136 200 L256 104 L376 200 Z" fill="#ffffff"/>
    <rect x="158" y="198" width="196" height="210" rx="12" fill="#ffffff"/>
    <rect x="190" y="232" width="42" height="42" rx="7" fill="${BURG}"/>
    <rect x="280" y="232" width="42" height="42" rx="7" fill="${BURG}"/>
    <rect x="190" y="300" width="42" height="42" rx="7" fill="${BURG}"/>
    <rect x="280" y="300" width="42" height="42" rx="7" fill="${BURG}"/>
    <rect x="232" y="360" width="48" height="48" rx="6" fill="${BURG}"/>
  </g>
</svg>`;
}

async function render(svgStr, size, file) {
  await sharp(Buffer.from(svgStr)).resize(size, size).png().toFile(`${OUT}/${file}`);
  console.log(`✓ ${file} (${size}px)`);
}

await mkdir(OUT, { recursive: true });
const normal = svg({ contentScale: 1 });
// Maskable: contenido más chico dentro de la zona segura (~80%).
const maskable = svg({ contentScale: 0.72 });

await render(normal, 512, "icon-512.png");
await render(normal, 192, "icon-192.png");
await render(maskable, 512, "icon-maskable-512.png");
console.log("Íconos generados en", OUT);

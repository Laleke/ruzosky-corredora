"use client";

/**
 * Gráficos SVG propios (barras, líneas, pie/donut, barras agrupadas).
 * Sin dependencias externas: control total, theme-aware, cero conflictos de
 * peer-deps con React 19. Responsivos vía viewBox + width 100%.
 */

export const PALETA = [
  "#7f1d1d", // burdeo
  "#b45309", // ámbar
  "#1e3a5f", // grafito azulado
  "#3f6212", // verde
  "#6d28d9", // violeta
  "#0e7490", // cian
  "#9f1239", // rosa oscuro
  "#525252", // gris
];

function clpCompacto(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function Vacio({ alto = 220 }: { alto?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-line text-sm text-muted"
      style={{ height: alto }}
    >
      Sin datos en el período.
    </div>
  );
}

/* ---------------- Barras (una serie) ---------------- */
export function BarChart({
  labels,
  valores,
  color = PALETA[0],
}: {
  labels: string[];
  valores: number[];
  color?: string;
}) {
  const max = Math.max(...valores, 0);
  if (max <= 0) return <Vacio />;
  const W = 640;
  const H = 240;
  const padX = 34;
  const padB = 28;
  const padT = 12;
  const n = valores.length;
  const bw = (W - padX) / n;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {[0, 0.5, 1].map((t) => {
        const y = padT + (H - padT - padB) * (1 - t);
        return (
          <g key={t}>
            <line x1={padX} y1={y} x2={W} y2={y} stroke="#e7e5e4" strokeWidth={1} />
            <text x={0} y={y + 3} fontSize={9} fill="#78716c">
              {clpCompacto(max * t)}
            </text>
          </g>
        );
      })}
      {valores.map((v, i) => {
        const h = ((H - padT - padB) * v) / max;
        const x = padX + i * bw + bw * 0.15;
        const y = H - padB - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw * 0.7} height={h} fill={color} rx={2}>
              <title>{`${labels[i]}: ${Math.round(v).toLocaleString("es-CL")}`}</title>
            </rect>
            <text
              x={padX + i * bw + bw / 2}
              y={H - padB + 14}
              fontSize={9}
              fill="#78716c"
              textAnchor="middle"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- Líneas (multi-serie) ---------------- */
export function LineChart({
  labels,
  series,
}: {
  labels: string[];
  series: { nombre: string; valores: number[]; color?: string }[];
}) {
  const todos = series.flatMap((s) => s.valores);
  const max = Math.max(...todos, 0);
  if (max <= 0) return <Vacio />;
  const W = 640;
  const H = 240;
  const padX = 34;
  const padB = 28;
  const padT = 12;
  const n = labels.length;
  const step = (W - padX) / Math.max(1, n - 1);
  const py = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const px = (i: number) => padX + i * step;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {[0, 0.5, 1].map((t) => {
          const y = padT + (H - padT - padB) * (1 - t);
          return (
            <g key={t}>
              <line x1={padX} y1={y} x2={W} y2={y} stroke="#e7e5e4" strokeWidth={1} />
              <text x={0} y={y + 3} fontSize={9} fill="#78716c">
                {clpCompacto(max * t)}
              </text>
            </g>
          );
        })}
        {labels.map((l, i) => (
          <text
            key={i}
            x={px(i)}
            y={H - padB + 14}
            fontSize={9}
            fill="#78716c"
            textAnchor="middle"
          >
            {l}
          </text>
        ))}
        {series.map((s, si) => {
          const color = s.color ?? PALETA[si % PALETA.length];
          const d = s.valores
            .map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`)
            .join(" ");
          return (
            <g key={si}>
              <path d={d} fill="none" stroke={color} strokeWidth={2} />
              {s.valores.map((v, i) => (
                <circle key={i} cx={px(i)} cy={py(v)} r={2.5} fill={color}>
                  <title>{`${s.nombre} · ${labels[i]}: ${Math.round(v).toLocaleString("es-CL")}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <Leyenda
        items={series.map((s, i) => ({
          label: s.nombre,
          color: s.color ?? PALETA[i % PALETA.length],
        }))}
      />
    </div>
  );
}

/* ---------------- Pie / Donut ---------------- */
export function PieChart({
  data,
}: {
  data: { label: string; valor: number }[];
}) {
  const total = data.reduce((a, d) => a + d.valor, 0);
  if (total <= 0) return <Vacio />;
  const R = 80;
  const r = 46;
  const cx = 100;
  const cy = 100;
  let acc = 0;
  const arcos = data.map((d, i) => {
    const frac = d.valor / total;
    const a0 = acc * 2 * Math.PI - Math.PI / 2;
    acc += frac;
    const a1 = acc * 2 * Math.PI - Math.PI / 2;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + R * Math.cos(a0);
    const y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1);
    const y1 = cy + R * Math.sin(a1);
    const xi1 = cx + r * Math.cos(a1);
    const yi1 = cy + r * Math.sin(a1);
    const xi0 = cx + r * Math.cos(a0);
    const yi0 = cy + r * Math.sin(a0);
    const d2 = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${r} ${r} 0 ${large} 0 ${xi0} ${yi0} Z`;
    return { d: d2, color: PALETA[i % PALETA.length], label: d.label, valor: d.valor };
  });

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <svg viewBox="0 0 200 200" className="h-48 w-48 shrink-0" role="img">
        {arcos.map((a, i) => (
          <path key={i} d={a.d} fill={a.color}>
            <title>{`${a.label}: ${Math.round(a.valor).toLocaleString("es-CL")}`}</title>
          </path>
        ))}
      </svg>
      <Leyenda
        items={arcos.map((a) => ({
          label: `${a.label} · ${Math.round((a.valor / total) * 100)}%`,
          color: a.color,
        }))}
        columna
      />
    </div>
  );
}

/* ---------------- Barras agrupadas ---------------- */
export function GroupedBars({
  grupos,
  series,
}: {
  grupos: string[];
  series: { nombre: string; valores: number[]; color?: string }[];
}) {
  const max = Math.max(...series.flatMap((s) => s.valores), 0);
  if (max <= 0) return <Vacio />;
  const W = 640;
  const H = 240;
  const padX = 34;
  const padB = 28;
  const padT = 12;
  const gw = (W - padX) / grupos.length;
  const bw = (gw * 0.7) / series.length;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {[0, 0.5, 1].map((t) => {
          const y = padT + (H - padT - padB) * (1 - t);
          return (
            <g key={t}>
              <line x1={padX} y1={y} x2={W} y2={y} stroke="#e7e5e4" strokeWidth={1} />
              <text x={0} y={y + 3} fontSize={9} fill="#78716c">
                {clpCompacto(max * t)}
              </text>
            </g>
          );
        })}
        {grupos.map((g, gi) => (
          <g key={gi}>
            {series.map((s, si) => {
              const v = s.valores[gi] ?? 0;
              const h = ((H - padT - padB) * v) / max;
              const x = padX + gi * gw + gw * 0.15 + si * bw;
              const y = H - padB - h;
              const color = s.color ?? PALETA[si % PALETA.length];
              return (
                <rect key={si} x={x} y={y} width={bw * 0.9} height={h} fill={color} rx={2}>
                  <title>{`${g} · ${s.nombre}: ${Math.round(v).toLocaleString("es-CL")}`}</title>
                </rect>
              );
            })}
            <text
              x={padX + gi * gw + gw / 2}
              y={H - padB + 14}
              fontSize={10}
              fill="#78716c"
              textAnchor="middle"
            >
              {g}
            </text>
          </g>
        ))}
      </svg>
      <Leyenda
        items={series.map((s, i) => ({
          label: s.nombre,
          color: s.color ?? PALETA[i % PALETA.length],
        }))}
      />
    </div>
  );
}

function Leyenda({
  items,
  columna = false,
}: {
  items: { label: string; color: string }[];
  columna?: boolean;
}) {
  return (
    <ul
      className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted ${
        columna ? "sm:flex-col" : ""
      }`}
    >
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

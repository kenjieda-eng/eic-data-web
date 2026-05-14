import Link from "next/link";
import {
  computeSparklinePath,
  formatDelta,
  formatDeltaPct,
  WATCH_CATEGORY_COLORS,
  type Kpi,
} from "@/lib/watch-data";

const DELTA_COLORS = {
  "+": { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  "-": { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
  "0": { text: "text-faint", bg: "bg-slate-50", border: "border-slate-200" },
} as const;

const SPARK_W = 140;
const SPARK_H = 32;

function formatValue(v: number | null, digits = 2): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("ja-JP", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

/**
 * /watch の 12 KPI を 1 枚ずつ表示する Server Component カード。
 * inline SVG sparkline + 直近値 + 前期比 を 1 枚に集約。
 * 派生指標 (derived:xxx) は catalog リンクなし、それ以外は /catalog/<id> へリンク。
 */
export default function KpiCard({ kpi }: { kpi: Kpi }) {
  const categoryColor = WATCH_CATEGORY_COLORS[kpi.category];
  const deltaSign = formatDelta(kpi.delta).sign;
  const deltaPctFmt = formatDeltaPct(kpi.deltaPct);
  const deltaPalette = DELTA_COLORS[deltaSign];

  const spark = computeSparklinePath(kpi.sparkline, SPARK_W, SPARK_H);
  const isDerived = kpi.id.startsWith("derived:");

  const titleNode = (
    <>
      <span className="text-[12px] font-semibold text-ink leading-tight">
        {kpi.label}
      </span>
      <span className="ml-1 text-[10px] text-faint">{kpi.unit}</span>
    </>
  );

  return (
    <article
      className="rounded-md border bg-white p-3 transition hover:shadow-sm"
      style={{ borderLeft: `3px solid ${categoryColor}` }}
      aria-label={`${kpi.label} の KPI カード`}
    >
      {/* ラベル + カテゴリ */}
      <header className="flex items-center justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1 truncate">
          {isDerived ? (
            <div className="truncate" title={kpi.label}>
              {titleNode}
            </div>
          ) : (
            <Link
              href={`/catalog/${kpi.id}`}
              className="truncate hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              title={kpi.label}
            >
              {titleNode}
            </Link>
          )}
        </div>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
          style={{ color: categoryColor, backgroundColor: `${categoryColor}14` }}
          aria-hidden
        >
          {kpi.category}
        </span>
      </header>

      {/* 値 + 前期比 */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-xl md:text-2xl font-bold tabular-nums text-ink leading-tight">
            {kpi.last ? formatValue(kpi.last.value) : "—"}
          </div>
          {kpi.last && (
            <div className="text-[10px] text-faint mt-0.5">
              as-of {kpi.last.date.slice(0, 10)}
            </div>
          )}
        </div>
        <div
          className={`rounded border px-1.5 py-0.5 text-[11px] tabular-nums ${deltaPalette.text} ${deltaPalette.bg} ${deltaPalette.border}`}
          aria-label={`前期比 ${deltaPctFmt.text}`}
        >
          {deltaPctFmt.text}
        </div>
      </div>

      {/* sparkline */}
      <div className="mt-2">
        {kpi.sparkline.length >= 2 ? (
          <svg
            viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
            width="100%"
            height={SPARK_H}
            preserveAspectRatio="none"
            role="img"
            aria-label={`${kpi.label} 直近 ${kpi.sparkline.length} 点 sparkline`}
            style={{ display: "block" }}
          >
            <path
              d={spark.path}
              fill="none"
              stroke={categoryColor}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {spark.lastX !== null && spark.lastY !== null && (
              <circle
                cx={spark.lastX}
                cy={spark.lastY}
                r={2.2}
                fill={categoryColor}
              />
            )}
          </svg>
        ) : (
          <div className="text-[10px] text-faint">sparkline データ不足</div>
        )}
      </div>

      {/* 出典 */}
      {kpi.source && (
        <div className="mt-2 text-[10px] text-faint truncate">
          出典:{" "}
          <a
            href={kpi.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            {kpi.source.name}
          </a>
        </div>
      )}
    </article>
  );
}

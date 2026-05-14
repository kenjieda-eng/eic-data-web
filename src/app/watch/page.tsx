import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import KpiCard from "@/components/KpiCard";
import { fetchCatalog, type Indicator } from "@/lib/catalog";
import { fetchSeries } from "@/lib/series";
import {
  averageSeries,
  buildKpi,
  WATCH_CATEGORY_COLORS,
  WATCH_KPIS,
  type Kpi,
  type WatchKpiDef,
} from "@/lib/watch-data";

export const metadata: Metadata = {
  title: "マーケットビュー — EIC Data",
  description:
    "12 主要 KPI を 1 ページで俯瞰。JEPX 9 エリア (5 + 全国平均) / LNG-JP CIF / Brent / USD/JPY / JGB 10y / 販売電力量 / 太陽光発電量 — 直近値 + 前期比 + 7 点 sparkline を SSG で配信。",
};

export const revalidate = 86400;

/** Server-side で 1 系列を SSG 時に fetch (派生指標を含む) */
async function loadKpi(
  def: WatchKpiDef,
  catalog: { indicators: Indicator[] },
): Promise<Kpi> {
  if (def.derivedFrom && def.derivedFrom.length > 0) {
    // 派生指標: 構成 series を全部 fetch して averageSeries
    const sub = await Promise.all(
      def.derivedFrom.map(async (id) => {
        const r = await fetchSeries(id);
        return { id, points: r.points, meta: r.meta };
      }),
    );
    const avgPoints = averageSeries(
      sub.map(({ id, points }) => ({ id, points })),
    );
    // 出典は構成 series の最初のものから流用 (JEPX 9 エリアは同じ source)
    const firstMeta = sub[0]?.meta;
    return buildKpi({
      def,
      points: avgPoints,
      unit: def.unitOverride ?? firstMeta?.unit ?? "",
      sourceName: firstMeta?.source_name,
      sourceUrl: firstMeta?.source_url,
      observationCutoff: firstMeta?.observation_cutoff,
    });
  }

  // 通常: catalog の単一指標
  const indicator = catalog.indicators.find((i) => i.id === def.id);
  if (!indicator) {
    return buildKpi({
      def,
      points: [],
      unit: def.unitOverride ?? "",
    });
  }
  try {
    const r = await fetchSeries(def.id);
    return buildKpi({
      def,
      points: r.points,
      unit: def.unitOverride ?? r.meta.unit,
      sourceName: r.meta.source_name,
      sourceUrl: r.meta.source_url,
      observationCutoff: r.meta.observation_cutoff,
    });
  } catch {
    // 個別系列の取得失敗は他系列を落とさず、空 KPI を返す
    return buildKpi({
      def,
      points: [],
      unit: def.unitOverride ?? indicator.unit,
      sourceName: indicator.source_name,
      sourceUrl: indicator.source_url,
      observationCutoff: indicator.observation_cutoff,
    });
  }
}

/** イベントログ: 12 KPI のうち observation_cutoff が直近 7 日のものを列挙 */
function buildEventLog(kpis: Kpi[]): {
  id: string;
  label: string;
  date: string;
  value: number | null;
  delta: number | null;
}[] {
  const rows = kpis
    .filter((k) => k.last !== null)
    .map((k) => ({
      id: k.id,
      label: k.label,
      date: k.last!.date,
      value: k.last!.value,
      delta: k.delta,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return rows.slice(0, 12);
}

export default async function WatchPage() {
  const catalog = await fetchCatalog();

  const kpis = await Promise.all(WATCH_KPIS.map((def) => loadKpi(def, catalog)));
  const eventLog = buildEventLog(kpis);

  // 最終更新時刻 = 12 KPI のうち最も新しい observation_cutoff
  const latestCutoff = kpis
    .map((k) => k.observationCutoff)
    .filter((d): d is string => !!d)
    .sort()
    .pop();

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ マーケットビュー"}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-ink leading-tight">
          マーケットビュー ／{" "}
          <code className="text-emerald-700">/watch</code>
        </h1>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          エネルギーと金融の{" "}
          <strong className="text-ink tabular-nums">12</strong>{" "}
          主要 KPI を 1 ページで俯瞰。各カードに直近値・前期比・直近 7 点 sparkline・出典を集約。
          {latestCutoff && (
            <span className="ml-1">
              最終観測 <span className="font-mono text-ink">{latestCutoff}</span>
            </span>
          )}
          。SSG (1 日 ISR) で配信。
        </p>
      </header>

      {/* カテゴリ凡例 */}
      <div className="mb-4 flex flex-wrap gap-3 text-[11px]">
        {(["電力", "燃料", "金融", "需要・電源"] as const).map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: WATCH_CATEGORY_COLORS[c] }}
              aria-hidden
            />
            <span className="text-subink">{c}</span>
          </span>
        ))}
      </div>

      {/* 12 KPI グリッド (sm 2 / md 3 / lg 4 列) */}
      <section
        aria-label="12 主要 KPI"
        className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </section>

      {/* イベントログ */}
      <section
        aria-label="観測イベントログ"
        className="mt-8 rounded-md border border-slate-200 bg-white p-4"
      >
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-faint mb-2">
          直近の観測ログ (as-of 降順)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[12px] tabular-nums">
            <thead className="bg-slate-50 text-faint uppercase text-[10px]">
              <tr>
                <th className="px-2 py-1.5 text-left">as-of</th>
                <th className="px-2 py-1.5 text-left">KPI</th>
                <th className="px-2 py-1.5 text-right">値</th>
                <th className="px-2 py-1.5 text-right">前期差</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eventLog.map((e) => (
                <tr key={e.id}>
                  <td className="px-2 py-1.5 font-mono text-faint">
                    {e.date.slice(0, 10)}
                  </td>
                  <td className="px-2 py-1.5">
                    {e.id.startsWith("derived:") ? (
                      <span>{e.label}</span>
                    ) : (
                      <Link
                        href={`/catalog/${e.id}`}
                        className="text-emerald-700 underline hover:text-emerald-900"
                      >
                        {e.label}
                      </Link>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {e.value !== null
                      ? e.value.toLocaleString("ja-JP", {
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-right ${
                      e.delta === null
                        ? "text-faint"
                        : e.delta > 0
                          ? "text-emerald-700"
                          : e.delta < 0
                            ? "text-rose-700"
                            : "text-faint"
                    }`}
                  >
                    {e.delta === null
                      ? "—"
                      : (e.delta > 0 ? "+" : "") +
                        e.delta.toLocaleString("ja-JP", {
                          maximumFractionDigits: 2,
                        })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-faint">
          系列の頻度は混在 (daily / monthly)。前期差 = 直近 2 点の差分 (daily 系列は前日差、monthly 系列は前月差)。
        </p>
      </section>

      <p className="mt-6 text-[11px] text-faint">
        実装: Server Component + 1 日 ISR。{" "}
        <Link
          href="/catalog"
          className="text-emerald-700 underline hover:text-emerald-900"
        >
          カタログ →
        </Link>
        {" ／ "}
        <Link
          href="/compare"
          className="text-emerald-700 underline hover:text-emerald-900"
        >
          系列比較 →
        </Link>
      </p>
    </Container>
  );
}

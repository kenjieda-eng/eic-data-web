import type { Indicator } from "@/lib/catalog";
import { fetchSeries } from "@/lib/series";
import { computeSeriesStats } from "@/lib/series-stats";

// SEO L2: 系列詳細ページに固有の indexable テキストを持たせるサーバーコンポーネント。
// メタデータ表だけでは薄いため、CSV から算出した過去実績のみを地の文 + dl で描く
// (将来予測・評価的表現は書かない)。fetchSeries は失敗時に throw する設計なので、
// 1 系列の CSV 取得失敗でページ全体を壊さないよう try/catch で握りつぶし null を返す。

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "日次",
  weekly: "週次",
  monthly: "月次",
  quarterly: "四半期",
  annual: "年次",
};

function fmt(n: number): string {
  return n.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

/** changePct を「＋x.x%」/「−x.x%」の全角符号付き表記に。 */
function fmtChangePct(pct: number): string {
  const sign = pct >= 0 ? "＋" : "−";
  const abs = Math.abs(pct).toLocaleString("ja-JP", {
    maximumFractionDigits: 1,
  });
  return `${sign}${abs}%`;
}

interface SeriesSummaryStatsProps {
  indicator: Indicator;
}

export default async function SeriesSummaryStats({
  indicator,
}: SeriesSummaryStatsProps) {
  let points;
  try {
    ({ points } = await fetchSeries(indicator.id));
  } catch {
    return null;
  }

  const stats = computeSeriesStats(points, indicator.frequency);
  if (!stats) return null;

  const name = indicator.name || indicator.id;
  const unit = indicator.unit || "—";
  const freqLabel = FREQUENCY_LABELS[indicator.frequency] ?? indicator.frequency;
  const { start, end, count, latest, max, min, yearAgo } = stats;

  return (
    <section className="mb-6 rounded border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">サマリー統計</h2>

      <p className="mt-3 text-[13px] leading-relaxed text-subink">
        {name}（単位: {unit}）は{freqLabel}で記録される系列。収載期間は {start}{" "}
        〜 {end}（データ点数 {count.toLocaleString("ja-JP")}）。最新値は{" "}
        {latest.date} 時点で {fmt(latest.value)}。収載期間中の最大は {max.date}{" "}
        の {fmt(max.value)}、最小は {min.date} の {fmt(min.value)}。
        {yearAgo && (
          <>
            1年前（{yearAgo.date}: {fmt(yearAgo.value)}）
            {yearAgo.changePct === null
              ? "。"
              : `と比べ ${fmtChangePct(yearAgo.changePct)}。`}
          </>
        )}
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
        <StatRow label="収載期間">
          <span className="tabular-nums">
            {start} 〜 {end}
          </span>
        </StatRow>
        <StatRow label="データ点数">
          <span className="tabular-nums">{count.toLocaleString("ja-JP")}</span>
        </StatRow>
        <StatRow label="最新値">
          <span className="tabular-nums">
            {fmt(latest.value)}（{latest.date}）
          </span>
        </StatRow>
        {yearAgo && (
          <StatRow label="1年前">
            <span className="tabular-nums">
              {fmt(yearAgo.value)}（{yearAgo.date}）
              {yearAgo.changePct !== null && (
                <> ／ {fmtChangePct(yearAgo.changePct)}</>
              )}
            </span>
          </StatRow>
        )}
        <StatRow label="期間最大">
          <span className="tabular-nums">
            {fmt(max.value)}（{max.date}）
          </span>
        </StatRow>
        <StatRow label="期間最小">
          <span className="tabular-nums">
            {fmt(min.value)}（{min.date}）
          </span>
        </StatRow>
      </dl>
    </section>
  );
}

function StatRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 border-b border-slate-100 py-1.5 last:border-0">
      <dt className="text-[11px] uppercase tracking-wider text-faint">
        {label}
      </dt>
      <dd className="text-[13px] leading-relaxed text-ink">{children}</dd>
    </div>
  );
}

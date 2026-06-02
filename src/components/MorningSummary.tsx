import Link from "next/link";
import type { MorningSummary as MorningSummaryType } from "@/lib/morning-summary";
import {
  getMorningNeighbors,
  relatedInsightsForSummary,
} from "@/lib/morning-summary";

const EDITOR_BADGE: Record<string, string> = {
  ハル: "bg-amber-50 text-amber-700 border-amber-200",
  マコト: "bg-sky-50 text-sky-700 border-sky-200",
  リン: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function formatValue(value: number, unit: string): string {
  if (unit === "%" || unit === "¥/kWh") return value.toFixed(2);
  if (unit === "$/bbl" || unit === "¥/$") return value.toFixed(2);
  return value.toString();
}

function formatDod(
  dod: number | null,
  dodPct: number | null,
  unit: string,
): string {
  if (dod === null || dodPct === null) return "(月次、更新なし)";
  const sign = dodPct > 0 ? "+" : "";
  const dodStr =
    unit === "%"
      ? `${sign}${dod.toFixed(2)}pt`
      : `${sign}${dod.toFixed(2)}`;
  return `${dodStr} (${sign}${dodPct.toFixed(2)}%)`;
}

function formatJpDate(date: string): string {
  const [y, m, d] = date.split("-").map((s) => Number(s));
  return `${y} 年 ${m} 月 ${d} 日`;
}

export default function MorningSummary({
  summary,
}: {
  summary: MorningSummaryType;
}) {
  const related = relatedInsightsForSummary(summary);
  const { prev, next } = getMorningNeighbors(summary.date);

  return (
    <article>
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ "}
          <Link href="/today" className="hover:text-emerald-700">
            朝刊サマリー
          </Link>
          {" ／ "}
          {summary.date}
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-ink leading-tight">
          朝刊サマリー — {formatJpDate(summary.date)} ({summary.weekday})
          {summary.weekend && (
            <span className="ml-2 text-base font-normal text-faint">
              ／ 週末版
            </span>
          )}
        </h1>
        <p className="mt-2 text-xs text-faint tabular-nums">
          更新: {summary.generatedAt.replace("T", " ").slice(0, 16)} JST ／ 5 系列横断
        </p>
      </header>

      {summary.alerts.length > 0 && (
        <section
          aria-label="トレンドアラート"
          className="mb-6 rounded-md border border-rose-300 bg-rose-50 p-4"
        >
          <h2 className="text-base font-semibold text-rose-800">
            🔴 トレンドアラート ({summary.alerts.length} 件)
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-rose-700">
            {summary.alerts.map((a) => (
              <li key={a.indicatorId}>
                <strong>{a.label}</strong>: {a.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm md:text-base">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-50 text-left text-ink">
              <th className="px-3 py-2 font-semibold">系列</th>
              <th className="px-3 py-2 font-semibold text-right">値</th>
              <th className="px-3 py-2 font-semibold text-right">前日比</th>
              <th className="px-3 py-2 font-semibold">編集</th>
            </tr>
          </thead>
          <tbody>
            {summary.lines.map((line) => (
              <tr
                key={line.indicatorId}
                className="border-b border-slate-200 last:border-0"
              >
                <td className="px-3 py-2 text-ink">
                  <Link
                    href={`/catalog/${line.indicatorId}`}
                    className="text-emerald-700 hover:text-emerald-900 hover:underline"
                  >
                    {line.label}
                  </Link>
                  <span className="ml-1 text-xs text-faint">({line.unit})</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">
                  {formatValue(line.value, line.unit)}
                </td>
                <td
                  className={`px-3 py-2 text-right tabular-nums ${
                    line.dodPct === null
                      ? "text-faint"
                      : line.dodPct > 0
                        ? "text-rose-700"
                        : "text-emerald-700"
                  }`}
                >
                  {formatDod(line.dod, line.dodPct, line.unit)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs ${
                      EDITOR_BADGE[line.editor] ?? "bg-slate-100"
                    }`}
                  >
                    {line.editor}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8 space-y-6">
        {summary.lines.map((line, idx) => (
          <div
            key={line.indicatorId}
            className="rounded-md border border-slate-200 bg-white p-5"
          >
            <h3 className="text-xl md:text-2xl font-semibold text-ink">
              {idx + 1}. {line.label}{" "}
              <span className="ml-1 text-sm font-normal text-faint">
                ({line.editor}視点)
              </span>
            </h3>
            <p className="mt-3 text-base md:text-lg leading-relaxed text-subink">
              {line.explanation}
            </p>
          </div>
        ))}
      </section>

      {summary.weekendNote && (
        <section className="mb-8 rounded-md border border-emerald-200 bg-emerald-50/40 p-5">
          <h3 className="text-base font-semibold text-ink">
            {summary.weekday === "土" ? "週末まとめ" : "来週の見どころ"}
          </h3>
          <p className="mt-2 text-base md:text-lg leading-relaxed text-subink">
            {summary.weekendNote}
          </p>
        </section>
      )}

      {related.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl md:text-2xl font-semibold text-ink">
            関連 Insight
            <span className="ml-2 text-sm font-normal text-faint tabular-nums">
              {related.length} 本
            </span>
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {related.map((i) => (
              <li key={i.slug}>
                <Link
                  href={`/insight/${i.slug}`}
                  className="block rounded-md border border-slate-200 bg-white p-4 transition hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  <div className="text-xs uppercase tracking-wider text-faint">
                    インサイト
                  </div>
                  <div className="mt-1 text-base font-semibold text-ink">
                    {i.title}
                  </div>
                  <p className="mt-1 text-sm text-subink leading-relaxed">
                    {i.lede}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav
        aria-label="朝刊アーカイブ ナビゲーション"
        className="mt-12 grid grid-cols-1 gap-3 border-t border-slate-200 pt-6 md:grid-cols-2"
      >
        {prev ? (
          <Link
            href={`/today/${prev}`}
            className="group rounded-md border border-slate-200 bg-white p-4 transition hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <div className="text-xs uppercase tracking-wider text-faint">
              ← 前日
            </div>
            <div className="mt-1 text-sm md:text-base font-semibold text-ink group-hover:text-emerald-800">
              {prev}
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/today/${next}`}
            className="group rounded-md border border-slate-200 bg-white p-4 text-right transition hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <div className="text-xs uppercase tracking-wider text-faint">
              翌日 →
            </div>
            <div className="mt-1 text-sm md:text-base font-semibold text-ink group-hover:text-emerald-800">
              {next}
            </div>
          </Link>
        ) : (
          <div />
        )}
      </nav>

      <p className="mt-6 text-xs text-faint">
        朝刊サマリーは 2026-05-17 で一時停止中（Phase 4 で自動更新を再開予定）。一次出典は{" "}
        <Link href="/catalog" className="text-emerald-700 underline hover:text-emerald-900">
          catalog
        </Link>{" "}
        の各系列ページから 2 クリックで遡及可能。
      </p>
    </article>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import MultiSeriesChart from "@/components/MultiSeriesChart";
import type { Indicator } from "@/lib/catalog";
import {
  COMPARE_COLORS,
  COMPARE_MAX_SERIES,
  parseCompareQuery,
  serializeCompareQuery,
  type CompareNorm,
  type ComparePeriod,
  type SeriesStats,
} from "@/lib/compare-helpers";
import type { SeriesMeta } from "@/lib/series";

interface CompareClientProps {
  indicators: Indicator[];
}

const PERIOD_LABELS: Record<ComparePeriod, string> = {
  all: "全期間",
  "5y": "過去 5 年",
  "1y": "過去 1 年",
  custom: "カスタム",
};

const NORM_LABELS: Record<CompareNorm, string> = {
  raw: "生値",
  index100: "基準=100 指数",
  zscore: "Z-score",
};

const NORM_HELP: Record<CompareNorm, string> = {
  raw: "各系列の元の値をそのまま表示。単位が異なる場合は読みづらい",
  index100: "各系列の最初の値を 100 として比例 (相対変化率の比較)",
  zscore: "平均 0 / 標準偏差 1 に標準化 (変動の大きさを揃える)",
};

function formatNumber(v: number | null, digits = 2): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("ja-JP", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export default function CompareClient({ indicators }: CompareClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // searchParams → state (初期化 + URL 変更時の同期)
  const initialState = useMemo(() => {
    const raw: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      raw[k] = v;
    });
    return parseCompareQuery(raw);
  }, [searchParams]);

  const [ids, setIds] = useState<string[]>(initialState.ids);
  const [period, setPeriod] = useState<ComparePeriod>(initialState.period);
  const [from, setFrom] = useState<string | null>(initialState.from);
  const [to, setTo] = useState<string | null>(initialState.to);
  const [norm, setNorm] = useState<CompareNorm>(initialState.norm);

  // 検索
  const [query, setQuery] = useState("");

  // 統計 (子から受け取る)
  const [stats, setStats] = useState<
    { id: string; meta: SeriesMeta | null; stats: SeriesStats }[]
  >([]);

  // 共有 UI
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  // 状態 → URL に反映 (replace で履歴を汚さない)
  useEffect(() => {
    const qs = serializeCompareQuery({ ids, period, from, to, norm });
    const target = `/compare${qs}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== target) {
      router.replace(target, { scroll: false });
    }
  }, [ids, period, from, to, norm, router]);

  // 検索フィルタ
  const filtered = useMemo(() => {
    if (!query.trim()) return indicators.slice(0, 20);
    const q = query.trim().toLowerCase();
    return indicators
      .filter(
        (i) =>
          i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [indicators, query]);

  const addSeries = useCallback(
    (id: string) => {
      setIds((prev) => {
        if (prev.includes(id)) return prev;
        if (prev.length >= COMPARE_MAX_SERIES) return prev;
        return [...prev, id];
      });
      setQuery("");
    },
    [],
  );

  const removeSeries = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const indicatorById = useMemo(() => {
    const m = new Map<string, Indicator>();
    for (const i of indicators) m.set(i.id, i);
    return m;
  }, [indicators]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/compare${serializeCompareQuery({
      ids,
      period,
      from,
      to,
      norm,
    })}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      // フォールバック: prompt
      window.prompt("この URL をコピーしてください", url);
    }
  }, [ids, period, from, to, norm]);

  const canShare = ids.length > 0;

  return (
    <div className="space-y-6">
      {/* 操作パネル */}
      <section className="rounded-md border border-slate-200 bg-white p-4 space-y-4">
        {/* 系列選択 */}
        <div>
          <label
            htmlFor="compare-search"
            className="block text-[12px] font-semibold uppercase tracking-wider text-faint mb-1.5"
          >
            系列を選択 ({ids.length} / {COMPARE_MAX_SERIES})
          </label>
          <input
            id="compare-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="系列 ID または名称で検索 (例: jepx, lng, treasury)"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={ids.length >= COMPARE_MAX_SERIES}
          />
          {ids.length < COMPARE_MAX_SERIES && query.trim() && (
            <ul className="mt-1.5 max-h-48 overflow-y-auto rounded border border-slate-200 bg-white text-sm divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-faint">該当系列なし</li>
              ) : (
                filtered.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => addSeries(i.id)}
                      disabled={ids.includes(i.id)}
                      className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-faint"
                    >
                      <span className="font-mono text-xs text-emerald-700">
                        {i.id}
                      </span>
                      <span className="ml-2 text-ink">{i.name}</span>
                      <span className="ml-2 text-[10px] text-faint">
                        {i.frequency} / {i.unit}
                      </span>
                      {ids.includes(i.id) && (
                        <span className="ml-2 text-[10px] text-faint">
                          (追加済)
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
          {/* 選択チップ */}
          <div className="mt-3 flex flex-wrap gap-2 min-h-[1.5rem]">
            {ids.length === 0 && (
              <span className="text-[12px] text-faint">
                未選択 — 上の検索ボックスから追加
              </span>
            )}
            {ids.map((id, i) => {
              const meta = indicatorById.get(id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-[12px]"
                  style={{ borderColor: COMPARE_COLORS[i] }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: COMPARE_COLORS[i] }}
                    aria-hidden
                  />
                  <span className="font-mono text-emerald-700">{id}</span>
                  {meta && (
                    <span className="text-subink">／ {meta.name}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSeries(id)}
                    aria-label={`${id} を削除`}
                    className="ml-1 text-faint hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* 期間 + 正規化 + 共有 */}
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          {/* 期間 */}
          <div>
            <span className="block text-[12px] font-semibold uppercase tracking-wider text-faint mb-1.5">
              期間
            </span>
            <div
              role="radiogroup"
              aria-label="期間"
              className="flex flex-wrap gap-1.5"
            >
              {(["all", "5y", "1y", "custom"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={period === p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-[12px] rounded border ${
                    period === p
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-white text-subink hover:border-emerald-400"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            {period === "custom" && (
              <div className="mt-2 flex gap-2 items-center text-[12px]">
                <label className="flex items-center gap-1">
                  <span className="text-subink">From</span>
                  <input
                    type="date"
                    value={from ?? ""}
                    onChange={(e) => setFrom(e.target.value || null)}
                    className="rounded border border-slate-300 px-1.5 py-0.5"
                  />
                </label>
                <label className="flex items-center gap-1">
                  <span className="text-subink">To</span>
                  <input
                    type="date"
                    value={to ?? ""}
                    onChange={(e) => setTo(e.target.value || null)}
                    className="rounded border border-slate-300 px-1.5 py-0.5"
                  />
                </label>
              </div>
            )}
          </div>

          {/* 正規化 */}
          <div>
            <span className="block text-[12px] font-semibold uppercase tracking-wider text-faint mb-1.5">
              正規化
            </span>
            <div
              role="radiogroup"
              aria-label="正規化"
              className="flex flex-wrap gap-1.5"
            >
              {(["raw", "index100", "zscore"] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={norm === n}
                  onClick={() => setNorm(n)}
                  className={`px-2.5 py-1 text-[12px] rounded border ${
                    norm === n
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-white text-subink hover:border-emerald-400"
                  }`}
                >
                  {NORM_LABELS[n]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-faint">{NORM_HELP[norm]}</p>
          </div>

          {/* 共有ボタン */}
          <div className="md:self-end">
            <button
              type="button"
              onClick={handleShare}
              disabled={!canShare}
              className="inline-flex items-center gap-1.5 rounded border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-faint"
              aria-live="polite"
            >
              {copyStatus === "copied" ? "✓ URL コピー済" : "🔗 URL を共有"}
            </button>
          </div>
        </div>
      </section>

      {/* チャート */}
      <section aria-label="重ね描きチャート">
        <MultiSeriesChart
          ids={ids}
          period={period}
          from={from}
          to={to}
          norm={norm}
          height={420}
          onStatsUpdate={setStats}
        />
      </section>

      {/* 統計テーブル */}
      {stats.length > 0 && (
        <section
          aria-label="統計サマリー"
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-faint mb-2">
            統計サマリー ({NORM_LABELS[norm]} 後の値、{PERIOD_LABELS[period]})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px] tabular-nums">
              <thead className="bg-slate-50 text-faint uppercase text-[10px]">
                <tr>
                  <th className="px-2 py-1.5 text-left">系列</th>
                  <th className="px-2 py-1.5 text-right">N</th>
                  <th className="px-2 py-1.5 text-right">Min</th>
                  <th className="px-2 py-1.5 text-right">Max</th>
                  <th className="px-2 py-1.5 text-right">Mean</th>
                  <th className="px-2 py-1.5 text-right">Std</th>
                  <th className="px-2 py-1.5 text-left">First</th>
                  <th className="px-2 py-1.5 text-left">Last</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.map((row, i) => (
                  <tr key={row.id}>
                    <td className="px-2 py-1.5 text-left">
                      <span
                        className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                        style={{ background: COMPARE_COLORS[i] }}
                        aria-hidden
                      />
                      <Link
                        href={`/catalog/${row.id}`}
                        className="text-emerald-700 underline hover:text-emerald-900"
                      >
                        <span className="font-mono text-[11px]">{row.id}</span>
                      </Link>
                      {row.meta?.unit && norm === "raw" && (
                        <span className="ml-2 text-faint">({row.meta.unit})</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right">{row.stats.count}</td>
                    <td className="px-2 py-1.5 text-right">
                      {formatNumber(row.stats.min)}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {formatNumber(row.stats.max)}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {formatNumber(row.stats.mean)}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {formatNumber(row.stats.std)}
                    </td>
                    <td className="px-2 py-1.5 text-left text-faint">
                      {row.stats.first
                        ? `${row.stats.first.date.slice(0, 10)} / ${formatNumber(row.stats.first.value)}`
                        : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-left text-faint">
                      {row.stats.last
                        ? `${row.stats.last.date.slice(0, 10)} / ${formatNumber(row.stats.last.value)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 操作説明 */}
      <section
        aria-label="使い方"
        className="rounded-md border border-slate-200 bg-slate-50 p-4 text-[12px] text-subink leading-relaxed"
      >
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-faint mb-1.5">
          使い方
        </h2>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>系列 ID または名称で検索し、最大 {COMPARE_MAX_SERIES} 件まで追加</li>
          <li>期間 (全期間 / 過去 5 年 / 過去 1 年 / カスタム) を選択</li>
          <li>
            正規化方式を選択 — 単位の異なる系列を比較する場合は{" "}
            <strong>基準=100 指数</strong> か <strong>Z-score</strong> を推奨
          </li>
          <li>
            「URL を共有」で現在の状態を URL にエンコード、コピペで他者と共有可能
          </li>
        </ol>
      </section>
    </div>
  );
}

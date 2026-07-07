"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  filterSummaries,
  formatMonthLabel,
  groupByMonth,
  summaryHeadline,
  summarySnippet,
  type ArchiveSearchFilters,
} from "@/lib/archive-search";
import type { MorningSummary } from "@/lib/morning-summary";

interface ArchiveClientProps {
  summaries: MorningSummary[];
}

export default function ArchiveClient({ summaries }: ArchiveClientProps) {
  const [filters, setFilters] = useState<ArchiveSearchFilters>({
    query: "",
    fromDate: null,
    toDate: null,
  });
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(filters.query);

  // 全期間の月リスト (絞り込み前) — 月次ナビ用
  const allMonths = useMemo(
    () => groupByMonth(summaries).map((g) => g.month),
    [summaries],
  );

  const filtered = useMemo(() => {
    const byKeywordDate = filterSummaries(summaries, {
      ...filters,
      query: deferredQuery,
    });
    if (!activeMonth) return byKeywordDate;
    return byKeywordDate.filter((s) => s.date.slice(0, 7) === activeMonth);
  }, [summaries, filters, deferredQuery, activeMonth]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  return (
    <div className="space-y-4">
      {/* 月次ナビ */}
      <section
        aria-label="月次ナビゲーション"
        className="rounded-md border border-slate-200 bg-white p-4"
      >
        <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
          月で絞る ({allMonths.length} ヶ月)
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveMonth(null)}
            aria-pressed={activeMonth === null}
            className={`text-[12px] px-3 py-1 rounded-full border transition ${
              activeMonth === null
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-subink hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            全期間
          </button>
          {allMonths.map((m) => {
            const active = activeMonth === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMonth(active ? null : m)}
                aria-pressed={active}
                className={`text-[12px] px-3 py-1 rounded-full border transition tabular-nums ${
                  active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-subink hover:border-emerald-400 hover:text-emerald-700"
                }`}
              >
                {formatMonthLabel(m)}
              </button>
            );
          })}
        </div>
      </section>

      {/* 検索 + 期間指定 */}
      <section
        aria-label="検索フィルタ"
        className="rounded-md border border-slate-200 bg-white p-4"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <label className="block">
            <span className="sr-only">キーワード検索</span>
            <input
              type="search"
              value={filters.query}
              onChange={(e) =>
                setFilters((f) => ({ ...f, query: e.target.value }))
              }
              placeholder="キーワードで検索 (例: JEPX, USD/JPY, 原発, LNG)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-ink placeholder:text-faint focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              autoComplete="off"
            />
          </label>
          <label className="flex items-center gap-2 text-[12px] text-subink">
            <span>From</span>
            <input
              type="date"
              value={filters.fromDate ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  fromDate: e.target.value || null,
                }))
              }
              className="px-2 py-1.5 text-sm border border-slate-200 rounded-md bg-white text-ink focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </label>
          <label className="flex items-center gap-2 text-[12px] text-subink">
            <span>To</span>
            <input
              type="date"
              value={filters.toDate ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  toDate: e.target.value || null,
                }))
              }
              className="px-2 py-1.5 text-sm border border-slate-200 rounded-md bg-white text-ink focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              setFilters({ query: "", fromDate: null, toDate: null })
            }
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-subink transition hover:border-emerald-400 hover:text-emerald-700"
          >
            クリア
          </button>
        </div>
        <p className="mt-2 text-[12px] text-faint">
          表示中:{" "}
          <span className="tabular-nums text-ink">{filtered.length}</span> /{" "}
          <span className="tabular-nums text-ink">{summaries.length}</span> 件
          {activeMonth && (
            <>
              {" "}・ 月:{" "}
              <span className="tabular-nums text-ink">
                {formatMonthLabel(activeMonth)}
              </span>
            </>
          )}
        </p>
      </section>

      {/* 結果リスト (月次グルーピング) */}
      {grouped.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-sm text-subink">
          該当する朝刊はありませんでした。フィルタを緩めてください。
        </div>
      ) : (
        grouped.map((group) => (
          <section
            key={group.month}
            aria-label={`${formatMonthLabel(group.month)} の朝刊`}
            className="rounded-md border border-slate-200 bg-white p-4"
          >
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-base md:text-lg font-semibold text-ink tabular-nums">
                {formatMonthLabel(group.month)}
              </h2>
              <span className="text-[11px] text-faint tabular-nums">
                {group.summaries.length} 件
              </span>
            </div>
            <ul className="space-y-2">
              {group.summaries.map((s) => (
                <li key={s.date}>
                  <Link
                    href={`/today/${s.date}`}
                    className="block rounded-md border border-slate-200 bg-white p-3 transition hover:border-emerald-400 hover:bg-emerald-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-ink tabular-nums">
                        {s.date} ({s.weekday})
                      </span>
                      <span className="text-[11px] text-faint">
                        {s.alerts.length > 0 && (
                          <span className="mr-2 rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">
                            🔴 {s.alerts.length} alerts
                          </span>
                        )}
                        <span
                          className={`mr-2 rounded px-1.5 py-0.5 ${
                            s.generated
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-faint"
                          }`}
                        >
                          {s.generated ? "自動生成" : "編集版"}
                        </span>
                        {s.weekend ? "週末版" : "平日"}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] text-emerald-800 font-mono tabular-nums">
                      {summaryHeadline(s)}
                    </div>
                    <p className="mt-1.5 text-[13px] text-subink leading-relaxed">
                      {summarySnippet(s, deferredQuery, 200)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

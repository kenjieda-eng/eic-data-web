/**
 * /editorial-calendar — N4 月次編集カレンダー
 *
 * Phase C Day 5 午後第 3 弾 (2026-05-16) で実装。
 * - INSIGHTS 配列の updated 日付を月別にグルーピング
 * - 月ごとに Insight タイトル一覧 + 件数を表示
 * - 計画リスト (リン原稿の予定) は将来 TODO、ファイル末尾に注記
 */

import Link from "next/link";
import Container from "@/components/Container";
import { INSIGHTS, type Insight } from "@/lib/insights";

export const metadata = {
  title: "編集カレンダー | EIC Data",
  description:
    "EIC Data Insight の月次公開実績カレンダー。INSIGHTS 配列の updated 日付を月別にグルーピングし、編集計画と公開実績を一覧化。",
};

interface MonthGroup {
  ym: string;
  label: string;
  count: number;
  insights: Insight[];
}

function groupByMonth(insights: Insight[]): MonthGroup[] {
  const map = new Map<string, Insight[]>();
  for (const i of insights) {
    const ym = i.updated.slice(0, 7);
    const arr = map.get(ym) ?? [];
    arr.push(i);
    map.set(ym, arr);
  }
  const sorted = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  return sorted.map(([ym, arr]) => ({
    ym,
    label: `${ym.slice(0, 4)} 年 ${parseInt(ym.slice(5, 7), 10)} 月`,
    count: arr.length,
    insights: arr.sort((a, b) => b.updated.localeCompare(a.updated) || a.slug.localeCompare(b.slug)),
  }));
}

export default function EditorialCalendarPage() {
  const groups = groupByMonth(INSIGHTS);

  return (
    <Container size="wide" className="py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-emerald-700">EDITORIAL</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-ink leading-tight">
          編集カレンダー
        </h1>
        <p className="mt-3 text-sm md:text-base text-subink max-w-3xl">
          EIC Data Insight 全 <strong className="tabular-nums">{INSIGHTS.length}</strong> 本の公開実績を月別に一覧。<code>updated</code> 日付ベース、新しい月から順に表示。
        </p>
      </header>

      <ol className="space-y-8">
        {groups.map((g) => (
          <li key={g.ym} className="border-l-2 border-emerald-200 pl-4">
            <h2 className="text-xl font-semibold text-ink">
              {g.label}
              <span className="ml-2 text-sm font-normal text-faint">
                ({g.count} 本公開)
              </span>
            </h2>
            <ul className="mt-3 space-y-2">
              {g.insights.map((i) => {
                const idx = INSIGHTS.findIndex((x) => x.slug === i.slug) + 1;
                return (
                  <li key={i.slug} className="text-sm md:text-base">
                    <Link
                      href={`/insight/${i.slug}`}
                      className="text-emerald-700 underline hover:text-emerald-900"
                    >
                      #{idx} {i.title}
                    </Link>
                    <span className="ml-2 text-xs text-faint">
                      ({i.updated})
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-xs text-faint">
        <p>
          ※ 計画 Insight (未公開、リン原稿先回り起草分) は本ページには表示していません。
          公開済の <code>updated</code> 日付ベースの実績カレンダーです。Phase D
          で計画リストの公開化を検討。
        </p>
      </footer>
    </Container>
  );
}

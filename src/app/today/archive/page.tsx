import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { groupByMonth, listAllSummaries } from "@/lib/archive-search";
import { MORNING_SUMMARIES } from "@/lib/morning-summary-data";
import {
  fetchArchiveIndex,
  fetchArchiveSummary,
  type MorningSummary,
} from "@/lib/morning-summary";
import ArchiveClient from "./ArchiveClient";

// ISR 1 時間 — pipeline nightly が append した新しい日付を再デプロイなしで反映
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "朝刊アーカイブ — EIC Data",
  description:
    "過去の朝刊サマリーを日付・キーワードで検索。JEPX・燃料・為替・金利を横断する前日比 + 解説を月次グルーピングで一覧、各カードから個別ページに即遷移。",
};

/** 自動生成 (pipeline) + 手動 (編集版) の朝刊を日付でマージ (自動生成優先)、降順 */
async function loadAllSummaries(): Promise<MorningSummary[]> {
  const remoteDates = await fetchArchiveIndex();
  const remote = (
    await Promise.all(remoteDates.map((d) => fetchArchiveSummary(d)))
  ).filter((s): s is MorningSummary => s !== null);

  const byDate = new Map<string, MorningSummary>();
  // 手動を先に入れ、自動生成で上書き (同一日付なら pipeline 版を優先)
  for (const s of listAllSummaries(MORNING_SUMMARIES)) byDate.set(s.date, s);
  for (const s of remote) byDate.set(s.date, s);

  return [...byDate.values()].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}

export default async function TodayArchivePage() {
  const summaries = await loadAllSummaries();
  const groups = groupByMonth(summaries);

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ "}
          <Link href="/today" className="hover:text-emerald-700">
            朝刊
          </Link>
          {" ／ アーカイブ"}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-ink leading-tight">
          朝刊アーカイブ ／{" "}
          <code className="text-emerald-700">/today/archive</code>
        </h1>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          過去の朝刊サマリー{" "}
          <strong className="text-ink tabular-nums">{summaries.length}</strong>{" "}
          本を日付・キーワードで検索。月次グルーピング (
          <strong className="text-ink tabular-nums">{groups.length}</strong>{" "}
          ヶ月) + 該当朝刊カード一覧、カードクリックで{" "}
          <code>/today/[YYYY-MM-DD]</code> に遷移。
        </p>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          JEPX・燃料・為替・金利を横断する前日比 + 解説を時系列で追跡できる、
          北極星「引用インフラ」の編集物アーカイブ。毎朝データから自動生成。
        </p>
      </header>

      <ArchiveClient summaries={summaries} />

      <p className="mt-6 text-[11px] text-faint">
        実装: 検索 + 日付範囲フィルタは <code>useDeferredValue</code> で 100ms 程度の
        体感遅延に抑制、月次グルーピング/200 字抜粋は <code>useMemo</code> でキャッシュ。
        朝刊は pipeline nightly が毎朝自動生成し、ISR (1 時間) で本ページへ反映されます。
      </p>
    </Container>
  );
}

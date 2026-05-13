import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { groupByMonth, listAllSummaries } from "@/lib/archive-search";
import { MORNING_SUMMARIES } from "@/lib/morning-summary-data";
import ArchiveClient from "./ArchiveClient";

export const metadata: Metadata = {
  title: "朝刊アーカイブ — EIC Data",
  description:
    "過去の朝刊サマリーを日付・キーワードで検索。5 系列横断 (JEPX 東京 + WTI + USD/JPY + JGB 10y + 米 CPI) の前日比 + 解説を月次グルーピングで一覧、各カードから個別ページに即遷移。",
};

export default function TodayArchivePage() {
  const summaries = listAllSummaries(MORNING_SUMMARIES);
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
          5 系列横断 (JEPX 東京 + WTI + USD/JPY + JGB 10y + 米 CPI) の前日比 + 解説を
          時系列で追跡できる、北極星「引用インフラ」の編集物アーカイブ。
        </p>
      </header>

      <ArchiveClient summaries={summaries} />

      <p className="mt-6 text-[11px] text-faint">
        実装: 検索 + 日付範囲フィルタは <code>useDeferredValue</code> で 100ms 程度の
        体感遅延に抑制、月次グルーピング/200 字抜粋は <code>useMemo</code> でキャッシュ。
        Phase D 以降は毎平日 7:00 JST cron で append される朝刊が自動的に本ページに反映。
      </p>
    </Container>
  );
}

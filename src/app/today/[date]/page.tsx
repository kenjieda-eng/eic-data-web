import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import MorningSummary from "@/components/MorningSummary";
import {
  fetchArchiveIndex,
  fetchArchiveSummary,
  fetchLatestSummary,
  generateMorningSummary,
  listMorningSummaryDates,
  type MorningSummary as MorningSummaryType,
} from "@/lib/morning-summary";

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateStaticParams() {
  // 自動生成の index ∪ 手動 (編集版) 日付をビルド時に静的生成
  const [remoteDates, manualDates] = [
    await fetchArchiveIndex(),
    listMorningSummaryDates(),
  ];
  const all = Array.from(new Set([...remoteDates, ...manualDates]));
  return all.map((date) => ({ date }));
}

// 翌日以降の新しい日付を再デプロイなしで配信 + ISR 1 時間
export const dynamicParams = true;
export const revalidate = 3600;

/**
 * 指定日の朝刊を解決:
 *   1) pipeline archive/{date}.json (自動生成)
 *   2) 手動 (編集版) エントリ
 *   3) 当日分が archive 未反映で latest 側にのみ在る場合の保険
 */
async function resolveSummary(
  date: string,
): Promise<MorningSummaryType | null> {
  const remote = await fetchArchiveSummary(date);
  if (remote) return remote;
  const manual = await generateMorningSummary(date);
  if (manual) return manual;
  const latest = await fetchLatestSummary();
  if (latest && latest.date === date) return latest;
  return null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { date } = await params;
  const summary = await resolveSummary(date);
  if (!summary) {
    return { title: "朝刊サマリー — 未公開" };
  }
  return {
    title: `朝刊サマリー — ${summary.date} (${summary.weekday}) | EIC Data`,
    description: `${summary.date} の朝刊サマリー: JEPX・燃料・為替・金利を横断する前日比 + 解説。${summary.alerts.length > 0 ? `🔴 トレンドアラート ${summary.alerts.length} 件。` : ""}`,
  };
}

export default async function TodayArchivePage({ params }: PageProps) {
  const { date } = await params;
  const summary = await resolveSummary(date);
  if (!summary) notFound();

  return (
    <Container size="wide" className="py-10">
      <MorningSummary summary={summary} />
    </Container>
  );
}

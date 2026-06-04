import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import MorningSummary from "@/components/MorningSummary";
import {
  generateMorningSummary,
  getMorningSummary,
  listMorningSummaryDates,
} from "@/lib/morning-summary";

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateStaticParams() {
  return listMorningSummaryDates().map((date) => ({ date }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { date } = await params;
  const summary = getMorningSummary(date);
  if (!summary) {
    return { title: "朝刊サマリー — 未公開" };
  }
  return {
    title: `朝刊サマリー — ${summary.date} (${summary.weekday}) | EIC Data`,
    description: `${summary.date} の朝刊サマリー: 5 系列横断 (JEPX 東京 + WTI + USD/JPY + JGB 10y + 米 CPI) の前日比 + 解説。${summary.alerts.length > 0 ? `🔴 トレンドアラート ${summary.alerts.length} 件。` : ""}`,
  };
}

export default async function TodayArchivePage({ params }: PageProps) {
  const { date } = await params;
  const summary = await generateMorningSummary(date);
  if (!summary) notFound();

  return (
    <Container size="wide" className="py-10">
      <MorningSummary summary={summary} />
    </Container>
  );
}

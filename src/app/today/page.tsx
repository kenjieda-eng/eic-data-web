import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import MorningSummary from "@/components/MorningSummary";
import {
  generateMorningSummary,
  getLatestMorningSummaryDate,
  listMorningSummaryDates,
} from "@/lib/morning-summary";

export async function generateMetadata(): Promise<Metadata> {
  const latest = getLatestMorningSummaryDate();
  return {
    title: "朝刊サマリー /today — EIC Data",
    description: latest
      ? `毎平日朝 7:00 JST に自動更新される 5 系列横断 (JEPX 東京 + WTI + USD/JPY + JGB 10y + 米 CPI) の前日比 + 解説。最新版: ${latest}。`
      : "毎平日朝 7:00 JST に自動更新される 5 系列横断の前日比 + 解説。",
  };
}

export default async function TodayPage() {
  const latest = getLatestMorningSummaryDate();
  if (!latest) {
    return (
      <Container size="data" className="py-10">
        <h1 className="text-2xl font-semibold text-ink">
          朝刊サマリー — 準備中
        </h1>
        <p className="mt-3 text-base text-subink">
          朝刊サマリーは Phase D 以降に毎平日朝 7:00 JST で自動配信開始予定です。
        </p>
      </Container>
    );
  }
  const summary = await generateMorningSummary(latest);
  if (!summary) {
    return (
      <Container size="data" className="py-10">
        <h1 className="text-2xl font-semibold text-ink">
          朝刊サマリー — データなし
        </h1>
      </Container>
    );
  }
  const allDates = listMorningSummaryDates();

  return (
    <Container size="data" className="py-10">
      <MorningSummary summary={summary} />

      <section className="mt-10 rounded-md border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h2 className="text-base font-semibold text-ink">アーカイブ</h2>
          <Link
            href="/today/archive"
            className="text-[13px] text-emerald-700 underline hover:text-emerald-800"
          >
            検索 + 月次ナビで俯瞰 →
          </Link>
        </div>
        <p className="mt-1 text-sm text-subink">
          過去の朝刊は <code>/today/&lt;date&gt;</code> で個別 URL を持ちます。
          キーワード + 期間検索は <code>/today/archive</code> へ。
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {allDates.map((d) => (
            <li key={d}>
              <Link
                href={`/today/${d}`}
                className={`rounded-full border px-3 py-1 text-sm tabular-nums transition ${
                  d === latest
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-300 bg-white text-subink hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                {d}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import MorningSummary from "@/components/MorningSummary";
import {
  fetchArchiveIndex,
  fetchLatestSummary,
  generateMorningSummary,
  getLatestMorningSummaryDate,
  listMorningSummaryDates,
} from "@/lib/morning-summary";

// ISR 1 時間 — 毎朝 8:00 台の pipeline nightly 後、最初のアクセスで自動更新
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "朝刊サマリー /today — EIC Data",
  description:
    "JEPX・燃料・為替・金利を横断する朝刊サマリー。毎朝、最新データから自動生成（事実の記述のみ）。",
};

/** 日付を ISO で降順ソート */
function sortDesc(dates: string[]): string[] {
  return [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

export default async function TodayPage() {
  // 1) pipeline の最新自動生成サマリーを優先
  let summary = await fetchLatestSummary();
  let fellBack = false;
  if (!summary) {
    // 2) 取得失敗時のみ手動 (編集版) の最新へフォールバック
    const latest = getLatestMorningSummaryDate();
    summary = latest ? await generateMorningSummary(latest) : null;
    fellBack = summary !== null;
  }

  if (!summary) {
    return (
      <Container size="wide" className="py-10">
        <h1 className="text-2xl font-semibold text-ink">
          朝刊サマリー — データなし
        </h1>
        <p className="mt-3 text-base text-subink">
          最新データを取得できませんでした。しばらくして再度お試しください。
        </p>
      </Container>
    );
  }

  // アーカイブ日付一覧 = 自動生成の index ∪ 手動 (編集版) 日付、降順
  const remoteDates = await fetchArchiveIndex();
  const manualDates = listMorningSummaryDates();
  const manualSet = new Set(manualDates);
  const allDates = sortDesc(
    Array.from(new Set([...remoteDates, ...manualDates])),
  );

  return (
    <Container size="wide" className="py-10">
      {fellBack && (
        <div className="mb-6 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-subink">
          最新データを取得できませんでした。以下は直近の編集版アーカイブを表示しています。
        </div>
      )}

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
          {allDates.map((d) => {
            const isManual = manualSet.has(d);
            return (
              <li key={d}>
                <Link
                  href={`/today/${d}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm tabular-nums transition ${
                    d === summary.date
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-white text-subink hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {d}
                  <span
                    className={`rounded px-1 py-0.5 text-[10px] font-normal ${
                      isManual
                        ? "bg-slate-100 text-faint"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isManual ? "編集版" : "自動生成"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </Container>
  );
}

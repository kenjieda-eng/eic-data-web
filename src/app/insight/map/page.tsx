import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { groupInsights, validateInsights } from "@/lib/grouping";
import { INSIGHTS, searchInsights } from "@/lib/insights";
import GroupedInsightGrid from "./components/GroupedInsightGrid";
import InsightSearchBox from "./components/InsightSearchBox";
import SelfCheckPanel from "./components/SelfCheckPanel";

export const metadata: Metadata = {
  title: "インサイトマップ — EIC Data",
  description:
    "EIC Data の 38 本のインサイトを 6 つの編集軸で俯瞰。気象 × 電力の核から、燃料・金融、電源構成、気候 × 地理ヒートマップ、需要・水文、マクロ・金利まで、編集の全体像が 1 画面で見える。",
};

function pickQuery(
  raw: Record<string, string | string[] | undefined>,
): string {
  const v = raw.q;
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function InsightMapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query = pickQuery(raw);

  const validation = validateInsights(INSIGHTS);
  const filtered = searchInsights(INSIGHTS, query);
  const { groups, unclassified } = groupInsights(filtered);

  return (
    <Container className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ インサイトマップ"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          インサイトマップ
        </h1>
        <p className="mt-2 text-sm text-subink leading-relaxed">
          EIC Data の{" "}
          <strong className="text-ink tabular-nums">{INSIGHTS.length}</strong>{" "}
          本のインサイトを 6 つの編集軸で俯瞰。気象 × 電力の核から、燃料・金融の世界市況、電源構成、気候 × 地理ヒートマップ、需要・水文、マクロ・金利まで、編集の全体像が 1 画面で見える。
        </p>
      </header>

      <InsightSearchBox query={query} />

      <SelfCheckPanel result={validation} totalInsights={INSIGHTS.length} />

      <GroupedInsightGrid
        groups={groups}
        unclassified={unclassified}
        searchQuery={query || undefined}
      />

      <section className="mt-8 bg-slate-50 border border-slate-200 rounded-md p-5 text-[13px] text-subink leading-relaxed">
        <h3 className="text-[14px] font-semibold text-ink mb-2">
          この 6 グループについて
        </h3>
        <p>
          EIC Data の編集は、「気象 × 電力」を核に始まり、燃料・金融の世界市況、電源構成、気候 × 地理ヒートマップ、需要側の構造、マクロ・金利へと拡張してきました。
          各グループは独立した編集軸を持ち、複数の指標を組み合わせて 1 つの問いに答える設計です。
        </p>
        <p className="mt-2">
          リスト表示は{" "}
          <Link
            href="/insight"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            インサイト一覧
          </Link>
          、系列の品質は{" "}
          <Link
            href="/data-quality"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            データ品質ダッシュボード
          </Link>
          、メタデータは{" "}
          <Link
            href="/catalog"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            編集指標カタログ
          </Link>
          {" "}から。
        </p>
      </section>
    </Container>
  );
}

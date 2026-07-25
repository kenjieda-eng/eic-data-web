import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { INSIGHTS } from "@/lib/insights";

// 教育クラスタのハブページ「電力市場を学ぶ」。
// 既存 14 本の教材（how-to-read 系 + 構造解説）を、俯瞰→各論の
// 読み順で 5 章に並べた静的カリキュラム。INSIGHTS を build 時に
// slug で引くだけなので、教材の追加・本文更新に自動追随する。
// slug が INSIGHTS に無い場合はビルドを止めず console.warn でスキップ。
export const metadata: Metadata = {
  title: "電力市場を学ぶ — 教材14本の読み順ガイド | EIC Data",
  description:
    "日本の電力市場の仕組みを、俯瞰から各論へ、14本の教材で体系的に読めるように並べた学習ガイド。JEPXスポット・エリアプライス・容量市場・需給調整市場・インバランス・非化石証書などを5章のカリキュラムで無料・引用可（CC BY 4.0）に解説します。",
};

// 読み順カリキュラム。各章は slug の配列で教材を指す。
// タイトル・lede は INSIGHTS 側の単一ソースから引くため、ここでは持たない。
const CURRICULUM: { chapter: string; slugs: string[] }[] = [
  {
    chapter: "全体地図",
    slugs: ["jp-power-markets-three-layers"],
  },
  {
    chapter: "市場を読む",
    slugs: [
      "how-to-read-jepx-spot",
      "how-to-read-area-prices",
      "how-to-read-reserve-margin",
    ],
  },
  {
    chapter: "料金を分解する",
    slugs: [
      "electricity-bill-structure",
      "lcoe-vs-electricity-price",
      "fuel-cost-adjustment",
      "how-to-read-capacity-market",
      "how-to-read-balancing-market",
      "how-to-read-fit-fip",
      "wheeling-charge-structure",
    ],
  },
  {
    chapter: "ズレの精算と環境価値",
    slugs: ["imbalance-charge-structure", "how-to-read-nonfossil-certificates"],
  },
  {
    chapter: "データを正しく読む",
    slugs: ["how-to-read-eic-metrics"],
  },
];

const LEDE_MAX = 80;

// lede 冒頭を 80 字に丸める。80 字超なら末尾に省略記号を付す。
function ledeExcerpt(lede: string): string {
  const chars = Array.from(lede.trim());
  if (chars.length <= LEDE_MAX) return lede.trim();
  return `${chars.slice(0, LEDE_MAX).join("")}…`;
}

export default function InsightGuidePage() {
  // slug → Insight の索引を作り、CURRICULUM を解決する。
  // 未登録 slug は console.warn でスキップ（ビルドは継続）。
  const bySlug = new Map(INSIGHTS.map((i) => [i.slug, i]));

  let running = 0;
  const chapters = CURRICULUM.map((c) => {
    const items = c.slugs
      .map((slug) => {
        const insight = bySlug.get(slug);
        if (!insight) {
          console.warn(
            `[insight/guide] slug "${slug}" が INSIGHTS に見つかりません。スキップします。`,
          );
          return null;
        }
        running += 1;
        return { no: running, insight };
      })
      .filter((x): x is { no: number; insight: (typeof INSIGHTS)[number] } =>
        Boolean(x),
      );
    return { chapter: c.chapter, items };
  });

  const total = chapters.reduce((n, c) => n + c.items.length, 0);

  return (
    <Container size="wide" className="py-10">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-wider text-faint">
          インサイト ／ 学ぶ（教材）
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-tight text-ink">
          電力市場を学ぶ — 教材シリーズ14本の読み順ガイド
        </h1>
        <p className="mt-3 text-base md:text-lg leading-relaxed text-subink">
          日本の電力市場の仕組みを、俯瞰から各論へ、14本の教材で体系的に読めるように並べました。どれも無料・引用可（CC
          BY 4.0）です。
        </p>
      </header>

      <ol className="space-y-10">
        {chapters.map((c, ci) => (
          <li key={c.chapter}>
            <h2 className="text-xl md:text-2xl font-bold text-ink">
              <span className="text-emerald-700">第{ci + 1}章</span>{" "}
              {c.chapter}
            </h2>
            <ul className="mt-4 space-y-3">
              {c.items.map(({ no, insight }) => (
                <li key={insight.slug}>
                  <Link
                    href={`/insight/${insight.slug}`}
                    className="flex gap-4 rounded-md border border-slate-200 bg-white p-4 transition hover:border-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 md:p-5"
                  >
                    <span
                      className="shrink-0 text-lg font-bold tabular-nums text-faint md:text-xl"
                      aria-hidden
                    >
                      {String(no).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold text-ink md:text-lg">
                        {insight.title}
                      </span>
                      <span className="mt-1 block text-sm md:text-base leading-relaxed text-subink">
                        {ledeExcerpt(insight.lede)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-sm text-faint">
        全 {total} 本を読み順に掲載しています。
      </p>

      <nav
        aria-label="関連ページ"
        className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-6 text-sm md:text-base"
      >
        <Link
          href="/insight"
          className="text-emerald-700 underline hover:text-emerald-900"
        >
          Insight 全記事一覧
        </Link>
        <Link
          href="/whats-new"
          className="text-emerald-700 underline hover:text-emerald-900"
        >
          新着一覧
        </Link>
        <Link
          href="/glossary"
          className="text-emerald-700 underline hover:text-emerald-900"
        >
          用語集
        </Link>
      </nav>
    </Container>
  );
}

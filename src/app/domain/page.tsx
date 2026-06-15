import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { countByCanonicalDomain, fetchCatalog } from "@/lib/catalog";
import { DOMAINS, findRelatedInsightsForDomain } from "./data";

export const metadata: Metadata = {
  title: "ドメイン一覧 — EIC Data",
  description:
    "電力・燃料・金融・気象・ESG・技術・地政・制度・人口・企業IR・国際・経済の 12 ドメイン。各ドメインの編集指標カタログ系列と関連 Insight への入口。",
};

export default async function DomainIndexPage() {
  const catalog = await fetchCatalog();
  const counts = countByCanonicalDomain(catalog.indicators);

  const cards = DOMAINS.map((meta) => ({
    meta,
    seriesCount: counts.get(meta.id) ?? 0,
    insightCount: findRelatedInsightsForDomain(meta, undefined, 999).length,
  }));

  const totalSeries = cards.reduce((acc, c) => acc + c.seriesCount, 0);

  return (
    <Container size="wide" className="py-10">
      <header className="mb-8">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ "}
          <span aria-hidden>🗂️</span> ドメイン一覧
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          <span aria-hidden className="mr-2">
            🗂️
          </span>
          ドメイン一覧
          <span className="ml-2 text-[13px] font-normal text-faint tabular-nums">
            {DOMAINS.length} ドメイン ／ {totalSeries} 系列
          </span>
        </h1>
        <p className="mt-3 text-[13px] text-subink leading-relaxed max-w-3xl">
          EIC Data の編集指標は 12 の正準ドメインに整理されています。各ドメインは
          pipeline catalog の実系列に裏打ちされ、関連する Insight 群への入口になります。
          カードから各ドメインの系列カタログと分析記事に進めます。
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ meta, seriesCount, insightCount }) => (
          <li key={meta.id}>
            <Link
              href={`/domain/${meta.id}`}
              className="group block h-full rounded-md border border-slate-200 bg-white p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              <div className="flex items-baseline gap-2">
                <span aria-hidden className="text-xl">
                  {meta.emoji}
                </span>
                <h2 className="text-[15px] font-semibold text-ink group-hover:text-emerald-800">
                  {meta.name}
                </h2>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint tabular-nums">
                <span>{seriesCount} 系列</span>
                <span aria-hidden>·</span>
                <span>{insightCount} Insight</span>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-subink line-clamp-4">
                {meta.description}
              </p>
              <span className="mt-3 inline-block text-[12px] text-emerald-700 group-hover:text-emerald-800">
                ドメインを見る →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3 text-[12px]">
        <Link
          href="/catalog"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          編集指標カタログ →
        </Link>
        <Link
          href="/insight/map"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          インサイトマップ →
        </Link>
        <Link
          href="/data-quality"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          データ品質ダッシュボード →
        </Link>
      </div>
    </Container>
  );
}

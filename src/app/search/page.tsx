import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Container from "@/components/Container";
import { GLOSSARY_TERMS } from "@/app/glossary/data";
import { fetchCatalog } from "@/lib/catalog";
import { INSIGHTS } from "@/lib/insights";
import { buildSearchIndex } from "@/lib/search-index";
import SearchClient from "./SearchClient";

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await fetchCatalog();
  const total =
    catalog.indicator_count + INSIGHTS.length + GLOSSARY_TERMS.length;
  return {
    title: "横断検索 — EIC Data",
    description: `EIC Data の指標カタログ ${catalog.indicator_count} 系列 + Insight ${INSIGHTS.length} 本 + 用語集 ${GLOSSARY_TERMS.length} = 計 ${total} 件のメタデータを横断検索。`,
  };
}

export default async function SearchPage() {
  const catalog = await fetchCatalog();
  const index = buildSearchIndex(catalog);
  const totalAll = index.totals.all;

  return (
    <Container size="wide" className="py-10">
      <header className="mb-4">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ 横断検索"}
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-ink leading-tight">
          横断検索
        </h1>
        <p className="mt-2 text-base md:text-lg text-subink leading-relaxed">
          指標カタログ{" "}
          <strong className="text-ink tabular-nums">
            {index.totals.indicator}
          </strong>{" "}
          系列 ＋ Insight{" "}
          <strong className="text-ink tabular-nums">
            {index.totals.insight}
          </strong>{" "}
          本 ＋ 用語集{" "}
          <strong className="text-ink tabular-nums">
            {index.totals.glossary}
          </strong>{" "}
          = 計{" "}
          <strong className="text-ink tabular-nums">{totalAll}</strong>{" "}
          件のメタデータを 1 つの検索窓から探せます。
        </p>
        <p className="mt-1 text-xs text-faint">
          URL クエリ <code>?q=lng</code> + <code>&category=indicator</code>{" "}
          で初期検索条件を保持。
        </p>
      </header>

      <Suspense fallback={<div className="mt-6 text-base text-subink">検索ボックスを準備中...</div>}>
        <SearchClient index={index} />
      </Suspense>
    </Container>
  );
}

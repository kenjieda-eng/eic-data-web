import type { Metadata } from "next";
import Container from "@/components/Container";
import { fetchCatalog } from "@/lib/catalog";
import { INSIGHTS } from "@/lib/insights";
import CiteClient from "./CiteClient";

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await fetchCatalog();
  return {
    title: "引用ジェネレータ — EIC Data",
    description: `catalog ${catalog.indicator_count} 系列 + Insight ${INSIGHTS.length} 本 + サイト全体を BibTeX / Chicago 17 / APA 7 の 3 形式で引用。学術論文・報道記事・金融レポートに即コピー、.bib ダウンロード対応。`,
  };
}

export default async function CitePage() {
  const catalog = await fetchCatalog();

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          ホーム ／ 引用ジェネレータ
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-ink leading-tight">
          引用ジェネレータ ／ <code className="text-emerald-700">/cite</code>
        </h1>
        <p className="mt-3 text-base md:text-lg text-subink leading-relaxed">
          catalog <strong className="text-ink tabular-nums">{catalog.indicator_count}</strong>{" "}
          系列 + Insight{" "}
          <strong className="text-ink tabular-nums">{INSIGHTS.length}</strong>{" "}
          本 + サイト全体を BibTeX / Chicago 17 / APA 7 の 3 形式で引用。
        </p>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          北極星「日本のエネルギーと金融の引用インフラ」の象徴的画面。
          学術論文・報道記事・金融レポート、どの執筆媒体にも 1 クリックでコピー、
          BibTeX は <code>.bib</code> ファイルとして直接ダウンロードできます。
        </p>
      </header>

      <CiteClient
        indicators={catalog.indicators}
        insights={INSIGHTS}
      />
    </Container>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { buildInsightGraph } from "@/lib/insight-graph";
import { INSIGHTS } from "@/lib/insights";
import InsightNetworkClient from "./InsightNetworkClient";

export const metadata: Metadata = {
  title: "Insight クロスリファレンスネットワーク — EIC Data",
  description:
    "EIC Data の 42 本 Insight の関連性を D3.js force-directed graph で可視化。共通タグ・共通指標・共通地域から自動生成された関連エッジを、ドラッグ + ズーム可能なノードグラフで俯瞰。",
};

export default function InsightNetworkPage() {
  const graph = buildInsightGraph();

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ "}
          <Link href="/insight" className="hover:text-emerald-700">
            インサイト
          </Link>
          {" ／ ネットワーク"}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-ink leading-tight">
          Insight クロスリファレンスネットワーク ／{" "}
          <code className="text-emerald-700">/insight/network</code>
        </h1>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          Insight{" "}
          <strong className="text-ink tabular-nums">{INSIGHTS.length}</strong>{" "}
          本の関連性{" "}
          <strong className="text-ink tabular-nums">
            {graph.edges.length}
          </strong>{" "}
          本を D3.js force-directed graph で可視化。共通タグ ≥ 2 / 共通指標 ≥ 1 / 共通地域の 3 規則の max() で重みを自動算出しています。
        </p>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          ノードをドラッグして配置を整え、ホイールでズーム、クリックで関連 Insight
          上位 8 件をサイドパネルに表示。色は電力 / 気象 / 燃料 / 金融 + その他の 5 ドメイン区分です。
        </p>
        <p className="mt-3 text-[12px]">
          <Link
            href="/glossary/graph"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            用語集ノードグラフ →
          </Link>
          <span className="mx-2 text-faint" aria-hidden>
            ／
          </span>
          <Link
            href="/insight/map"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            6 軸インサイトマップ →
          </Link>
        </p>
      </header>

      <InsightNetworkClient graph={graph} />

      <p className="mt-6 text-[11px] text-faint">
        実装: D3.js v7 force simulation (d3-force / d3-drag / d3-zoom)。
        SSG prerender (Server Component で `buildInsightGraph()` 実行 → 静的データを Client へ渡す)。
      </p>
    </Container>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { GLOSSARY_TERMS } from "../data";
import {
  buildGlossaryGraph,
  GLOSSARY_RELATIONS,
} from "@/lib/glossary-relations";
import GlossaryGraphClient from "./GlossaryGraphClient";

export const metadata: Metadata = {
  title: "用語集ノードグラフ — EIC Data",
  description:
    "用語集 23 項目の関連性を D3.js force-directed graph で可視化。基本・制度・電力・燃料・金融マクロの 5 カテゴリ × 40+ 件の関連性をドラッグ可能なノードグラフで俯瞰。",
};

export default function GlossaryGraphPage() {
  const graph = buildGlossaryGraph();

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ "}
          <Link href="/glossary" className="hover:text-emerald-700">
            用語集
          </Link>
          {" ／ ノードグラフ"}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-ink leading-tight">
          用語集ノードグラフ ／{" "}
          <code className="text-emerald-700">/glossary/graph</code>
        </h1>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          用語集{" "}
          <strong className="text-ink tabular-nums">
            {GLOSSARY_TERMS.length}
          </strong>{" "}
          項目の関連性{" "}
          <strong className="text-ink tabular-nums">
            {GLOSSARY_RELATIONS.length}
          </strong>{" "}
          件を D3.js force-directed graph で可視化。
        </p>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          ノードをドラッグして配置を整え、ホイールでズーム、クリックでサイドパネルに詳細表示。
          北極星「日本のエネルギーと金融の引用インフラ」の編集軸を、5 カテゴリ ×
          関連性ネットワークとして 1 ページに展開しています。
        </p>
      </header>

      <GlossaryGraphClient graph={graph} />

      <p className="mt-6 text-[11px] text-faint">
        実装: D3.js v7 force simulation (d3-force / d3-drag / d3-zoom)。
        SSG prerender (Server Component で `buildGlossaryGraph()` 実行 → 静的データを Client へ渡す)。
      </p>
    </Container>
  );
}

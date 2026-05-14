import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Container from "@/components/Container";
import { fetchCatalog } from "@/lib/catalog";
import PlaygroundClient from "./PlaygroundClient";

export const metadata: Metadata = {
  title: "データ実験ノートブック — EIC Data",
  description:
    "EIC Data の指標カタログから 1-2 系列を選び、UI 操作のみで相関 / ラグ相関 / 移動平均 / Z-score / 対数差分を即時計算。コード不要、URL で組み合わせを共有可能。",
};

export const revalidate = 86400;

export default async function PlaygroundPage() {
  const catalog = await fetchCatalog();

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ データ実験ノートブック"}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-ink leading-tight">
          データ実験ノートブック ／{" "}
          <code className="text-emerald-700">/playground</code>
        </h1>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          カタログ{" "}
          <strong className="text-ink tabular-nums">
            {catalog.indicator_count}
          </strong>{" "}
          系列から 1-2 系列を選んで、UI 操作のみで{" "}
          <strong>相関 / ラグ相関 / 移動平均 / Z-score / 対数差分</strong>{" "}
          を即時計算。コード不要、URL で組み合わせを共有可能。
        </p>
        <p className="mt-2 text-[12px]">
          <Link
            href="/compare"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            重ね描き比較 →
          </Link>
          <span className="mx-2 text-faint" aria-hidden>
            ／
          </span>
          <Link
            href="/catalog"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            カタログ →
          </Link>
          <span className="mx-2 text-faint" aria-hidden>
            ／
          </span>
          <Link
            href="/insight/network"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            Insight ネットワーク →
          </Link>
        </p>
      </header>

      <Suspense
        fallback={<div className="text-sm text-subink">読み込み中…</div>}
      >
        <PlaygroundClient indicators={catalog.indicators} />
      </Suspense>
    </Container>
  );
}

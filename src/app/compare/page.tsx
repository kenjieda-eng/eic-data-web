import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Container from "@/components/Container";
import { fetchCatalog } from "@/lib/catalog";
import { COMPARE_MAX_SERIES } from "@/lib/compare-helpers";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "系列比較 — EIC Data",
  description:
    "EIC Data の指標カタログから最大 5 系列を選んで重ね描き比較。期間 (全期間/5 年/1 年/カスタム) と正規化 (生値/基準=100 指数/Z-score) を切り替え、URL で状態を共有可能。",
};

export const revalidate = 86400;

export default async function ComparePage() {
  const catalog = await fetchCatalog();

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ 系列比較"}
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-ink leading-tight">
          系列比較 ／ <code className="text-emerald-700">/compare</code>
        </h1>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          カタログ{" "}
          <strong className="text-ink tabular-nums">
            {catalog.indicator_count}
          </strong>{" "}
          系列から最大{" "}
          <strong className="text-ink tabular-nums">{COMPARE_MAX_SERIES}</strong>{" "}
          系列を選んで重ね描き比較。期間絞り込み + 正規化 (生値 / 基準=100 / Z-score) + URL 共有に対応。
        </p>
        <p className="mt-2 text-[12px]">
          <Link
            href="/catalog"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            カタログ一覧 →
          </Link>
          <span className="mx-2 text-faint" aria-hidden>
            ／
          </span>
          <Link
            href="/data-quality"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            データ品質 →
          </Link>
        </p>
      </header>

      <Suspense
        fallback={<div className="text-sm text-subink">読み込み中…</div>}
      >
        <CompareClient indicators={catalog.indicators} />
      </Suspense>
    </Container>
  );
}

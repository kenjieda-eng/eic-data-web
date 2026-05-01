import { fetchCatalog } from "@/lib/catalog";

export default async function HomePage() {
  const catalog = await fetchCatalog();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-3xl font-bold">EIC Data — Phase A Day 1</h2>
      <p className="mt-4 text-slate-600">
        Phase A スプリント開始: 2026-05-01（金曜、Day 1）。D-014 仕様書に従い、TOP + Insight 一覧 + temp-vs-price MVP を 1 週間で構築する。
      </p>
      <p className="mt-6 text-lg">
        catalog 系列数:{" "}
        <strong className="text-emerald-700">{catalog.indicator_count}</strong>{" "}
        <span className="text-sm text-slate-500">
          （schema={catalog.schema}, generated_at={catalog.generated_at}）
        </span>
      </p>
      <p className="mt-2 text-sm text-emerald-600">
        ✅ Day 1: ローカル起動 + Vercel デプロイ確認 + catalog データ層接続
      </p>
    </div>
  );
}

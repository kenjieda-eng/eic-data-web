import Container from "@/components/Container";
import { fetchCatalog } from "@/lib/catalog";

export default async function HomePage() {
  const catalog = await fetchCatalog();
  return (
    <Container className="py-12">
      <h2 className="text-3xl font-bold text-ink">
        EIC Data — Phase A Day 2 動作確認
      </h2>
      <p className="mt-4 text-subink">
        Phase A スプリント Day 2: 共通レイアウト + ナビ + Tailwind v4 @theme + Container 完成。D-014 仕様書に従い、TOP + Insight 一覧 + temp-vs-price MVP を 1 週間で構築する。
      </p>
      <p className="mt-6 text-lg">
        catalog 系列数:{" "}
        <strong className="text-emerald-700">{catalog.indicator_count}</strong>{" "}
        <span className="text-sm text-faint">
          （schema={catalog.schema}, generated_at={catalog.generated_at}）
        </span>
      </p>
      <p className="mt-2 text-sm text-emerald-600">
        ✅ Day 1: ローカル起動 + Vercel デプロイ + catalog 接続 ／ ✅ Day 2: NAV 7 項目 + 動的フッター + Inter + Noto Sans JP
      </p>
    </Container>
  );
}

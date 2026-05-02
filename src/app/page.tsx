import Link from "next/link";
import ChartLine from "@/components/ChartLine";
import Container from "@/components/Container";
import { fetchCatalog } from "@/lib/catalog";

const KEY_INDICATORS: { id: string; color: string }[] = [
  { id: "jepx-spot-tokyo", color: "#047857" },
  { id: "jepx-spot-kansai", color: "#047857" },
  { id: "fuel-lng-jp-cif", color: "#a16207" },
  { id: "fuel-crude-brent", color: "#0f766e" },
  { id: "fx-usdjpy-monthly-avg", color: "#0ea5e9" },
  { id: "jgb-10y-yield", color: "#7c3aed" },
  { id: "us-treasury-10y", color: "#dc2626" },
  { id: "us-treasury-2y", color: "#ea580c" },
  { id: "meti-gen-thermal", color: "#dc2626" },
  { id: "meti-gen-solar", color: "#facc15" },
  { id: "meti-gen-nuclear", color: "#7c3aed" },
  { id: "meti-renewables-share", color: "#10b981" },
];

const LATEST_INSIGHTS: { slug: string; title: string; lede: string }[] = [
  {
    slug: "temp-vs-price",
    title: "気温 × 電力価格：東京 15 年史",
    lede: "JMA 日平均気温（東京）と JEPX 東京エリア卸電力価格の 15 年相関。冷暖房需要が JEPX 価格を動かす最も基礎的な構造を見る。",
  },
];

export default async function HomePage() {
  const catalog = await fetchCatalog();

  return (
    <Container className="py-10">
      <section className="mb-10">
        <p className="text-sm font-medium text-emerald-700">TODAY&apos;S VOICE</p>
        <p className="mt-2 text-lg leading-relaxed text-subink">
          日本のエネルギーと金融の引用インフラ。
          <strong className="text-ink">{catalog.indicator_count}</strong>{" "}
          系列が毎朝自動更新。一次出典・as-of・引用形式すべて備えた、
          研究者・ジャーナリスト・実務者の「2 クリックで元データに辿れる」基準点。
        </p>
        <p className="mt-3 text-xs text-faint">
          catalog 生成: {catalog.generated_at} ／ schema: {catalog.schema}
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-ink">Key Indicators</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {KEY_INDICATORS.map(({ id, color }) => (
            <ChartLine
              key={id}
              id={id}
              height={200}
              color={color}
              showZoom={false}
            />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-ink">最新の Insight</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {LATEST_INSIGHTS.map((it) => (
            <Link
              key={it.slug}
              href={`/insight/${it.slug}`}
              className="block rounded-md border border-slate-200 bg-white p-5 transition hover:border-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <div className="text-xs uppercase tracking-wider text-faint">
                インサイト
              </div>
              <div className="mt-1 text-lg font-semibold text-ink">
                {it.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-subink">
                {it.lede}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}

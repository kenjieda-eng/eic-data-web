import Link from "next/link";
import Container from "@/components/Container";

export const metadata = {
  title: "インサイト | EIC Data",
  description:
    "EIC Data 編集部による、複数指標を組み合わせて意味を引き出す独自ページ。",
};

const INSIGHTS: {
  slug: string;
  title: string;
  lede: string;
  tags: string[];
  sources: string[];
  updated: string;
}[] = [
  {
    slug: "temp-vs-price",
    title: "気温 × 電力価格：東京 15 年史",
    lede: "JMA 日平均気温と JEPX 東京エリア卸電力価格の 15 年相関",
    tags: ["電力", "気象", "東京"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-02",
  },
  {
    slug: "temp-min-hokkaido-vs-price",
    title: "札幌最低気温 × 北海道 JEPX：冬の暖房需要 15 年",
    lede: "寒さが厳しいほど電気代が上がる構造。北本連系線の制約と暖房需要の関係",
    tags: ["電力", "気象", "北海道"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-05",
  },
  {
    slug: "temp-max-kyushu-vs-price",
    title: "福岡最高気温 × 九州 JEPX：太陽光と冷房需要の綱引き",
    lede: "太陽光発電大国・九州ならではの「夏の昼に価格が下がり、夜に上がる」非対称性",
    tags: ["電力", "気象", "九州", "太陽光"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-05",
  },
  {
    slug: "temp-max-tokyo-summer",
    title: "東京最高気温 × 東京 JEPX：夏期 6-9 月の絶対偏差相関",
    lede: "25℃ から離れるほど価格が上がる U 字型構造を絶対偏差相関で可視化",
    tags: ["電力", "気象", "東京", "夏期"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-05",
  },
  {
    slug: "temp-vs-price-tohoku",
    title: "仙台日平均気温 × 東北 JEPX：火力依存エリアの夏冬両期需要",
    lede: "原発停止後の火力依存と、夏冬両期型需要が価格に響く構造",
    tags: ["電力", "気象", "東北", "原発"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-05",
  },
  {
    slug: "temp-vs-price-chubu",
    title: "名古屋日平均気温 × 中部 JEPX：製造業の電力需要パターン",
    lede: "トヨタ・自動車部品など製造業集積エリアの「平日 vs 休日」需要パターン",
    tags: ["電力", "気象", "中部", "製造業"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-05",
  },
  {
    slug: "temp-vs-price-kansai",
    title: "大阪日平均気温 × 関西 JEPX：原発再稼働と気温感応度の変化",
    lede: "高浜・大飯・美浜 7 基稼働でベースロード復活、気温感応度が 3 段階に変化",
    tags: ["電力", "気象", "関西", "原発"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-05",
  },
  {
    slug: "temp-vs-price-chugoku",
    title: "広島日平均気温 × 中国 JEPX：太陽光大規模導入エリアの昼間反転",
    lede: "国内 2 位の太陽光導入比率 + 島根 2 号機 2024 年再稼働の構造変化",
    tags: ["電力", "気象", "中国", "太陽光", "原発"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-05",
  },
  {
    slug: "temp-vs-price-shikoku",
    title: "高松日平均気温 × 四国 JEPX：小規模市場と原発再稼働",
    lede: "国内最小級市場、伊方 3 号機の運転 / 停止が価格に直接反映",
    tags: ["電力", "気象", "四国", "原発"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-05",
  },
  {
    slug: "temp-vs-price-hokuriku",
    title: "金沢日平均気温 × 北陸 JEPX：水力ベースロード × 豪雪需要",
    lede: "水力比率国内トップで平時は安定、豪雪期は暖房 + 融雪需要で価格上振れ",
    tags: ["電力", "気象", "北陸", "水力", "豪雪"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-05",
  },
  {
    slug: "lng-vs-price-tokyo",
    title: "LNG × JEPX 東京：気温では説明できない価格",
    lede: "ドル建て LNG (CIF) × 円建て JEPX 東京の月次相関、ChartDual 2 軸時系列",
    tags: ["電力", "燃料", "東京", "LNG"],
    sources: ["World Bank Pink Sheet", "JEPX スポット市場"],
    updated: "2026-05-05",
  },
];

export default function InsightIndexPage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-ink">インサイト</h1>
      <p className="mt-2 text-subink">
        データが語るストーリー。EIC Data
        編集部が複数指標を組み合わせて意味を引き出す独自ページ。
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {INSIGHTS.map((it) => (
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
            <p className="mt-2 text-sm text-subink">{it.lede}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {it.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-slate-100 px-2 py-0.5 text-subink"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs text-faint">
              出典: {it.sources.join(" + ")} ／ 更新 {it.updated}
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}

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
  {
    slug: "lng-lag-vs-price-tokyo",
    title: "LNG → JEPX 東京：何ヶ月遅れで価格に効くか",
    lede: "0-12 ヶ月のラグ相関スイープ、ピーク 5-6 ヶ月（長期契約 + 燃料費調整 + 在庫の 3 層）",
    tags: ["電力", "燃料", "東京", "LNG", "ラグ相関"],
    sources: ["World Bank Pink Sheet", "JEPX スポット市場"],
    updated: "2026-05-05",
  },
  {
    slug: "brent-lag-vs-price-tokyo",
    title: "Brent → JEPX 東京：原油は何ヶ月遅れて電力価格に伝播するか",
    lede: "原油 → LNG → JEPX の 2 段伝播、Brent ピークラグ 7-8 ヶ月（LNG より 1-3 ヶ月長い）",
    tags: ["電力", "燃料", "東京", "原油", "ラグ相関"],
    sources: ["World Bank Pink Sheet", "JEPX スポット市場"],
    updated: "2026-05-05",
  },
  {
    slug: "ttf-lag-vs-lng-jp",
    title: "TTF → 日本 LNG CIF：欧州ガス危機は何ヶ月遅れで日本に届くか",
    lede: "ドル建て × ドル建ての純粋燃料伝播、ピーク 3-4 ヶ月（燃料チェーン最上流）",
    tags: ["燃料", "LNG", "TTF", "ラグ相関"],
    sources: ["World Bank Pink Sheet"],
    updated: "2026-05-05",
  },
  {
    slug: "fx-decomp-lng-jepx-tokyo",
    title: "円安 × LNG × JEPX：2022-2023 価格上振れの要因分解",
    lede: "加法 3 要因分解（LNG 要因 + 円安要因 + 相乗効果）、基準月 2020-12 で電気代高騰の正体",
    tags: ["燃料", "為替", "LNG", "東京", "要因分解"],
    sources: ["World Bank Pink Sheet", "日本銀行"],
    updated: "2026-05-05",
  },
  {
    slug: "jgb-vs-yen-lng",
    title: "JGB × LNG：金利と燃料の同時動",
    lede: "10 年物日本国債利回り × LNG の 2 軸時系列、エネルギーと金融の引用インフラ中心軸",
    tags: ["金融", "燃料", "LNG", "JGB"],
    sources: ["World Bank Pink Sheet", "財務省 国債金利"],
    updated: "2026-05-05",
  },
  {
    slug: "precip-hokuriku-vs-price",
    title: "金沢降水量 × 北陸 JEPX：水力ベースロードと豪雪のサイクル",
    lede: "降水量 → ダム水位 → 春の水力出力増 → ベースロード安定の連鎖",
    tags: ["電力", "気象", "北陸", "水力", "降水量"],
    sources: ["JEPX スポット市場", "気象庁 日次降水量"],
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

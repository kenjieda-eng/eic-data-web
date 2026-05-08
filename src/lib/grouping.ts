import type { Insight } from "./insights";

export interface InsightGroup {
  id: string;
  icon: string;
  title: string;
  lede: string;
  slugs: string[];
}

// モック側 mockups/index-v2.html L4290- の groups 定義に追随。
// 実装乖離 (米マクロ系の slug 大半が未実装) は ValidationResult.orphanSlugs として
// SelfCheckPanel に表示する。
export const INSIGHT_GROUPS: InsightGroup[] = [
  {
    id: "weather-x-power",
    icon: "🌡️",
    title: "気象 × 電力",
    lede: "日本の電力卸価格は気温に強く反応する。9 エリアそれぞれの気象官署と JEPX を月次・日次で重ね、夏冬の構造を読み解く編集の核。",
    slugs: [
      "temp-vs-price",
      "temp-min-hokkaido-vs-price",
      "temp-max-kyushu-vs-price",
      "temp-max-tokyo-summer",
      "temp-vs-price-tohoku",
      "temp-vs-price-chubu",
      "temp-vs-price-kansai",
      "temp-vs-price-chugoku",
      "temp-vs-price-shikoku",
      "temp-vs-price-hokuriku",
    ],
  },
  {
    id: "fuel-finance",
    icon: "🔥",
    title: "燃料・金融",
    lede: "気温で説明できない「ベースラインの上下動」を、LNG・原油・TTF・円安・JGB で読み解く。世界市況と日本の電力・金利の連鎖を時系列で並べる。",
    slugs: [
      "lng-vs-price-tokyo",
      "lng-lag-vs-price-tokyo",
      "brent-lag-vs-price-tokyo",
      "ttf-lag-vs-lng-jp",
      "fx-decomp-lng-jepx-tokyo",
    ],
  },
  {
    id: "power-mix",
    icon: "🔌",
    title: "電源構成",
    lede: "METI 電力調査統計 + 気象官署データを活用し、太陽光・原子力・火力・風力・再エネ比率・燃料コスト分解で電源ミックスの動態を見せる。",
    slugs: [
      "solar-vs-sunshine-tokyo",
      "nuclear-vs-jepx-kansai",
      "renewables-share-trend",
      "thermal-vs-lng",
      "thermal-fuel-cost-decomp",
      "wind-vs-wind-hokkaido",
      "wind-vs-wind-hokuriku",
    ],
  },
  {
    id: "climate-geography",
    icon: "🗾",
    title: "気候 × 地理ヒートマップ",
    lede: "気象官署 9 地点 × 36 ヶ月を 5 種類のヒートマップで一望。日照・風速・積雪・降水量・平均気温の地理的グラデーションが、電力需給の構造的偏りを説明する。",
    slugs: [
      "solar-sunshine-9-region-heatmap",
      "wind-9-region-heatmap",
      "snow-9-region-heatmap",
      "precip-9-region-heatmap",
      "temp-9-region-heatmap",
    ],
  },
  {
    id: "demand-water",
    icon: "💧",
    title: "需要・水文",
    lede: "水力ダムの貯水と需要側の構造を見せるグループ。降水量・販売電力量と気温の U 字パターン。",
    slugs: [
      "precip-hokuriku-vs-price",
      "precip-kyushu-vs-price",
      "demand-vs-temp",
    ],
  },
  {
    id: "macro",
    icon: "💰",
    title: "マクロ・金利",
    lede: "為替・長期金利・輸入物価の連動を見る。米 Treasury 4 年限 (2y/10y/30y) + 日本国債 (10y/30y) + 為替 + LNG の連鎖、北極星「日本のエネルギーと金融の引用インフラ」の中心軸グループ。",
    slugs: [
      "jgb-vs-yen-lng",
      "spread-us-jp-10y-vs-fx",
      "us-yield-curve-vs-jp-demand",
      "us-30y-vs-jgb-30y",
      "us-10y-vs-yen-lng",
      "us-2y-vs-jepx-tokyo",
    ],
  },
];

export interface GroupedInsight {
  group: InsightGroup;
  insights: Insight[];
}

export interface ValidationResult {
  orphanSlugs: { groupId: string; slug: string }[];
  unclassifiedSlugs: string[];
  duplicateSlugs: string[];
  totalIssues: number;
}

function findDuplicateSlugs(insights: Insight[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const i of insights) {
    if (seen.has(i.slug)) dups.add(i.slug);
    seen.add(i.slug);
  }
  return [...dups];
}

export function validateInsights(
  insights: Insight[],
  groups: InsightGroup[] = INSIGHT_GROUPS,
): ValidationResult {
  const bySlug = new Map(insights.map((i) => [i.slug, i]));
  const slugsInGroups = new Set<string>();
  const orphanSlugs: { groupId: string; slug: string }[] = [];

  for (const g of groups) {
    for (const slug of g.slugs) {
      slugsInGroups.add(slug);
      if (!bySlug.has(slug)) {
        orphanSlugs.push({ groupId: g.id, slug });
      }
    }
  }

  const unclassifiedSlugs = insights
    .filter((i) => !slugsInGroups.has(i.slug))
    .map((i) => i.slug);

  const duplicateSlugs = findDuplicateSlugs(insights);

  return {
    orphanSlugs,
    unclassifiedSlugs,
    duplicateSlugs,
    totalIssues:
      orphanSlugs.length + unclassifiedSlugs.length + duplicateSlugs.length,
  };
}

export function groupInsights(
  insights: Insight[],
  groups: InsightGroup[] = INSIGHT_GROUPS,
): { groups: GroupedInsight[]; unclassified: Insight[] } {
  const bySlug = new Map(insights.map((i) => [i.slug, i]));
  const slugsInGroups = new Set<string>();

  const grouped: GroupedInsight[] = groups.map((g) => {
    const items: Insight[] = [];
    for (const slug of g.slugs) {
      slugsInGroups.add(slug);
      const found = bySlug.get(slug);
      if (found) items.push(found);
    }
    return { group: g, insights: items };
  });

  const unclassified = insights.filter((i) => !slugsInGroups.has(i.slug));

  return { groups: grouped, unclassified };
}

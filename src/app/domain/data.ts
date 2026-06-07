import { INSIGHTS, type Insight } from "../../lib/insights";

export interface DomainSubcategory {
  name: string;
  description: string;
  matcher: (id: string) => boolean;
}

export interface DomainPageMeta {
  id: string;
  name: string;
  emoji: string;
  description: string;
  insightKeywords: string[];
  subcategories: DomainSubcategory[];
  /**
   * catalog 不在のドメイン (Phase C 以降に系列追加予定)。
   * true の場合、ページに「Phase C 追加予定」の案内バナーを表示。
   */
  metaPage?: boolean;
}

export const DOMAINS_DAY6: DomainPageMeta[] = [
  {
    id: "power",
    name: "電力",
    emoji: "⚡",
    description:
      "JEPX 卸電力価格 9 エリア + システムプライス 1 と、METI 電力調査統計の電源別 8 系列・販売電力量 3 系列・派生 1 を扱うドメイン。気象（気温・降水量・日照）と燃料（LNG・原油）の両方から影響を受け、Insight 群の中核を構成する。再エネ比率や原発再稼働の進捗もここで追える。",
    insightKeywords: ["電力", "原発", "再エネ", "太陽光", "風力", "水力", "火力", "需要", "JEPX"],
    subcategories: [
      {
        name: "JEPX 9 エリア + システム",
        description: "卸電力価格の地域別 + 全国システム値",
        matcher: (id) => id.startsWith("jepx-spot"),
      },
      {
        name: "METI 電源別発電量",
        description: "火力 / 水力 / 原子力 / 太陽光 / 風力 / 地熱 / バイオマス / 総発電",
        matcher: (id) => id.startsWith("meti-gen-"),
      },
      {
        name: "METI 販売電力量",
        description: "電灯 / 電力 / 合計の月次需要",
        matcher: (id) => id.startsWith("meti-demand-"),
      },
      {
        name: "派生・比率指標",
        description: "再エネ比率など派生系列",
        matcher: (id) => id.includes("renewables-share"),
      },
    ],
  },
  {
    id: "weather",
    name: "気象",
    emoji: "🌤️",
    description:
      "気象庁の 9 地点（札幌・仙台・東京・名古屋・金沢・大阪・広島・高松・福岡）について、気温・降水量・日照時間・風速・最深積雪の 5 変数を月次で揃えた catalog 最大規模ドメイン。電力需要や再エネ出力との相関分析の土台となり、Insight #1〜#10 の地域別気温 × JEPX シリーズと #19〜#21 のヒートマップ群を支える。",
    insightKeywords: ["気象", "気温", "降水量", "日照", "風速", "雪", "豪雪"],
    subcategories: [
      {
        name: "気温（9 地点 + 全国平均）",
        description: "JMA 日平均気温の月次集約",
        matcher: (id) => id.startsWith("temp-") || id === "temp-avg",
      },
      {
        name: "降水量（9 地点）",
        description: "JMA 日次降水量の月次集約",
        matcher: (id) => id.startsWith("precip-"),
      },
      {
        name: "日照時間（9 地点）",
        description: "太陽光発電ポテンシャルの裏側指標",
        matcher: (id) => id.startsWith("sunshine-"),
      },
      {
        name: "風速（9 地点）",
        description: "陸上風力ポテンシャルの裏側指標",
        matcher: (id) => id.startsWith("wind-"),
      },
      {
        name: "最深積雪（9 地点）",
        description: "暖房需要 + 融雪需要 + 水力ベースロードの先行指標",
        matcher: (id) => id.startsWith("snow-"),
      },
    ],
  },
  {
    id: "fuel",
    name: "燃料",
    emoji: "🔥",
    description:
      "World Bank Pink Sheet を一次出典とする LNG（JKM / 日本 CIF / Henry Hub / TTF）と原油（Brent / Dubai / WTI）、石炭（豪州 Newcastle）の月次価格。電力ドメインとの 2 軸時系列・ラグ相関・要因分解の起点となり、Insight #11〜#15 の燃料伝播シリーズで主役を務める。すべて月次・public-domain 系列。",
    insightKeywords: ["燃料", "LNG", "原油", "TTF", "石炭"],
    subcategories: [
      {
        name: "LNG（4 系列）",
        description: "JKM / 日本 CIF / Henry Hub / TTF",
        matcher: (id) => id.includes("lng") || id.includes("ng-"),
      },
      {
        name: "原油（3 系列）",
        description: "Brent / Dubai / WTI",
        matcher: (id) => id.includes("crude"),
      },
      {
        name: "石炭",
        description: "Newcastle 指標（豪州）",
        matcher: (id) => id.includes("coal"),
      },
    ],
  },
];

const DOMAINS_DAY7_ADDITIONS: DomainPageMeta[] = [
  {
    id: "finance",
    name: "金融",
    emoji: "💰",
    description:
      "エネルギーと金融の引用インフラ中心軸。USD/JPY 月次 4 系列（月中平均 / 月末値 / 月内高値・安値、BOJ FM08）と JGB 10y・30y 新発金利（財務省）、米国国債 2y/5y/10y/30y（U.S. Treasury Daily Yields）を組み合わせ、日米金利差・イールドカーブ・超長期スプレッド・円安要因分解など Insight #16-#17 + #35-#39 の主役を担う。Phase 3-B 第 2 弾（5/11 完走）の米マクロ 3 系列は別ドメイン (macro) に分離、Insight #40-#42 で連結予定。",
    insightKeywords: [
      "金融",
      "為替",
      "USD/JPY",
      "ドル円",
      "円安",
      "金利",
      "JGB",
      "国債",
      "イールド",
      "スプレッド",
      "FRB",
    ],
    subcategories: [
      {
        name: "USD/JPY 為替（月次 4 系列）",
        description: "BOJ FM08 月中平均 / 月末値 / 月内高値・安値",
        matcher: (id) => id.startsWith("fx-usdjpy-"),
      },
      {
        name: "JGB（日本国債新発金利）",
        description: "財務省 10 年 / 30 年新発金利、日次",
        matcher: (id) => id.startsWith("jgb-"),
      },
      {
        name: "U.S. Treasury（米国国債）",
        description: "U.S. Treasury Daily Yields 2y / 5y / 10y / 30y、日次",
        matcher: (id) => id.startsWith("us-treasury-"),
      },
    ],
  },
  {
    id: "economy",
    name: "経済",
    emoji: "📊",
    description:
      "GDP・CPI・鉱工業生産・貿易などのマクロ経済指標を扱う編集軸ドメイン。catalog には Phase C 以降で順次追加予定（β 段階では未掲載）。Phase 3-B 第 2 弾（5/11 完走）で米 CPI / Fed Funds Rate / 米鉱工業生産の 3 系列が `macro` ドメインに着地済、Insight #40-#42 で景気サイクル × エネルギーの連結を進める。日本側マクロ（日銀短観・GDP 統計）は Phase C の D-013 メタデータ整備後に追加。",
    insightKeywords: ["経済", "景気", "マクロ", "GDP", "CPI", "鉱工業"],
    subcategories: [],
    metaPage: true,
  },
  {
    id: "policy",
    name: "制度",
    emoji: "📜",
    description:
      "FIT/FIP（再エネ買取制度）、GX-ETS（排出量取引）、容量市場、系統運用ルール、原子力規制委員会の審査進捗など、エネルギー市場の構造を決める「制度」を扱う編集軸ドメイン。catalog には Phase C 以降で順次追加予定（β 段階では Insight 内の引用に留まる）。電源構成・燃料転換・再エネ導入ペースの長期トレンドを読み解く際の前提条件として、各 Insight から本ドメインを参照する設計。",
    insightKeywords: ["制度", "FIT", "FIP", "GX", "ETS", "容量市場", "系統", "規制"],
    subcategories: [],
    metaPage: true,
  },
];

export const DOMAINS_DAY7: DomainPageMeta[] = [
  ...DOMAINS_DAY6,
  ...DOMAINS_DAY7_ADDITIONS,
];

const DOMAINS_DAY8_ADDITIONS: DomainPageMeta[] = [
  {
    id: "esg",
    name: "ESG / サステナ",
    emoji: "🌱",
    description:
      "EU ETS（EU 排出量取引制度）の検証排出量を一次データとするドメイン。EUTL（EU Transaction Log）／欧州環境機関（EEA）由来で、EU 全体の部門別 8 系列と加盟国別の合計 31 系列、計 39 系列（2005-2025、年次、Mt-CO2e）を収録。日本の GX-ETS との比較や、脱炭素ペースの国際ベンチマークの土台となる。ライセンスは EEA 再利用ポリシー（出典明記で商用可）。",
    insightKeywords: ["ESG", "排出量", "CO2", "脱炭素", "カーボン", "EU ETS", "排出枠", "GX"],
    subcategories: [
      {
        name: "部門別 検証排出量（EU 全体・8 部門）",
        description: "航空 / 燃料燃焼 / 製油 / 鉄鋼 / セメント / 石灰 / 製紙 / 化学",
        matcher: (id) =>
          id.startsWith("eu-ets-emissions-") &&
          !id.startsWith("eu-ets-emissions-country-"),
      },
      {
        name: "加盟国別 合計検証排出量（31 か国）",
        description: "EU ETS 対象国の全部門合計（年次）",
        matcher: (id) => id.startsWith("eu-ets-emissions-country-"),
      },
    ],
    // metaPage 削除（catalog 着地により実ドメイン化）
  },
  {
    id: "tech",
    name: "技術",
    emoji: "🔋",
    description:
      "NREL ATB（Annual Technology Baseline）を一次出典とする米国の発電技術コストドメイン。発電コスト LCOE（$/MWh）・資本費 CAPEX（$/kW）・容量率（%）の 3 指標を、太陽光・陸上/洋上風力・原子力・地熱・水力・バイオマス・CSP など 10 技術 + 蓄電池 CAPEX の計 31 系列で揃える。米国コスト前提・各年版の当年値（2021-2024 年版、将来射影は非収載）で、技術別のコスト水準と年版間の変化を横断比較できる。ライセンスは CC BY 4.0。",
    insightKeywords: ["技術", "LCOE", "蓄電池", "太陽光", "風力", "原子力", "発電コスト", "CAPEX"],
    subcategories: [
      {
        name: "発電コスト LCOE（$/MWh）",
        description: "NREL ATB 均等化発電原価、10 技術",
        matcher: (id) => id.startsWith("atb-lcoe-"),
      },
      {
        name: "資本費 CAPEX（$/kW）",
        description: "NREL ATB 設備資本費、10 技術 + 蓄電池",
        matcher: (id) => id.startsWith("atb-capex-"),
      },
      {
        name: "容量率（%）",
        description: "NREL ATB 設備利用率、10 技術",
        matcher: (id) => id.startsWith("atb-cf-"),
      },
    ],
  },
  {
    id: "international",
    name: "国際",
    emoji: "🌐",
    description:
      "ECB（欧州中央銀行）政策金利 3 系列（DFR / MLF / MRR）と EUR/USD・EUR/JPY 為替（ECB Reference Rate 月平均）、Ember 主要 5 ヶ国（日米英独中）の電力部門 CO2 排出強度・月次発電量・月次需要を月次で揃える Phase 2 第 1 期ドメイン。日米金利差 × USD/JPY と並ぶ「ECB × Fed × EUR/USD」軸を提供し、日本国内の燃料・電力市場を海外電力市況・主要中央銀行政策と結びつける編集の起点として機能する。",
    insightKeywords: [
      "国際",
      "ECB",
      "Fed",
      "EUR/USD",
      "EUR/JPY",
      "Ember",
      "海外電力",
      "中央銀行",
      "為替",
    ],
    subcategories: [
      {
        name: "ECB 政策金利（3 系列）",
        description: "欧州中央銀行 DFR / MLF / MRR、月次",
        matcher: (id) => id.startsWith("ecb-rate-"),
      },
      {
        name: "EUR 為替（2 系列）",
        description: "ECB Reference Rate 月平均、EUR/USD・EUR/JPY",
        matcher: (id) => id.startsWith("fx-eur"),
      },
      {
        name: "Ember 電力部門 CO2 排出強度（5 ヶ国）",
        description: "日米英独中の電力部門 gCO2/kWh、月次",
        matcher: (id) => id.startsWith("ember-co2-intensity-"),
      },
      {
        name: "Ember 月次発電量（5 ヶ国）",
        description: "日米英独中の月次総発電量 TWh",
        matcher: (id) => id.startsWith("ember-generation-"),
      },
      {
        name: "Ember 月次電力需要（5 ヶ国）",
        description: "日米英独中の月次電力需要 TWh",
        matcher: (id) => id.startsWith("ember-demand-"),
      },
    ],
  },
  {
    id: "population",
    name: "人口",
    emoji: "👥",
    description:
      "政府統計の総合窓口（e-Stat）人口推計を一次出典とする、都道府県別の人口ドメイン。総人口・65 歳以上人口・生産年齢人口（15-64 歳）の 3 指標を 47 都道府県すべてで揃え、計 141 系列（2016-2024 年・年次・各年 10 月 1 日現在・千人）を収録する。電力需要の最も基礎的な母数である「人口」と、高齢化・東京一極集中・地方急減といった地域分化を、電力・需要データと同じ場所で並べられる。ライセンスは estat-terms（出典明示で再利用可）。",
    insightKeywords: ["人口", "高齢化", "都道府県", "人口減少", "生産年齢", "需要"],
    subcategories: [
      {
        name: "総人口（47 都道府県）",
        description: "e-Stat 人口推計 総人口、年次・千人",
        matcher: (id) => id.startsWith("jpn-pop-total-"),
      },
      {
        name: "65 歳以上人口（47 都道府県）",
        description: "高齢化率の母数、年次・千人",
        matcher: (id) => id.startsWith("jpn-pop-65over-"),
      },
      {
        name: "生産年齢人口 15-64（47 都道府県）",
        description: "労働力の母数、年次・千人",
        matcher: (id) => id.startsWith("jpn-pop-working-"),
      },
    ],
  },
];

export const DOMAINS_DAY8: DomainPageMeta[] = [
  ...DOMAINS_DAY7,
  ...DOMAINS_DAY8_ADDITIONS,
];

export function getDomainById(id: string): DomainPageMeta | undefined {
  return DOMAINS_DAY8.find((d) => d.id === id);
}

export function findRelatedInsightsForDomain(
  meta: DomainPageMeta,
  insights: Insight[] = INSIGHTS,
  limit = 12,
): Insight[] {
  const keywords = meta.insightKeywords.map((k) => k.toLowerCase());
  if (keywords.length === 0) return [];
  const scored = insights
    .map((insight) => {
      const haystack = [
        insight.title,
        insight.lede,
        insight.tags.join(" "),
        insight.sources.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const score = keywords.reduce(
        (acc, kw) => (kw && haystack.includes(kw) ? acc + 1 : acc),
        0,
      );
      return { insight, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.insight);
}

export function groupIndicatorsBySubcategory<T extends { id: string }>(
  meta: DomainPageMeta,
  rows: T[],
): { sub: DomainSubcategory; rows: T[] }[] {
  const used = new Set<string>();
  const groups = meta.subcategories.map((sub) => {
    const matched = rows.filter((r) => {
      if (used.has(r.id)) return false;
      if (sub.matcher(r.id)) {
        used.add(r.id);
        return true;
      }
      return false;
    });
    return { sub, rows: matched };
  });
  return groups.filter((g) => g.rows.length > 0);
}

import { INSIGHTS, type Insight } from "../../lib/insights";

export interface DomainSubcategory {
  /**
   * グループ見出し。**系列数を書かないこと**。
   * DomainIndicatorTable が見出しの直後に実行数 (`g.rows.length` 系列) を必ず描画するため、
   * 名前に「（N 系列）」を埋めると二重表示になり、しかも catalog 側が増減すると静かに
   * 食い違う (2026-08-13 時点で fuel「LNG（4 系列）」が実 3 系列と衝突していた)。
   * 「9 地点」「5 ヶ国」「47 都道府県」のような**実体の次元**は系列数ではないので可。
   */
  name: string;
  description: string;
  matcher: (id: string) => boolean;
}

export interface DomainPageMeta {
  id: string;
  name: string;
  emoji: string;
  /**
   * ドメイン説明文。総系列数は手書きせず `SERIES_COUNT_TOKEN` を埋め、
   * 描画時に `resolveDomainDescription` で catalog の実行数に解決する。
   */
  description: string;
  insightKeywords: string[];
  subcategories: DomainSubcategory[];
  /**
   * catalog 不在のドメイン (Phase C 以降に系列追加予定)。
   * true の場合、ページに「Phase C 追加予定」の案内バナーを表示。
   */
  metaPage?: boolean;
}

/**
 * description 中に埋める系列数プレースホルダ。描画時に catalog の実行数で置換する。
 *
 * 手書きの「計 N 系列」は pipeline 側に系列が増えても更新されず静かに陳腐化する
 * (2026-08-10 時点で esg は 72→90、regulation は 5→11 とズレていた)。
 * DOMAINS 側では総数を持たず、必ず resolveDomainDescription 経由で解決する。
 */
export const SERIES_COUNT_TOKEN = "{{seriesCount}}";

/**
 * meta.description の {{seriesCount}} を実系列数に解決する。
 * DomainHeader / /domain カード / generateMetadata の 3 経路すべてがここを通る。
 */
export function resolveDomainDescription(
  meta: DomainPageMeta,
  seriesCount: number,
): string {
  return meta.description.split(SERIES_COUNT_TOKEN).join(String(seriesCount));
}

export const DOMAINS_DAY6: DomainPageMeta[] = [
  {
    id: "power",
    name: "電力",
    emoji: "⚡",
    description:
      `JEPX 卸電力価格 9 エリア + システムプライス 1 を軸に、需給調整市場（商品区分別の約定単価・不足率）と容量市場メインオークション（エリア別の約定価格・約定容量）、METI 電力調査統計の電源別 8 系列・販売電力量 3 系列・派生 1 を合わせ、計 ${SERIES_COUNT_TOKEN} 系列を扱うドメイン。気象（気温・降水量・日照）と燃料（LNG・原油）の両方から影響を受け、Insight 群の中核を構成する。再エネ比率や原発再稼働の進捗に加え、kW 価値（容量市場）と ΔkW 価値（需給調整市場）の市場価格もここで追える。`,
    insightKeywords: ["電力", "原発", "再エネ", "太陽光", "風力", "水力", "火力", "需要", "JEPX"],
    subcategories: [
      {
        name: "JEPX 9 エリア + システム",
        description: "卸電力価格の地域別 + 全国システム値",
        matcher: (id) => id.startsWith("jepx-spot"),
      },
      {
        name: "需給調整市場 約定単価（商品区分 × 電源種別）",
        description:
          "一次 / 二次① / 二次② / 三次① / 三次② / 複合商品 × 全体・火力・水力・揚水・蓄電池・VPP、年次",
        matcher: (id) => id.startsWith("balancing-price-"),
      },
      {
        name: "需給調整市場 不足率（商品区分別）",
        description: "商品区分ごとの年間募集量に対する未達率、年次",
        matcher: (id) => id.startsWith("balancing-shortage-"),
      },
      {
        name: "容量市場 メインオークション 約定価格（エリア別）",
        description: "9 エリア + 全国加重平均の約定価格、年次",
        matcher: (id) => id.startsWith("capacity-main-auction-price-"),
      },
      {
        name: "容量市場 メインオークション 約定容量（エリア別）",
        description: "9 エリア + 合計の約定容量、年次",
        matcher: (id) => id.startsWith("capacity-main-auction-volume-"),
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
      "気象庁の 9 地点（札幌・仙台・東京・名古屋・金沢・大阪・広島・高松・福岡）について、気温 3 種（日平均・日最高・日最低）・降水量・日照時間・平均風速・最大風速時風向・最深積雪の 8 観測変数を日次で揃えたドメイン。電力需要や再エネ出力との相関分析の土台となり、Insight #1〜#10 の地域別気温 × JEPX シリーズと #26〜#31 の「9 地点 × 36 ヶ月」ヒートマップ群を支える。",
    insightKeywords: ["気象", "気温", "降水量", "日照", "風速", "雪", "豪雪"],
    // matcher は catalog の実 ID プレフィックス `jma-<観測項目>-` に揃える。
    // 旧 matcher は `temp-` / `precip-` 等の非 `jma-` 命名を見ており、72 系列すべてが
    // 「その他」に落ちていた (2026-08-10 修正)。
    subcategories: [
      {
        name: "気温（9 地点 × 平均・最高・最低）",
        description: "JMA 日平均 / 日最高 / 日最低気温、日次",
        matcher: (id) => id.startsWith("jma-temp-"),
      },
      {
        name: "降水量（9 地点）",
        description: "JMA 日降水量合計、日次",
        matcher: (id) => id.startsWith("jma-precip-"),
      },
      {
        name: "日照時間（9 地点）",
        description: "太陽光発電ポテンシャルの裏側指標、日次",
        matcher: (id) => id.startsWith("jma-sunshine-"),
      },
      {
        name: "風速・風向（9 地点 × 平均風速・最大風速時風向）",
        description: "陸上風力ポテンシャルの裏側指標、日次",
        matcher: (id) => id.startsWith("jma-wind-"),
      },
      {
        name: "最深積雪（9 地点）",
        description: "暖房需要 + 融雪需要 + 水力ベースロードの先行指標、日次",
        matcher: (id) => id.startsWith("jma-snow-"),
      },
    ],
  },
  {
    id: "fuel",
    name: "燃料",
    emoji: "🔥",
    description:
      "World Bank Pink Sheet を一次出典とする LNG・天然ガス（日本 CIF / Henry Hub / TTF）と原油（Brent / Dubai / WTI）、石炭（豪州 Newcastle）の月次価格。加えて同じ Pink Sheet 由来の非燃料コモディティとして鉄鉱石（commodity-iron-ore、中国輸入 CFR スポット）が同居し、鉄鋼業を介した資源価格 → 国内電力需要の連動（Insight #51）の材料になる。電力ドメインとの 2 軸時系列・ラグ相関・要因分解の起点となり、Insight #11〜#15 の燃料伝播シリーズで主役を務める。すべて月次・CC BY 4.0。",
    insightKeywords: ["燃料", "LNG", "原油", "TTF", "石炭"],
    subcategories: [
      {
        name: "LNG・天然ガス",
        description: "日本 LNG 輸入価格（CIF）/ Henry Hub / TTF",
        matcher: (id) => id.includes("lng") || id.includes("ng-"),
      },
      {
        name: "原油",
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
      "エネルギーと金融の引用インフラ中心軸。USD/JPY 月次 4 系列（月中平均 / 月末値 / 月内高値・安値、BOJ FM08）と JGB 10y・30y 新発金利（財務省）、米国国債 2y/5y/10y/30y（U.S. Treasury Daily Yields）を組み合わせ、日米金利差・イールドカーブ・超長期スプレッド・円安要因分解など Insight #15-#16 + #35-#39 の主役を担う。米マクロ（FRED）と日銀短観は catalog では別ドメイン (macro) にあり、web では経済ドメインに内包して Insight #40-#42 の米マクロ × エネルギー連結シリーズにつないでいる。",
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
        name: "USD/JPY 為替（月次）",
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
      `日米のマクロ経済指標を扱うドメイン。日本側の CPI（前年比）・鉱工業生産指数に加え、catalog の \`macro\` 系列として米 CPI（総合 / 食料 / エネルギー）・Fed Funds Rate・米鉱工業生産・米雇用統計（非農業部門雇用者数・失業率）・日銀短観 DI（大企業 / 中小企業 × 製造 / 非製造）を内包し、計 ${SERIES_COUNT_TOKEN} 系列を月次・四半期で揃える。景気サイクルと為替・燃料・電力市場の連結を読む土台となり、Insight #40-#42 の米マクロ × エネルギー連結シリーズを支える。`,
    insightKeywords: ["経済", "景気", "マクロ", "GDP", "CPI", "鉱工業", "短観", "雇用"],
    subcategories: [
      {
        name: "日本マクロ（CPI・鉱工業生産）",
        description: "総務省 CPI 前年比 / 経産省 鉱工業生産指数、月次",
        matcher: (id) => id.startsWith("jpn-"),
      },
      {
        name: "米国マクロ（CPI・金利・生産・雇用）",
        description: "米 CPI / Fed Funds / 鉱工業生産 / 雇用統計、月次",
        matcher: (id) => id.startsWith("us-"),
      },
      {
        name: "日銀短観 DI（4 区分）",
        description: "大企業 / 中小企業 × 製造業 / 非製造業、四半期",
        matcher: (id) => id.startsWith("tankan-"),
      },
    ],
  },
  {
    id: "regulation",
    name: "制度",
    emoji: "📜",
    description:
      `再エネ FIT（固定価格買取制度）の買取価格と非化石証書の市場データを一次データとするドメイン。太陽光（事業用）・陸上風力・小水力・地熱・木質バイオマスの電源別買取価格（円/kWh・年度）に、FIT / 非 FIT 非化石証書の約定価格と約定量を加え、計 ${SERIES_COUNT_TOKEN} 系列を収録する。GX-ETS（排出量取引）・容量市場・系統運用ルールなどエネルギー市場の構造を決める「制度」の編集軸でもある（ただし容量市場の約定データは電力ドメイン、EU ETS は ESG ドメインに収録）。再エネ導入ペースや電源構成の長期トレンドを読み解く前提条件として各 Insight から参照される。`,
    insightKeywords: ["制度", "FIT", "FIP", "買取価格", "再エネ", "GX", "ETS", "容量市場", "系統", "規制"],
    subcategories: [
      {
        name: "FIT 買取価格（電源別）",
        description: "太陽光（事業用）/ 陸上風力 / 小水力 / 地熱 / 木質バイオマス、年度",
        matcher: (id) => id.startsWith("fit-price-"),
      },
      {
        name: "非化石証書（約定価格・約定量）",
        description:
          "FIT 証書（再エネ価値取引市場）/ 非 FIT 証書（高度化法義務達成市場、再エネ指定含む）の価格・量",
        matcher: (id) => id.startsWith("nonfossil-cert-"),
      },
    ],
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
      `EU ETS（EU 排出量取引制度）と日本の温室効果ガスインベントリを一次データとするドメイン。EUTL（EU Transaction Log）／欧州環境機関（EEA）由来の検証排出量（EU 全体の部門別 8 系列 + 加盟国別 31 系列）と排出枠（割当 EU 全体 + 加盟国別 32 系列・オークション 1 系列、2005-2025・年次）に、国立環境研究所 GIO の日本の温室効果ガス排出量（総排出量 / ネット / ガス別 / 部門別 CO2、1990-2024 年度）を加え、計 ${SERIES_COUNT_TOKEN} 系列を収録。日本の GX-ETS との比較や、脱炭素ペースの国際ベンチマークの土台となる。ライセンスは EEA 再利用ポリシー（出典明記で商用可）と GIO 利用規約。`,
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
      {
        name: "排出枠 割当（EU 全体 + 加盟国別）",
        description: "無償・有償割当の合計枠数（年次）",
        matcher: (id) => id.startsWith("eu-ets-allowances-allocated"),
      },
      {
        name: "排出枠 オークション量",
        description: "EU 全体のオークション供給枠数（年次）",
        matcher: (id) => id.startsWith("eu-ets-allowances-auctioned"),
      },
      {
        name: "日本 温室効果ガス 総排出量・ガス別",
        description:
          "GIO インベントリ 総排出量 / ネット / 森林等吸収量 / CO2・CH4・N2O・代替フロン等 4 ガス、年度",
        matcher: (id) =>
          id.startsWith("jp-ghg-") && !id.startsWith("jp-ghg-co2-"),
      },
      {
        name: "日本 温室効果ガス 部門別・起源別 CO2",
        description:
          "産業 / 運輸 / 業務その他 / 家庭 / エネルギー転換（電気・熱配分後）とエネルギー起源・非エネルギー起源、年度",
        matcher: (id) => id.startsWith("jp-ghg-co2-"),
      },
    ],
    // metaPage 削除（catalog 着地により実ドメイン化）
  },
  {
    id: "tech",
    name: "技術",
    emoji: "🔋",
    description:
      `NREL ATB（Annual Technology Baseline）を一次出典とする米国の発電技術コストドメイン。発電コスト LCOE（$/MWh）・資本費 CAPEX（$/kW）・容量率（%）の 3 指標を、太陽光・陸上/洋上風力・原子力・地熱・水力・バイオマス・CSP など 10 技術 + 蓄電池 CAPEX の計 ${SERIES_COUNT_TOKEN} 系列で揃える。米国コスト前提・各年版の当年値（2021-2024 年版、将来射影は非収載）で、技術別のコスト水準と年版間の変化を横断比較できる。ライセンスは CC BY 4.0。`,
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
      `ECB（欧州中央銀行）政策金利 3 系列（DFR / MLF / MRR）と EUR/USD・EUR/JPY 為替（ECB Reference Rate 月平均）、Ember 主要 5 ヶ国（日米英独中）の電力部門 CO2 排出強度・発電量・電力需要と 5 ヶ国 × 7 電源の発電量シェア、中国 NBS 製造業 PMI を、すべて月次・計 ${SERIES_COUNT_TOKEN} 系列で揃えるドメイン。日米金利差 × USD/JPY と並ぶ「ECB × Fed × EUR/USD」軸を提供し、日本国内の燃料・電力市場を海外電力市況・主要中央銀行政策と結びつける編集の起点として機能する。`,
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
        name: "ECB 政策金利",
        description: "欧州中央銀行 DFR / MLF / MRR、月次",
        matcher: (id) => id.startsWith("ecb-rate-"),
      },
      {
        name: "EUR 為替",
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
      {
        // ID が `ember-share-<電源>-<国>` で電源が主キー。ページ内の他グループが
        // すべて「1 指標 × 全 5 ヶ国」で切られているため、国別ではなく指標種別で束ねる。
        name: "Ember 電源種別 発電量シェア（5 ヶ国 × 7 電源）",
        description:
          "石炭 / ガス / 原子力 / 水力 / 太陽光 / 風力 / バイオの発電量シェア %、月次",
        matcher: (id) => id.startsWith("ember-share-"),
      },
      {
        name: "中国 製造業 PMI",
        description: "国家統計局（NBS）官製 PMI、季節調整済・月次",
        matcher: (id) => id.startsWith("china-nbs-"),
      },
    ],
  },
  {
    id: "population",
    name: "人口",
    emoji: "👥",
    description:
      `政府統計の総合窓口（e-Stat）人口推計を一次出典とする、都道府県別の人口ドメイン。総人口・65 歳以上人口・生産年齢人口（15-64 歳）の 3 指標を 47 都道府県すべてで揃え、計 ${SERIES_COUNT_TOKEN} 系列（2016-2024 年・年次・各年 10 月 1 日現在・千人）を収録する。電力需要の最も基礎的な母数である「人口」と、高齢化・東京一極集中・地方急減といった地域分化を、電力・需要データと同じ場所で並べられる。ライセンスは estat-terms（出典明示で再利用可）。`,
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

// Polish #2 (2026-06-15): 残る 2 ドメインを catalog 着地に合わせて整備。
// geopolitics(財務省 貿易統計・輸入額 23 系列) と corp_ir(EDINET 電力 9 社 45 系列) を
// 追加し、正準 12 ドメインを web の /domain 導線に出揃わせた。すべて metaPage は false。
const DOMAINS_POLISH2_ADDITIONS: DomainPageMeta[] = [
  {
    id: "geopolitics",
    name: "地政",
    emoji: "🌏",
    description:
      `財務省 貿易統計（e-Stat 普通貿易統計 品別国別表・輸入）を一次出典とする、日本のエネルギー輸入額を相手国別に追うドメイン。原油・LNG・石炭の 3 燃料について、主要相手国 + 合計の輸入額（年次・千円）を計 ${SERIES_COUNT_TOKEN} 系列で揃える。中東依存・ロシア産の動向・調達多角化など、エネルギー安全保障と地政学リスクを金額ベースで可視化し、Insight #76 日本のエネルギー輸入相手国・#77 原油一極化×LNG多様の土台となる。`,
    insightKeywords: ["地政", "エネルギー安全保障", "輸入", "原油", "LNG", "石炭", "中東", "ロシア"],
    subcategories: [
      {
        name: "原油 輸入額（相手国別）",
        description: "サウジ / UAE / カタール / クウェート / オマーン / 米 + 合計、年次",
        matcher: (id) => id.startsWith("jp-import-value-crude-"),
      },
      {
        name: "LNG 輸入額（相手国別）",
        description: "豪 / 米 / カタール / マレーシア / ロシア 等 + 合計、年次",
        matcher: (id) => id.startsWith("jp-import-value-lng-"),
      },
      {
        name: "石炭 輸入額（相手国別）",
        description: "豪 / インドネシア / 米 / ロシア / カナダ / 南ア + 合計、年次",
        matcher: (id) => id.startsWith("jp-import-value-coal-"),
      },
    ],
  },
  {
    id: "corp_ir",
    name: "企業IR",
    emoji: "📑",
    description:
      `EDINET（金融庁 有価証券報告書）を一次出典とする、電力大手 9 社の財務指標ドメイン。北海道・東北・東京・中部・北陸・関西・中国・四国・九州の各電力について、売上高（営業収益）・営業利益・経常利益・純利益・総資産の 5 指標を連結・年次で揃え、計 ${SERIES_COUNT_TOKEN} 系列を収録する。燃料費高騰局面の収益悪化と回復、規模と収益性のばらつきを横断比較でき、Insight #79 燃料危機×回復・#80 規模×収益性を支える。`,
    insightKeywords: ["企業IR", "電力会社", "財務", "売上高", "営業利益", "経常利益", "純利益", "EDINET"],
    subcategories: [
      {
        name: "売上高（電力 9 社）",
        description: "EDINET 有報 営業収益（売上高）、連結・年次",
        matcher: (id) => id.endsWith("-revenue"),
      },
      {
        name: "営業利益（電力 9 社）",
        description: "本業の利益、年次",
        matcher: (id) => id.endsWith("-operating-income"),
      },
      {
        name: "経常利益（電力 9 社）",
        description: "金融損益込みの利益、年次",
        matcher: (id) => id.endsWith("-ordinary-income"),
      },
      {
        name: "純利益（電力 9 社）",
        description: "当期純利益、年次",
        matcher: (id) => id.endsWith("-net-income"),
      },
      {
        name: "総資産（電力 9 社）",
        description: "期末総資産、年次",
        matcher: (id) => id.endsWith("-total-assets"),
      },
    ],
  },
];

/**
 * 正準 12 ドメインのページメタ全集合 (/domain 導線が参照する唯一の一覧)。
 * pipeline catalog の実 domain ID (power/fuel/finance/weather/esg/tech/
 * geopolitics/regulation/population/corp_ir/international/economy) に 1:1 で対応する。
 */
export const DOMAINS: DomainPageMeta[] = [
  ...DOMAINS_DAY8,
  ...DOMAINS_POLISH2_ADDITIONS,
];

export function getDomainById(id: string): DomainPageMeta | undefined {
  return DOMAINS.find((d) => d.id === id);
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

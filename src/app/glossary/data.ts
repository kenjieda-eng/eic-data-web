export type GlossaryCategory =
  | "basic"
  | "regulation"
  | "fuel"
  | "power"
  | "finance";

export interface GlossaryTerm {
  slug: string;
  name: string;
  description: string;
  category: GlossaryCategory;
}

export const GLOSSARY_CATEGORIES: Record<GlossaryCategory, string> = {
  basic: "基本",
  regulation: "制度",
  fuel: "燃料",
  power: "電力",
  finance: "金融・マクロ",
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: "jepx-spot",
    name: "JEPX スポット",
    description:
      "日本卸電力取引所のスポット市場（前日市場）価格。",
    category: "basic",
  },
  {
    slug: "lng-jkm",
    name: "JKM",
    description:
      "Japan Korea Marker。北東アジア LNG スポット指標。",
    category: "fuel",
  },
  {
    slug: "fit",
    name: "FIT / FIP",
    description:
      "再エネ固定価格買取制度 / フィードインプレミアム。買取期間 10〜20 年、調達コストは賦課金で需要家負担。",
    category: "regulation",
  },
  {
    slug: "gx-ets",
    name: "GX-ETS",
    description:
      "日本の排出量取引制度（GX-ETS）。2026 年 4 月から本格稼働。",
    category: "regulation",
  },
  {
    slug: "peak-demand",
    name: "ピーク需要",
    description:
      "年間／季節最大電力需要。日本は夏ピーク（猛暑日 14 時前後）と冬ピーク（寒波早朝）の二重構造。",
    category: "power",
  },
  {
    slug: "capacity",
    name: "容量市場",
    description:
      "将来の供給力を事前に取引する市場。日本では 2024 年度から本格運用。",
    category: "regulation",
  },
  {
    slug: "imbalance",
    name: "インバランス",
    description: "計画と実績の差に対する補給・精算制度。",
    category: "regulation",
  },
  {
    slug: "scope123",
    name: "Scope 1/2/3",
    description:
      "温室効果ガス排出の直接・間接・サプライチェーン分類。",
    category: "basic",
  },
  {
    slug: "wacc",
    name: "WACC",
    description: "加重平均資本コスト。",
    category: "finance",
  },
  {
    slug: "eua",
    name: "EUA",
    description: "EU 排出枠（EU-ETS）。",
    category: "regulation",
  },
  {
    slug: "baseload",
    name: "ベースロード",
    description:
      "24 時間連続で運転される電源（原子力・大型水力・石炭・地熱など）。需要の年間最低水準を満たす。日本は震災後に火力依存度が上昇したが、再稼働で原子力が一部復帰。",
    category: "power",
  },
  {
    slug: "fuel-adj",
    name: "燃料費調整制度",
    description:
      "LNG・石炭・石油の輸入価格変動を、平均値±50% の範囲で電力小売料金に自動転嫁する制度。1996 年導入。燃料コストショックの真の影響は卸価格より小売料金に出る。",
    category: "regulation",
  },
  {
    slug: "fuel-shock",
    name: "燃料コストショック",
    description:
      "国際エネルギー市場（LNG・原油）の急騰で、火力発電のコストが急上昇する現象。2022 年欧州ガス危機で日本 LNG-CIF が 3 倍に。電力会社の収益に直撃する。",
    category: "fuel",
  },
  {
    slug: "cutout-wind",
    name: "カットアウト風速",
    description:
      "風車が安全停止する風速の上限（一般に 25 m/s 前後）。それ以上では発電を停止。出力曲線は風速の 3 乗則に従い、定格風速（12〜15 m/s）でピーク。",
    category: "power",
  },
  {
    slug: "pumped-hydro",
    name: "揚水水力",
    description:
      "夜間の余剰電力で水を上池に汲み上げ、昼間に発電する貯蔵型水力。日本の蓄電容量の主力。再エネ普及で日中の余剰を吸収する役割が変化。",
    category: "power",
  },
  {
    slug: "grid-constraint",
    name: "系統制約",
    description:
      "送電線・変電設備の容量制限により、発電所が最大出力を出せない状態。北海道〜本州の連系線、九州エリアでの太陽光出力抑制が代表例。",
    category: "power",
  },
  {
    slug: "curtailment",
    name: "出力制御",
    description:
      "系統制約・需給バランス維持のため、再エネ電源（主に太陽光）の発電を強制的に停止する措置。九州・四国・東北で実施実績あり。",
    category: "power",
  },
  {
    slug: "cif-price",
    name: "CIF 価格",
    description:
      "Cost, Insurance and Freight。輸入価格に運賃・保険料を含めた港着価格。LNG-CIF 日本は World Bank Pink Sheet で月次公表。",
    category: "fuel",
  },
  {
    slug: "yield-curve",
    name: "イールドカーブ",
    description:
      "同一の発行体（例: 米国財務省、日本財務省）が発行する債券の、満期年数と利回りの関係を示す曲線。通常は右上がり（長期ほど高利回り）だが、景気後退の前兆として「逆イールド」（短期金利が長期金利を上回る）が観測されることがある。米 30y - 2y はその代表的な指標。",
    category: "finance",
  },
  {
    slug: "spread",
    name: "スプレッド（金利差）",
    description:
      "2 つの金利の差。日米 10 年金利差（米 10y - JGB 10y）は円キャリートレードの収益性を直接決め、為替レート（USD/JPY）の主要な決定要因の 1 つ。Insight #35 はこの構造を可視化。",
    category: "finance",
  },
  {
    slug: "fed-funds-rate",
    name: "FF レート",
    description:
      "FRB（米連邦準備制度）が決定する政策金利。商業銀行間の翌日物金利の誘導目標で、米国の金融政策スタンスを直接表現する。米 2 年国債金利（米 2y）は今後 1〜2 年の FF レート期待値を市場が織り込んだもの。Insight #38 で扱う。",
    category: "finance",
  },
  {
    slug: "treasury-bill",
    name: "T-Bill / 米国財務省証券",
    description:
      "米国政府が発行する債券の総称。期間 1 年以内が T-Bill、1〜10 年が T-Note、10 年超が T-Bond。EIC Data は米 2y/5y/10y/30y の 4 系列を Phase 3-A で取得（U.S. Treasury Daily Yields, public-domain）。",
    category: "finance",
  },
  {
    slug: "inversion",
    name: "逆イールド（金利逆転）",
    description:
      "通常は長期金利 > 短期金利となるイールドカーブが、短期金利 > 長期金利に逆転する現象。FRB の急激な利上げ局面で発生し、過去 50 年で景気後退の先行指標として高い的中率を持つ。2022-2023 年の米国で深い逆イールドが発生。Insight #36 で日本電力需要への波及を見る。",
    category: "finance",
  },
];

export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((t) => t.slug === slug);
}

export function searchTerms(
  terms: GlossaryTerm[],
  query: string | null | undefined,
): GlossaryTerm[] {
  if (!query) return terms;
  const q = query.trim().toLowerCase();
  if (!q) return terms;
  return terms.filter((t) => {
    if (t.slug.toLowerCase().includes(q)) return true;
    if (t.name.toLowerCase().includes(q)) return true;
    if (t.description.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function groupTermsByCategory(
  terms: GlossaryTerm[],
): { category: GlossaryCategory; label: string; terms: GlossaryTerm[] }[] {
  const order: GlossaryCategory[] = [
    "basic",
    "regulation",
    "power",
    "fuel",
    "finance",
  ];
  return order
    .map((category) => ({
      category,
      label: GLOSSARY_CATEGORIES[category],
      terms: terms.filter((t) => t.category === category),
    }))
    .filter((g) => g.terms.length > 0);
}

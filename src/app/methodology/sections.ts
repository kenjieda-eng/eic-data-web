export type MethodologyBoxColor = "default" | "sky" | "emerald" | "violet" | "amber";

export interface MethodologySection {
  id: string;
  number: number;
  title: string;
  boxColor: MethodologyBoxColor;
  dynamic?: "data-count" | "metadata-schema" | "quality-signals";
}

export const METHODOLOGY_SECTIONS: MethodologySection[] = [
  {
    id: "methodology-sec-1",
    number: 1,
    title: "二層アーキテクチャ",
    boxColor: "default",
  },
  {
    id: "methodology-sec-2",
    number: 2,
    title: "一次出典・ライセンス",
    boxColor: "default",
  },
  {
    id: "methodology-sec-3",
    number: 3,
    title: "実データと参考値",
    boxColor: "sky",
    dynamic: "data-count",
  },
  {
    id: "methodology-sec-4",
    number: 4,
    title: "更新頻度",
    boxColor: "default",
  },
  {
    id: "methodology-sec-5",
    number: 5,
    title: "訂正ポリシー",
    boxColor: "default",
  },
  {
    id: "methodology-sec-6",
    number: 6,
    title: "引用方法",
    boxColor: "default",
  },
  {
    id: "methodology-sec-7",
    number: 7,
    title: "D-011 系列メタデータ・スキーマ（v1）",
    boxColor: "emerald",
    dynamic: "metadata-schema",
  },
  {
    id: "methodology-sec-8",
    number: 8,
    title: "引用の作法（Citation Practice）",
    boxColor: "violet",
  },
  {
    id: "methodology-sec-9",
    number: 9,
    title: "ライセンスの読み解き（License Decoding）",
    boxColor: "amber",
  },
  {
    id: "methodology-sec-10",
    number: 10,
    title: "データ品質シグナルの読み方（Quality Signals）",
    boxColor: "sky",
    dynamic: "quality-signals",
  },
  {
    id: "methodology-sec-11",
    number: 11,
    title: "方法論ライブラリ — 回帰・記述統計・予測誤差の読み方",
    boxColor: "emerald",
  },
];

export const BOX_COLOR_CLASS: Record<MethodologyBoxColor, string> = {
  default: "border-slate-200 bg-white",
  sky: "border-sky-200 bg-sky-50",
  emerald: "border-emerald-200 bg-emerald-50",
  violet: "border-violet-200 bg-violet-50",
  amber: "border-amber-200 bg-amber-50",
};

export interface SchemaField {
  tier: "required" | "recommended" | "optional";
  name: string;
  description: string;
}

export const D011_SCHEMA: SchemaField[] = [
  { tier: "required", name: "id", description: "系列の一意識別子（kebab-case、例: jepx-spot-tokyo）" },
  { tier: "required", name: "name", description: "表示名（日本語、人間可読）" },
  {
    tier: "required",
    name: "domain",
    description:
      "12 ドメイン分類（electricity / power / fuel / weather / finance / policy / esg / tech / geo / econ / demand / ir / intl）",
  },
  {
    tier: "required",
    name: "frequency",
    description: "公表頻度（30min / daily / weekly / monthly / quarterly / annual）",
  },
  {
    tier: "required",
    name: "unit",
    description: "単位（¥/kWh / $/MMBtu / GWh / ℃ / mm / % など）",
  },
  {
    tier: "required",
    name: "source_name",
    description: "一次出典の名称（例: 資源エネルギー庁 電力調査統計）",
  },
  {
    tier: "required",
    name: "source_url",
    description: "一次出典の URL（クリックで原典に到達できる）",
  },
  {
    tier: "required",
    name: "license",
    description:
      "SPDX 識別子（CC-BY-4.0 / public-domain など）または独自識別子（boj-terms / jma-terms など）",
  },
  {
    tier: "required",
    name: "observation_cutoff",
    description: "最終確定値の日付（YYYY-MM-DD、データ品質ダッシュボードの SLA 判定に使用）",
  },
  {
    tier: "required",
    name: "updated_at",
    description: "パイプラインがメタデータを書き出した時刻（ISO 8601）",
  },
  { tier: "recommended", name: "license_url", description: "ライセンス本文の URL" },
  {
    tier: "recommended",
    name: "license_notice",
    description:
      "利用規約上必要な追加文言（例: 日本銀行 boj-terms の「保証されない」文言）",
  },
  { tier: "recommended", name: "tz", description: "タイムゾーン（Asia/Tokyo / UTC など）" },
  {
    tier: "recommended",
    name: "missing_policy",
    description: "欠損データの扱い（null / forward_fill / interpolate など）",
  },
  {
    tier: "recommended",
    name: "backfill_start",
    description: "バックフィル開始日（系列の歴史的開始点）",
  },
  {
    tier: "optional",
    name: "publisher",
    description: "出版者（source_name と異なる場合のみ。例: METI vs 資源エネルギー庁）",
  },
  {
    tier: "optional",
    name: "aggregation",
    description: "集約種別（raw / daily_mean / monthly_sum / derived など、10 種類）",
  },
  {
    tier: "optional",
    name: "notes",
    description: "編集者向けの注記（例: みなし小売ベース、新電力分は別ブロック）",
  },
  {
    tier: "optional",
    name: "depends_on",
    description: "派生指標の場合、計算元の indicator id 配列（例: meti-renewables-share）",
  },
];

export interface SpdxLicenseRow {
  id: string;
  redistribute: string;
  attribution: string;
  modify: string;
  example: string;
}

export const SPDX_LICENSES: SpdxLicenseRow[] = [
  {
    id: "CC-BY-4.0",
    redistribute: "✅ 自由",
    attribution: "必須",
    modify: "✅ 自由",
    example: "EIC Data 全コンテンツ（自社編集物）",
  },
  {
    id: "CC0-1.0",
    redistribute: "✅ 自由",
    attribution: "不要",
    modify: "✅ 自由",
    example: "なし（パブリックドメイン相当）",
  },
  {
    id: "public-domain",
    redistribute: "✅ 自由",
    attribution: "推奨",
    modify: "✅ 自由",
    example: "米国 Treasury Daily Yields 4 系列、財務省 国債金利情報 1 系列",
  },
  {
    id: "MIT / Apache-2.0",
    redistribute: "✅ 自由",
    attribution: "必須",
    modify: "✅ 自由",
    example: "なし（コードライブラリ用、データには非採用）",
  },
];

export interface CustomLicenseRow {
  id: string;
  series: string;
  notes: string;
}

export const CUSTOM_LICENSES: CustomLicenseRow[] = [
  {
    id: "boj-terms",
    series: "USD/JPY 月次 4 系列（FM08）",
    notes:
      "引用時に「日本銀行によって保証されたものではありません」の文言を添える必要あり（license_notice 参照）",
  },
  {
    id: "jepx-terms",
    series: "JEPX スポット 10 系列",
    notes: "非商用・商用とも引用可、原典明示必須。投資判断の責任は利用者",
  },
  {
    id: "jma-terms",
    series: "気象 63 系列（気温・降水量・日照・風速・積雪）",
    notes: "気象庁ホームページの利用規約に従う、出典明示必須、加工・編集自由",
  },
  {
    id: "meti-terms",
    series: "電源別発電 8 + 需要 3 + 派生 1 = 12 系列",
    notes: "経済産業省の二次利用規約に従う、出典明示必須、商用利用可",
  },
  {
    id: "eprx-terms",
    series: "需給調整市場（5 商品 × 約定価格 等）",
    notes:
      "EPRX（需給調整市場運営者）の公表規約に従う、出典明示必須。CC BY 4.0 ではなく当該規約に準拠",
  },
  {
    id: "occto-terms",
    series: "容量市場メインオークション約定価格（エリア別・全国加重平均）",
    notes:
      "電力広域的運営推進機関（OCCTO）公表規約に従う、出典明示必須。CC BY 4.0 ではなく当該規約に準拠",
  },
  {
    id: "wb-pink-sheet-terms",
    series: "燃料 7 系列（LNG / NG / 原油 / 石炭）",
    notes: "World Bank Pink Sheet (CC BY 4.0 相当)、原典明示必須、商用利用可",
  },
];

export interface QualitySignal {
  field: string;
  meaning: string;
  reading: string;
}

export const QUALITY_SIGNALS: QualitySignal[] = [
  {
    field: "observation_cutoff",
    meaning: "最終確定値の日付",
    reading: "この日以降の値は未取得。引用時の \"as-of\" として明示する",
  },
  {
    field: "freshness_sla_days",
    meaning: "許容鮮度（日数）",
    reading:
      "cutoff から本日までの経過日数 ≤ SLA なら緑判定。超えたら警告（黄）または違反（赤）",
  },
  {
    field: "missing_policy",
    meaning: "欠損データの扱い",
    reading:
      "null / forward_fill / interpolate の 3 系統。チャート上の欠損は埋められているか確認",
  },
  {
    field: "aggregation",
    meaning: "集約種別",
    reading:
      "raw（生値）/ daily_mean / monthly_sum / derived など 10 種類。元データの粒度と加工度を読む",
  },
];

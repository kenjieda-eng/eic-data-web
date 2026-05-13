/**
 * 9 エリア metadata (`/map` ページ用) — Insight #1-#10 の地理的サマリー
 *
 * 各 region は JEPX 取引エリア (9 区分) に対応し、JMA 代表気象官署と Insight slug を結びつける。
 * 座標は緯度経度 (truth) + viewBox 0 0 500 700 への 1 次投影 (x, y) の両方を持ち、
 * `projectLatLng()` で再計算可能。色は tailwind-500 系から 9 色を採用 (用語集グラフの 5 色と
 * 同じファミリーで統一感)。
 */

export interface RegionMeta {
  /** JEPX area slug (kebab-case ascii) */
  slug: string;
  /** 日本語名 (例: "北海道") */
  ja: string;
  /** 代表都市 (JMA 気象官署) */
  city: string;
  /** 主軸 Insight slug (9 region × temp×price シリーズの代表) */
  insightSlug: string;
  /** Insight #番号 (1-10) — Tokyo は主軸 #1 採用、#4 (夏期) は note で言及 */
  insightNumber: number;
  /** 緯度 (°N) */
  lat: number;
  /** 経度 (°E) */
  lng: number;
  /** ピン色 (tailwind-500 系 hex、9 区分) */
  color: string;
  /** 1 行のサブタイトル (ピンクリック時に表示) */
  hook: string;
}

export const REGIONS: RegionMeta[] = [
  {
    slug: "hokkaido",
    ja: "北海道",
    city: "札幌",
    insightSlug: "temp-min-hokkaido-vs-price",
    insightNumber: 2,
    lat: 43.06,
    lng: 141.35,
    color: "#0ea5e9", // sky-500
    hook: "冬の暖房需要 + 北本連系線制約",
  },
  {
    slug: "tohoku",
    ja: "東北",
    city: "仙台",
    insightSlug: "temp-vs-price-tohoku",
    insightNumber: 5,
    lat: 38.27,
    lng: 140.87,
    color: "#06b6d4", // cyan-500
    hook: "原発停止後の火力依存 + 夏冬両期型",
  },
  {
    slug: "tokyo",
    ja: "東京 (関東)",
    city: "東京",
    insightSlug: "temp-vs-price",
    insightNumber: 1,
    lat: 35.69,
    lng: 139.69,
    color: "#10b981", // emerald-500
    hook: "気温 × 電力価格の 15 年史 (主軸)",
  },
  {
    slug: "hokuriku",
    ja: "北陸",
    city: "金沢",
    insightSlug: "temp-vs-price-hokuriku",
    insightNumber: 10,
    lat: 36.56,
    lng: 136.66,
    color: "#14b8a6", // teal-500
    hook: "水力ベースロード × 豪雪暖房需要",
  },
  {
    slug: "chubu",
    ja: "中部",
    city: "名古屋",
    insightSlug: "temp-vs-price-chubu",
    insightNumber: 6,
    lat: 35.18,
    lng: 136.91,
    color: "#6366f1", // indigo-500
    hook: "製造業集積の平日 / 休日パターン",
  },
  {
    slug: "kansai",
    ja: "関西",
    city: "大阪",
    insightSlug: "temp-vs-price-kansai",
    insightNumber: 7,
    lat: 34.69,
    lng: 135.5,
    color: "#f59e0b", // amber-500
    hook: "原発再稼働 7 基でベースロード復活",
  },
  {
    slug: "chugoku",
    ja: "中国",
    city: "広島",
    insightSlug: "temp-vs-price-chugoku",
    insightNumber: 8,
    lat: 34.39,
    lng: 132.46,
    color: "#f97316", // orange-500
    hook: "国内 2 位の太陽光 + 島根 2 号機再稼働",
  },
  {
    slug: "shikoku",
    ja: "四国",
    city: "高松",
    insightSlug: "temp-vs-price-shikoku",
    insightNumber: 9,
    lat: 34.34,
    lng: 134.05,
    color: "#f43f5e", // rose-500
    hook: "国内最小級市場 × 伊方 3 号機の刻印",
  },
  {
    slug: "kyushu",
    ja: "九州",
    city: "福岡",
    insightSlug: "temp-max-kyushu-vs-price",
    insightNumber: 3,
    lat: 33.59,
    lng: 130.4,
    color: "#eab308", // yellow-500
    hook: "太陽光大国の昼安 × 夜高の非対称",
  },
];

/** 簡易 1 次投影 — viewBox (0,0)-(500,700) に lat/lng をマップ */
export const PROJECTION = {
  lngMin: 128.0,
  lngMax: 146.0,
  latMin: 30.0,
  latMax: 46.0,
  width: 500,
  height: 700,
} as const;

export interface Point2D {
  x: number;
  y: number;
}

export function projectLatLng(lat: number, lng: number): Point2D {
  const x =
    ((lng - PROJECTION.lngMin) / (PROJECTION.lngMax - PROJECTION.lngMin)) *
    PROJECTION.width;
  const y =
    ((PROJECTION.latMax - lat) / (PROJECTION.latMax - PROJECTION.latMin)) *
    PROJECTION.height;
  return { x, y };
}

/** 各 region の SVG 上の代表点を取得 (ピン中心) */
export function regionPin(region: RegionMeta): Point2D {
  return projectLatLng(region.lat, region.lng);
}

export interface RegionShape {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** 9 region の簡易輪郭 (ellipse) — pin を覆う面 */
export const REGION_SHAPES: Record<string, RegionShape> = {
  hokkaido: { cx: 370, cy: 130, rx: 90, ry: 70 },
  tohoku: { cx: 330, cy: 290, rx: 55, ry: 85 },
  tokyo: { cx: 325, cy: 435, rx: 40, ry: 30 },
  hokuriku: { cx: 235, cy: 405, rx: 35, ry: 30 },
  chubu: { cx: 255, cy: 475, rx: 45, ry: 35 },
  kansai: { cx: 200, cy: 500, rx: 45, ry: 30 },
  chugoku: { cx: 130, cy: 505, rx: 50, ry: 25 },
  shikoku: { cx: 160, cy: 540, rx: 40, ry: 20 },
  kyushu: { cx: 80, cy: 550, rx: 40, ry: 55 },
};

export function getRegionShape(slug: string): RegionShape | undefined {
  return REGION_SHAPES[slug];
}

export function findRegionBySlug(slug: string): RegionMeta | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

import { describe, expect, test } from "vitest";
import { INSIGHTS } from "../../lib/insights";
import {
  DOMAINS,
  DOMAINS_DAY6,
  DOMAINS_DAY7,
  DOMAINS_DAY8,
  findRelatedInsightsForDomain,
  getDomainById,
  groupIndicatorsBySubcategory,
  resolveDomainDescription,
  SERIES_COUNT_TOKEN,
} from "./data";

// 正準 12 ドメイン (pipeline catalog の実 domain ID)。Polish #2 (2026-06-15) で
// 旧 drift ID (policy 等) を解消し、geopolitics / corp_ir を追加して 12 を出揃わせた。
const CANONICAL_DOMAIN_IDS = [
  "power",
  "weather",
  "fuel",
  "finance",
  "economy",
  "regulation",
  "esg",
  "tech",
  "international",
  "population",
  "geopolitics",
  "corp_ir",
];

describe("DOMAINS_DAY6", () => {
  test("contains 3 domains (power + weather + fuel)", () => {
    expect(DOMAINS_DAY6).toHaveLength(3);
    expect(DOMAINS_DAY6.map((d) => d.id)).toEqual(["power", "weather", "fuel"]);
  });

  test("every domain has non-empty description (150+ chars)", () => {
    for (const d of DOMAINS_DAY6) {
      expect(d.name.length).toBeGreaterThan(0);
      expect(d.emoji.length).toBeGreaterThan(0);
      expect(d.description.length).toBeGreaterThanOrEqual(150);
      expect(d.insightKeywords.length).toBeGreaterThan(0);
      expect(d.subcategories.length).toBeGreaterThan(0);
    }
  });
});

describe("DOMAINS_DAY7", () => {
  test("contains 6 domains (Day 6 末 3 件 + finance/economy/regulation)", () => {
    expect(DOMAINS_DAY7).toHaveLength(6);
    expect(DOMAINS_DAY7.map((d) => d.id)).toEqual([
      "power",
      "weather",
      "fuel",
      "finance",
      "economy",
      "regulation",
    ]);
  });

  test("finance has 3 subcategories (USD/JPY + JGB + US Treasury)", () => {
    const finance = getDomainById("finance");
    expect(finance).toBeDefined();
    expect(finance!.metaPage).toBeFalsy();
    expect(finance!.subcategories).toHaveLength(3);
    expect(finance!.subcategories.map((s) => s.name)).toEqual([
      "USD/JPY 為替（月次）",
      "JGB（日本国債新発金利）",
      "U.S. Treasury（米国国債）",
    ]);
  });

  test("economy / regulation は catalog 着地済 (metaPage なし・subcategories あり)", () => {
    // economy は catalog の economy(2) + macro(11) を内包し metaPage ではない
    expect(getDomainById("economy")?.metaPage).toBeFalsy();
    expect(getDomainById("economy")?.subcategories.length).toBeGreaterThan(0);
    // policy は regulation に正準化され FIT 買取価格 5 系列で着地
    expect(getDomainById("policy")).toBeUndefined();
    expect(getDomainById("regulation")?.metaPage).toBeFalsy();
    expect(getDomainById("regulation")?.subcategories.length).toBeGreaterThan(0);
  });
});

describe("DOMAINS_DAY8", () => {
  test("contains 10 domains (Day 7 末 6 件 + esg/tech/international/population)", () => {
    expect(DOMAINS_DAY8).toHaveLength(10);
    expect(DOMAINS_DAY8.map((d) => d.id)).toEqual([
      "power",
      "weather",
      "fuel",
      "finance",
      "economy",
      "regulation",
      "esg",
      "tech",
      "international",
      "population",
    ]);
  });

  test("esg は EU ETS 排出量 + 排出枠 4 + GIO 日本 GHG 2 で 6 subcategory, tech/population も着地", () => {
    expect(getDomainById("esg")?.metaPage).toBeFalsy();
    expect(getDomainById("esg")?.subcategories).toHaveLength(6);
    expect(getDomainById("tech")?.metaPage).toBeFalsy();
    expect(getDomainById("tech")?.subcategories).toHaveLength(3);
    expect(getDomainById("population")?.metaPage).toBeFalsy();
    expect(getDomainById("population")?.subcategories).toHaveLength(3);
    expect(getDomainById("international")?.metaPage).toBeFalsy();
    expect(
      getDomainById("international")?.subcategories.length,
    ).toBeGreaterThan(0);
  });
});

describe("DOMAINS (正準 12 ドメイン)", () => {
  test("contains 12 domains 全て catalog 着地済 (metaPage は皆無)", () => {
    expect(DOMAINS).toHaveLength(12);
    expect(DOMAINS.map((d) => d.id)).toEqual(CANONICAL_DOMAIN_IDS);
    for (const d of DOMAINS) {
      expect(d.metaPage).toBeFalsy();
      expect(d.subcategories.length).toBeGreaterThan(0);
      expect(d.description.length).toBeGreaterThanOrEqual(150);
      expect(d.insightKeywords.length).toBeGreaterThan(0);
    }
  });

  test("DOMAINS_DAY8 is fully contained in DOMAINS, geopolitics/corp_ir が追加分", () => {
    const allIds = new Set(DOMAINS.map((d) => d.id));
    for (const d of DOMAINS_DAY8) {
      expect(allIds.has(d.id)).toBe(true);
    }
    const additions = DOMAINS.filter(
      (d) => !DOMAINS_DAY8.some((p) => p.id === d.id),
    );
    expect(additions.map((d) => d.id).sort()).toEqual(["corp_ir", "geopolitics"]);
  });

  test("domain id に重複なし", () => {
    const ids = DOMAINS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getDomainById", () => {
  test("正準 12 ドメインの id で name を解決", () => {
    expect(getDomainById("power")?.name).toBe("電力");
    expect(getDomainById("weather")?.emoji).toBe("🌤️");
    expect(getDomainById("finance")?.name).toBe("金融");
    expect(getDomainById("economy")?.name).toBe("経済");
    expect(getDomainById("regulation")?.name).toBe("制度");
    expect(getDomainById("esg")?.name).toBe("ESG / サステナ");
    expect(getDomainById("tech")?.name).toBe("技術");
    expect(getDomainById("international")?.name).toBe("国際");
    expect(getDomainById("population")?.name).toBe("人口");
    expect(getDomainById("geopolitics")?.name).toBe("地政");
    expect(getDomainById("corp_ir")?.name).toBe("企業IR");
  });

  test("旧 drift ID は解決しない (canonical 化済)", () => {
    expect(getDomainById("policy")).toBeUndefined();
    expect(getDomainById("ir")).toBeUndefined();
    expect(getDomainById("geo")).toBeUndefined();
    expect(getDomainById("econ")).toBeUndefined();
  });
});

describe("findRelatedInsightsForDomain", () => {
  test("power domain matches multiple Insights (>= 10)", () => {
    const power = getDomainById("power")!;
    const related = findRelatedInsightsForDomain(power, INSIGHTS, 100);
    expect(related.length).toBeGreaterThanOrEqual(10);
  });

  test("weather domain matches Insight #1 (temp-vs-price)", () => {
    const weather = getDomainById("weather")!;
    const related = findRelatedInsightsForDomain(weather);
    expect(related.some((i) => i.slug === "temp-vs-price")).toBe(true);
  });

  test("fuel domain matches LNG/oil insights", () => {
    const fuel = getDomainById("fuel")!;
    const related = findRelatedInsightsForDomain(fuel);
    expect(
      related.some((i) =>
        ["lng-vs-price-tokyo", "ttf-lag-vs-lng-jp", "brent-lag-vs-price-tokyo"].includes(i.slug),
      ),
    ).toBe(true);
  });

  test("finance domain matches yield-spread / USD-JPY insights", () => {
    const finance = getDomainById("finance")!;
    const related = findRelatedInsightsForDomain(finance, INSIGHTS, 100);
    expect(related.length).toBeGreaterThanOrEqual(3);
    const slugs = related.map((i) => i.slug);
    expect(slugs.some((s) => s.includes("yield") || s.includes("jgb") || s.includes("usdjpy") || s.includes("treasury"))).toBe(true);
  });

  test("corp_ir / geopolitics domain も代表 Insight を拾う", () => {
    const corpIr = getDomainById("corp_ir")!;
    const corpRelated = findRelatedInsightsForDomain(corpIr, INSIGHTS, 100);
    expect(
      corpRelated.some((i) => i.slug.startsWith("power9-")),
    ).toBe(true);
    const geo = getDomainById("geopolitics")!;
    const geoRelated = findRelatedInsightsForDomain(geo, INSIGHTS, 100);
    expect(
      geoRelated.some((i) => i.slug === "jp-energy-import-sources"),
    ).toBe(true);
  });
});

describe("groupIndicatorsBySubcategory", () => {
  test("each indicator appears in at most one subcategory", () => {
    const power = getDomainById("power")!;
    const rows = [
      { id: "jepx-spot-tokyo" },
      { id: "meti-gen-thermal" },
      { id: "meti-demand-total" },
      { id: "meti-renewables-share" },
    ];
    const groups = groupIndicatorsBySubcategory(power, rows);
    const allIds = groups.flatMap((g) => g.rows.map((r) => r.id));
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds).toContain("jepx-spot-tokyo");
    expect(allIds).toContain("meti-gen-thermal");
  });

  test("corp_ir: edinet 系列を指標別 5 subcategory に振り分け", () => {
    const corpIr = getDomainById("corp_ir")!;
    const rows = [
      { id: "edinet-tepco-revenue" },
      { id: "edinet-tepco-operating-income" },
      { id: "edinet-tepco-ordinary-income" },
      { id: "edinet-tepco-net-income" },
      { id: "edinet-tepco-total-assets" },
    ];
    const groups = groupIndicatorsBySubcategory(corpIr, rows);
    const allIds = groups.flatMap((g) => g.rows.map((r) => r.id));
    // 5 系列が重複なく全て分類される (ordinary/operating/net の -income 衝突なし)
    expect(new Set(allIds).size).toBe(5);
    expect(groups).toHaveLength(5);
  });

  test("empty subcategories are filtered out", () => {
    const fuel = getDomainById("fuel")!;
    const rows = [{ id: "fuel-lng-jp-cif" }];
    const groups = groupIndicatorsBySubcategory(fuel, rows);
    expect(groups.every((g) => g.rows.length > 0)).toBe(true);
    expect(groups.length).toBeLessThanOrEqual(fuel.subcategories.length);
  });

  // 2026-08-10: 新規 GX 系列 24 本が「その他」に落ちていた申し送りの回帰テスト。
  test("esg: GIO 日本 GHG 18 系列が 2 subcategory に分かれ「その他」に落ちない", () => {
    const esg = getDomainById("esg")!;
    const gasRows = [
      "jp-ghg-total",
      "jp-ghg-net",
      "jp-ghg-co2",
      "jp-ghg-ch4",
      "jp-ghg-n2o",
      "jp-ghg-fgas",
      "jp-ghg-lulucf-removal",
    ].map((id) => ({ id }));
    const sectorRows = [
      "jp-ghg-co2-total",
      "jp-ghg-co2-industry",
      "jp-ghg-co2-transport",
      "jp-ghg-co2-commercial",
      "jp-ghg-co2-household",
      "jp-ghg-co2-energy-conversion",
      "jp-ghg-co2-energy-origin",
      "jp-ghg-co2-nonenergy-origin",
      "jp-ghg-co2-industrial-process",
      "jp-ghg-co2-waste",
      "jp-ghg-co2-other",
    ].map((id) => ({ id }));
    const groups = groupIndicatorsBySubcategory(esg, [
      ...gasRows,
      ...sectorRows,
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].sub.name).toBe("日本 温室効果ガス 総排出量・ガス別");
    expect(groups[0].rows).toHaveLength(7);
    expect(groups[1].sub.name).toBe("日本 温室効果ガス 部門別・起源別 CO2");
    expect(groups[1].rows).toHaveLength(11);
    // jp-ghg-co2 (ガス別 CO2) と jp-ghg-co2-total (部門表の CO2 合計) が混ざらない
    expect(groups[0].rows.map((r) => r.id)).toContain("jp-ghg-co2");
    expect(groups[1].rows.map((r) => r.id)).not.toContain("jp-ghg-co2");
  });

  test("regulation: 非化石証書 6 系列が専用 subcategory に入る", () => {
    const regulation = getDomainById("regulation")!;
    const rows = [
      "nonfossil-cert-fit-price",
      "nonfossil-cert-fit-volume",
      "nonfossil-cert-nonfit-price",
      "nonfossil-cert-nonfit-volume",
      "nonfossil-cert-nonfit-re-price",
      "nonfossil-cert-nonfit-re-volume",
    ].map((id) => ({ id }));
    const groups = groupIndicatorsBySubcategory(regulation, [
      { id: "fit-price-solar-business" },
      ...rows,
    ]);
    expect(groups).toHaveLength(2);
    const cert = groups.find(
      (g) => g.sub.name === "非化石証書（約定価格・約定量）",
    )!;
    expect(cert.rows).toHaveLength(6);
    // fit-price-* が nonfossil-cert-* を飲み込まない
    expect(
      groups.find((g) => g.sub.name === "FIT 買取価格（電源別）")!.rows,
    ).toHaveLength(1);
  });
});

// =============================================================================
// 2026-08-10 (PR #152 申し送り): subcategory matcher が ID 命名の変遷に追随できず、
// weather 72 / power 59 / international 36 の計 167 系列が「その他」に落ちていた。
// 以下の ID 一覧は catalog `indicators.json` (2026-08-10 / 581 系列) の実 ID を
// 構造的に再現したもので、tmp スクリプトで catalog と完全一致を照合済み。
// 各ドメインの合計が catalog 件数と一致し、かつ「その他」が 0 であることを固定する。
// =============================================================================

/** JMA 観測 9 地点 (catalog の ID サフィックス)。 */
const JMA_SITES = [
  "hokkaido",
  "tohoku",
  "tokyo",
  "chubu",
  "hokuriku",
  "kansai",
  "chugoku",
  "shikoku",
  "kyushu",
];

/** 気象 8 観測変数 × 9 地点 = 72 系列 (catalog weather の全量)。 */
const WEATHER_IDS = [
  "jma-temp-avg",
  "jma-temp-max",
  "jma-temp-min",
  "jma-precip",
  "jma-sunshine",
  "jma-wind-avg",
  "jma-wind-dir",
  "jma-snow-max",
].flatMap((v) => JMA_SITES.map((s) => `${v}-${s}`));

/** JEPX / 容量市場のエリア 9 区分。 */
const JP_AREAS = [
  "hokkaido",
  "tohoku",
  "tokyo",
  "chubu",
  "hokuriku",
  "kansai",
  "chugoku",
  "shikoku",
  "kyushu",
];

/** 需給調整市場の商品区分 → 落札単価が存在する電源種別 (商品ごとに異なる)。 */
const BALANCING_PRODUCTS: Record<string, string[]> = {
  primary: ["battery", "hydro", "pumped", "thermal", "vpp"],
  "secondary-1": ["battery", "hydro", "pumped", "thermal"],
  "secondary-2": ["battery", "hydro", "pumped", "thermal"],
  "tertiary-1": ["battery", "hydro", "pumped", "thermal", "vpp"],
  "tertiary-2": ["battery", "pumped", "thermal", "vpp"],
  composite: ["battery", "hydro", "pumped", "thermal", "vpp"],
};

/** 電力 81 系列 (catalog power の全量)。 */
const POWER_IDS = [
  ...JP_AREAS.map((a) => `jepx-spot-${a}`),
  "jepx-spot-system",
  ...Object.entries(BALANCING_PRODUCTS).flatMap(([product, sources]) => [
    `balancing-price-${product}`,
    ...sources.map((s) => `balancing-price-${product}-${s}`),
  ]),
  ...Object.keys(BALANCING_PRODUCTS).map((p) => `balancing-shortage-${p}`),
  ...JP_AREAS.map((a) => `capacity-main-auction-price-${a}`),
  "capacity-main-auction-price-national",
  ...JP_AREAS.map((a) => `capacity-main-auction-volume-${a}`),
  "capacity-main-auction-volume-total",
  ...[
    "thermal",
    "hydro",
    "nuclear",
    "solar",
    "wind",
    "geothermal",
    "biomass",
    "total",
  ].map((s) => `meti-gen-${s}`),
  ...["lights", "power", "total"].map((s) => `meti-demand-${s}`),
  "meti-renewables-share",
];

const EMBER_COUNTRIES = ["jp", "us", "gb", "de", "cn"];
const EMBER_SOURCES = [
  "coal",
  "gas",
  "nuclear",
  "hydro",
  "solar",
  "wind",
  "bioenergy",
];

/** 国際 56 系列 (catalog international の全量)。 */
const INTERNATIONAL_IDS = [
  ...["dfr", "mlf", "mrr"].map((r) => `ecb-rate-${r}`),
  "fx-eurusd-monthly-avg",
  "fx-eurjpy-monthly-avg",
  ...["co2-intensity", "generation", "demand"].flatMap((m) =>
    EMBER_COUNTRIES.map((c) => `ember-${m}-${c}`),
  ),
  ...EMBER_SOURCES.flatMap((s) =>
    EMBER_COUNTRIES.map((c) => `ember-share-${s}-${c}`),
  ),
  "china-nbs-mfg-pmi",
];

/** groupIndicatorsBySubcategory の結果を [グループ名, 件数] の配列に落とす。 */
function groupSizes(domainId: string, ids: string[]): [string, number][] {
  const meta = getDomainById(domainId)!;
  return groupIndicatorsBySubcategory(
    meta,
    ids.map((id) => ({ id })),
  ).map((g) => [g.sub.name, g.rows.length]);
}

/** DomainIndicatorTable の「その他」に落ちる ID (どの subcategory にも当たらない)。 */
function ungroupedIds(domainId: string, ids: string[]): string[] {
  const meta = getDomainById(domainId)!;
  const grouped = new Set(
    groupIndicatorsBySubcategory(
      meta,
      ids.map((id) => ({ id })),
    ).flatMap((g) => g.rows.map((r) => r.id)),
  );
  return ids.filter((id) => !grouped.has(id));
}

describe("subcategory matcher が catalog の実 ID に追随している", () => {
  test("weather: 72 系列が観測項目別 5 グループに全量分類される", () => {
    expect(WEATHER_IDS).toHaveLength(72);
    expect(new Set(WEATHER_IDS).size).toBe(72);
    expect(groupSizes("weather", WEATHER_IDS)).toEqual([
      ["気温（9 地点 × 平均・最高・最低）", 27],
      ["降水量（9 地点）", 9],
      ["日照時間（9 地点）", 9],
      ["風速・風向（9 地点 × 平均風速・最大風速時風向）", 18],
      ["最深積雪（9 地点）", 9],
    ]);
    expect(ungroupedIds("weather", WEATHER_IDS)).toEqual([]);
  });

  test("weather: 旧命名 (temp-/precip- 始まり) では 1 件も拾わない", () => {
    // 実 ID は `jma-` プレフィックス付き。非 `jma-` の旧 ID が復活しても
    // 誤って分類されないことを確認する (逆流防止)。
    expect(ungroupedIds("weather", ["temp-tokyo", "precip-tokyo"])).toEqual([
      "temp-tokyo",
      "precip-tokyo",
    ]);
  });

  test("power: 81 系列が 8 グループに全量分類される（需給調整・容量市場を追加）", () => {
    expect(POWER_IDS).toHaveLength(81);
    expect(new Set(POWER_IDS).size).toBe(81);
    expect(groupSizes("power", POWER_IDS)).toEqual([
      ["JEPX 9 エリア + システム", 10],
      ["需給調整市場 約定単価（商品区分 × 電源種別）", 33],
      ["需給調整市場 不足率（商品区分別）", 6],
      ["容量市場 メインオークション 約定価格（エリア別）", 10],
      ["容量市場 メインオークション 約定容量（エリア別）", 10],
      ["METI 電源別発電量", 8],
      ["METI 販売電力量", 3],
      ["派生・比率指標", 1],
    ]);
    expect(ungroupedIds("power", POWER_IDS)).toEqual([]);
  });

  test("power: balancing の価格と不足率、容量市場の価格と容量が混ざらない", () => {
    const groups = groupIndicatorsBySubcategory(
      getDomainById("power")!,
      POWER_IDS.map((id) => ({ id })),
    );
    const rowsOf = (name: string) =>
      groups.find((g) => g.sub.name === name)!.rows.map((r) => r.id);
    expect(
      rowsOf("需給調整市場 約定単価（商品区分 × 電源種別）").every((id) =>
        id.startsWith("balancing-price-"),
      ),
    ).toBe(true);
    expect(rowsOf("需給調整市場 不足率（商品区分別）")).toEqual(
      expect.arrayContaining(["balancing-shortage-composite"]),
    );
    expect(
      rowsOf("容量市場 メインオークション 約定価格（エリア別）"),
    ).toContain("capacity-main-auction-price-national");
    expect(
      rowsOf("容量市場 メインオークション 約定容量（エリア別）"),
    ).toContain("capacity-main-auction-volume-total");
  });

  test("international: 56 系列が指標種別 7 グループに全量分類される", () => {
    expect(INTERNATIONAL_IDS).toHaveLength(56);
    expect(new Set(INTERNATIONAL_IDS).size).toBe(56);
    expect(groupSizes("international", INTERNATIONAL_IDS)).toEqual([
      ["ECB 政策金利", 3],
      ["EUR 為替", 2],
      ["Ember 電力部門 CO2 排出強度（5 ヶ国）", 5],
      ["Ember 月次発電量（5 ヶ国）", 5],
      ["Ember 月次電力需要（5 ヶ国）", 5],
      ["Ember 電源種別 発電量シェア（5 ヶ国 × 7 電源）", 35],
      ["中国 製造業 PMI", 1],
    ]);
    expect(ungroupedIds("international", INTERNATIONAL_IDS)).toEqual([]);
  });

  test("international: ember-share が既存 Ember 3 グループを侵食しない", () => {
    // ember-generation-jp / ember-demand-jp と ember-share-*-jp が同居しても
    // それぞれの prefix グループに正しく収まる。
    const groups = groupIndicatorsBySubcategory(getDomainById("international")!, [
      { id: "ember-generation-jp" },
      { id: "ember-demand-jp" },
      { id: "ember-co2-intensity-jp" },
      { id: "ember-share-solar-jp" },
    ]);
    expect(groups.map((g) => [g.sub.name, g.rows.length])).toEqual([
      ["Ember 電力部門 CO2 排出強度（5 ヶ国）", 1],
      ["Ember 月次発電量（5 ヶ国）", 1],
      ["Ember 月次電力需要（5 ヶ国）", 1],
      ["Ember 電源種別 発電量シェア（5 ヶ国 × 7 電源）", 1],
    ]);
  });

  test("subcategory 名は全ドメインで重複しない（表示見出しの衝突防止）", () => {
    for (const d of DOMAINS) {
      const names = d.subcategories.map((s) => s.name);
      expect(new Set(names).size, `${d.id} に重複 subcategory 名`).toBe(
        names.length,
      );
    }
  });

  // 2026-08-13 (PR #153 申し送り): fuel「LNG（4 系列）」が実 3 系列とズレていた。
  // DomainIndicatorTable は見出しの直後に必ず `g.rows.length` 系列を描画するので、
  // 名前側の系列数は二重表示かつ静かな陳腐化の温床にしかならない。
  // (「9 地点」「5 ヶ国」等の実体の次元は系列数ではないので対象外)
  test("subcategory 名に系列数のハードコードが無い", () => {
    for (const d of DOMAINS) {
      for (const s of d.subcategories) {
        expect(
          /[0-9０-９]+\s*系列/.test(s.name),
          `${d.id} / ${s.name} に系列数がハードコードされている`,
        ).toBe(false);
      }
    }
  });
});

describe("resolveDomainDescription (系列数の動的化)", () => {
  test("description に手書きの「計 N 系列」が残っていない", () => {
    for (const d of DOMAINS) {
      expect(
        /計\s*[0-9０-９]+\s*系列/.test(d.description),
        `${d.id} の description に手書きの総系列数が残っている`,
      ).toBe(false);
    }
  });

  test("総系列数を書くドメインは token を使い、実行数で解決される", () => {
    const esg = getDomainById("esg")!;
    expect(esg.description).toContain(SERIES_COUNT_TOKEN);
    expect(resolveDomainDescription(esg, 90)).toContain("計 90 系列");
    expect(resolveDomainDescription(esg, 90)).not.toContain(
      SERIES_COUNT_TOKEN,
    );

    const regulation = getDomainById("regulation")!;
    expect(regulation.description).toContain(SERIES_COUNT_TOKEN);
    expect(resolveDomainDescription(regulation, 11)).toContain("計 11 系列");
  });

  test("token を持たない description はそのまま返る", () => {
    const weather = getDomainById("weather")!;
    expect(weather.description).not.toContain(SERIES_COUNT_TOKEN);
    expect(resolveDomainDescription(weather, 72)).toBe(weather.description);
  });
});

// =============================================================================
// 2026-08-13 (PR #153 申し送り): description が catalog 実態から離れていた 3 件
// (weather の変数数・頻度 / fuel の LNG 銘柄・ライセンス / geopolitics の頻度) の
// 回帰テスト。catalog `indicators.json` (2026-08-13 / 581 系列) を実照合した値を固定する。
// =============================================================================
describe("description が catalog の実態と整合している", () => {
  test("weather: 8 観測変数・日次（旧「5 変数を月次」からの是正）", () => {
    const weather = getDomainById("weather")!.description;
    expect(weather).toContain("8 観測変数");
    expect(weather).toContain("日次");
    expect(weather).not.toContain("月次");
    // population 141 / esg 90 / power 81 > weather 72。最大規模を名乗らない。
    expect(weather).not.toContain("最大規模");
  });

  test("fuel: JKM 不在・鉄鉱石に言及・ライセンスは CC BY 4.0", () => {
    const fuel = getDomainById("fuel")!;
    // catalog の LNG/天然ガス は jp-cif / henryhub / ttf の 3 本のみ。JKM は未収載。
    expect(fuel.description).not.toContain("JKM");
    for (const s of fuel.subcategories) expect(s.description).not.toContain("JKM");
    // 非燃料コモディティ commodity-iron-ore が fuel ドメインに同居している事実を明示
    expect(fuel.description).toContain("鉄鉱石");
    expect(fuel.description).toContain("commodity-iron-ore");
    // 実ライセンスは CC-BY-4.0（旧「public-domain 系列」は誤り）
    expect(fuel.description).not.toContain("public-domain");
    expect(fuel.description).toContain("CC BY 4.0");
  });

  test("geopolitics: 年次・千円（旧「月次・円」からの是正）", () => {
    const geo = getDomainById("geopolitics")!;
    expect(geo.description).toContain("年次・千円");
    expect(geo.description).not.toContain("月次");
    for (const s of geo.subcategories) {
      expect(s.description).toContain("年次");
      expect(s.description).not.toContain("月次");
    }
  });

  test("power / international: 総系列数は token で解決する", () => {
    // 説明が扱う市場ブロックを増やしたため総数を明記。手書きせず実行数に追随させる。
    for (const id of ["power", "international"]) {
      const meta = getDomainById(id)!;
      expect(meta.description, `${id}`).toContain(SERIES_COUNT_TOKEN);
    }
    expect(resolveDomainDescription(getDomainById("power")!, 81)).toContain(
      "計 81 系列",
    );
    expect(
      resolveDomainDescription(getDomainById("international")!, 56),
    ).toContain("計 56 系列");
  });

  test("power: 需給調整市場・容量市場が説明から漏れていない", () => {
    // subcategory には 2026-08-10 から存在したが description は JEPX+METI のままだった。
    const power = getDomainById("power")!.description;
    expect(power).toContain("需給調整市場");
    expect(power).toContain("容量市場");
  });

  test("international: 電源種別シェアと中国 PMI が説明から漏れていない", () => {
    const intl = getDomainById("international")!.description;
    expect(intl).toContain("発電量シェア");
    expect(intl).toContain("PMI");
  });
});

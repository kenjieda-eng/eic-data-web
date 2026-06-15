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
      "USD/JPY 為替（月次 4 系列）",
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

  test("esg は EU ETS 排出量 + 排出枠で 4 subcategory, tech/population も着地", () => {
    expect(getDomainById("esg")?.metaPage).toBeFalsy();
    expect(getDomainById("esg")?.subcategories).toHaveLength(4);
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
});

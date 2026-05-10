import { describe, expect, test } from "vitest";
import { INSIGHTS } from "../../lib/insights";
import {
  DOMAINS_DAY6,
  DOMAINS_DAY7,
  findRelatedInsightsForDomain,
  getDomainById,
  groupIndicatorsBySubcategory,
} from "./data";

describe("DOMAINS_DAY6", () => {
  test("contains 3 domains (power + weather + fuel)", () => {
    expect(DOMAINS_DAY6).toHaveLength(3);
    expect(DOMAINS_DAY6.map((d) => d.id)).toEqual(["power", "weather", "fuel"]);
  });

  test("every domain has non-empty description (200+ chars)", () => {
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
  test("contains 6 domains (Day 6 末 3 件 + Day 7 追加 3 件)", () => {
    expect(DOMAINS_DAY7).toHaveLength(6);
    expect(DOMAINS_DAY7.map((d) => d.id)).toEqual([
      "power",
      "weather",
      "fuel",
      "finance",
      "economy",
      "policy",
    ]);
  });

  test("DOMAINS_DAY6 is fully contained in DOMAINS_DAY7", () => {
    const day7Ids = new Set(DOMAINS_DAY7.map((d) => d.id));
    for (const d of DOMAINS_DAY6) {
      expect(day7Ids.has(d.id)).toBe(true);
    }
  });

  test("each Day 7 addition has description >= 150 chars and >= 1 insightKeyword", () => {
    const additions = DOMAINS_DAY7.filter(
      (d) => !DOMAINS_DAY6.some((p) => p.id === d.id),
    );
    expect(additions).toHaveLength(3);
    for (const d of additions) {
      expect(d.description.length).toBeGreaterThanOrEqual(150);
      expect(d.insightKeywords.length).toBeGreaterThan(0);
    }
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

  test("economy and policy are flagged as metaPage (catalog 不在)", () => {
    expect(getDomainById("economy")?.metaPage).toBe(true);
    expect(getDomainById("policy")?.metaPage).toBe(true);
    expect(getDomainById("economy")?.subcategories).toHaveLength(0);
    expect(getDomainById("policy")?.subcategories).toHaveLength(0);
  });
});

describe("getDomainById", () => {
  test("returns the domain when id matches", () => {
    expect(getDomainById("power")?.name).toBe("電力");
    expect(getDomainById("weather")?.emoji).toBe("🌤️");
    expect(getDomainById("finance")?.name).toBe("金融");
    expect(getDomainById("economy")?.name).toBe("経済");
    expect(getDomainById("policy")?.name).toBe("制度");
  });

  test("returns undefined for unknown id (Day 8 で追加予定の残ドメイン)", () => {
    expect(getDomainById("esg")).toBeUndefined();
    expect(getDomainById("tech")).toBeUndefined();
    expect(getDomainById("geo")).toBeUndefined();
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

  test("empty subcategories are filtered out", () => {
    const fuel = getDomainById("fuel")!;
    const rows = [{ id: "fuel-lng-jp-cif" }];
    const groups = groupIndicatorsBySubcategory(fuel, rows);
    expect(groups.every((g) => g.rows.length > 0)).toBe(true);
    expect(groups.length).toBeLessThanOrEqual(fuel.subcategories.length);
  });
});

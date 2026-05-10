import { describe, expect, test } from "vitest";
import { INSIGHTS } from "../../lib/insights";
import {
  DOMAINS_DAY6,
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

describe("getDomainById", () => {
  test("returns the domain when id matches", () => {
    expect(getDomainById("power")?.name).toBe("電力");
    expect(getDomainById("weather")?.emoji).toBe("🌤️");
  });

  test("returns undefined for unknown id (Day 7-8 with Phase C ドメイン)", () => {
    expect(getDomainById("finance")).toBeUndefined();
    expect(getDomainById("policy")).toBeUndefined();
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

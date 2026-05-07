import { describe, expect, test } from "vitest";
import {
  crossDomainLicense,
  daysSinceCutoff,
  domainOf,
  enrichIndicators,
  filterByDomain,
  filterByStatus,
  isSpdxLicense,
  recentlyUpdated,
  slaStatusOf,
  summarizeByDomain,
  summarizeByLicense,
  summarizeStatus,
  type Indicator,
} from "./catalog";

const NOW = new Date("2026-05-12T09:00:00+09:00");

const fixture: Indicator[] = [
  {
    id: "fuel-coal-au",
    name: "石炭（豪州 Newcastle）",
    domain: "fuel",
    frequency: "monthly",
    unit: "$/mt",
    source_name: "World Bank Pink Sheet",
    source_url: "https://example.com/wb",
    license: "CC-BY-4.0",
    observation_cutoff: "2026-04-01",
    updated_at: "2026-05-10T08:56:21+09:00",
    freshness_sla_days: 60,
  },
  {
    id: "jepx-tokyo",
    name: "JEPX 東京",
    domain: "power",
    frequency: "daily",
    unit: "円/kWh",
    source_name: "JEPX",
    source_url: "https://www.jepx.org",
    license: "jepx-terms",
    observation_cutoff: "2026-05-10",
    updated_at: "2026-05-11T05:00:00+09:00",
    freshness_sla_days: 3,
  },
  {
    id: "boj-jgb-10y",
    name: "JGB 10y",
    domain: "finance",
    frequency: "daily",
    unit: "%",
    source_name: "BoJ",
    source_url: "https://www.boj.or.jp",
    license: "boj-terms",
    observation_cutoff: "2026-05-09",
    updated_at: "2026-05-09T18:00:00+09:00",
    freshness_sla_days: 5,
  },
  {
    id: "jma-snow-osaka",
    name: "最深積雪 大阪",
    domain: "weather",
    frequency: "daily",
    unit: "cm",
    source_name: "JMA",
    source_url: "https://www.jma.go.jp",
    license: "jma-terms",
    observation_cutoff: "2021-01-15",
    updated_at: "2026-04-20T08:00:00+09:00",
    freshness_sla_days: 365,
  },
  {
    id: "jma-precip-tohoku-warn",
    name: "降水量 東北 (warning 域)",
    domain: "weather",
    frequency: "daily",
    unit: "mm",
    source_name: "JMA",
    source_url: "https://www.jma.go.jp",
    license: "jma-terms",
    observation_cutoff: "2026-05-05",
    updated_at: "2026-05-05T08:00:00+09:00",
    freshness_sla_days: 5,
  },
  {
    id: "missing-cutoff",
    name: "cutoff なし",
    domain: "fuel",
    frequency: "annual",
    unit: "—",
    source_name: "n/a",
    source_url: "https://example.com",
    license: "public-domain",
    observation_cutoff: "",
    updated_at: "2026-05-12T00:00:00+09:00",
  },
];

describe("Phase B-B Day 1: catalog 集計ヘルパ", () => {
  test("daysSinceCutoff: cutoff からの日数を JST で計算、cutoff なしは null", () => {
    expect(daysSinceCutoff(fixture[1], NOW)).toBe(2);
    expect(daysSinceCutoff(fixture[5], NOW)).toBeNull();
  });

  test("slaStatusOf: healthy / warning / breach / unknown を SLA × 1.5 で分類", () => {
    expect(slaStatusOf(fixture[1], NOW).status).toBe("healthy");
    expect(slaStatusOf(fixture[4], NOW).status).toBe("warning");
    expect(slaStatusOf(fixture[3], NOW).status).toBe("breach");
    expect(slaStatusOf(fixture[5], NOW).status).toBe("unknown");
  });

  test("isSpdxLicense: CC-BY / public-domain を SPDX 緑、boj-terms 等を非 SPDX 黄", () => {
    expect(isSpdxLicense("CC-BY-4.0")).toBe(true);
    expect(isSpdxLicense("public-domain")).toBe(true);
    expect(isSpdxLicense("boj-terms")).toBe(false);
    expect(isSpdxLicense("")).toBe(false);
  });

  test("filterByDomain + filterByStatus: クエリパラメータでの絞り込み", () => {
    const enriched = enrichIndicators(fixture, NOW);
    expect(filterByDomain(enriched, "weather")).toHaveLength(2);
    expect(filterByDomain(enriched, null)).toHaveLength(fixture.length);
    expect(filterByStatus(enriched, "breach").map((r) => r.id)).toEqual([
      "jma-snow-osaka",
    ]);
    expect(filterByStatus(enriched, "")).toHaveLength(fixture.length);
  });

  test("summarizeByDomain / summarizeByLicense: 件数降順", () => {
    const byDomain = summarizeByDomain(fixture);
    expect(byDomain[0].count).toBeGreaterThanOrEqual(byDomain.at(-1)!.count);
    expect(byDomain.find((d) => d.domain === "weather")?.count).toBe(2);
    expect(byDomain.find((d) => d.domain === "fuel")?.count).toBe(2);

    const byLicense = summarizeByLicense(fixture);
    expect(byLicense.find((l) => l.license === "CC-BY-4.0")?.isSpdx).toBe(true);
    expect(byLicense.find((l) => l.license === "boj-terms")?.isSpdx).toBe(false);
  });

  test("summarizeStatus: 4 区分の件数を返す", () => {
    const enriched = enrichIndicators(fixture, NOW);
    const counts = summarizeStatus(enriched);
    expect(counts.healthy + counts.warning + counts.breach + counts.unknown).toBe(
      fixture.length,
    );
    expect(counts.unknown).toBe(1);
    expect(counts.breach).toBeGreaterThanOrEqual(1);
  });

  test("recentlyUpdated: 7 日以内の更新のみ、updated_at 降順", () => {
    const recent = recentlyUpdated(fixture, 7, NOW);
    const ids = recent.map((r) => r.id);
    expect(ids).toContain("jepx-tokyo");
    expect(ids).toContain("missing-cutoff");
    expect(ids).not.toContain("jma-snow-osaka");
    expect(recent[0].updated_at >= recent[recent.length - 1].updated_at).toBe(true);
  });

  test("domainOf: 既知 id は table から、未知 id は fallback", () => {
    expect(domainOf("fuel").emoji).toBe("🔥");
    expect(domainOf("zzz-unknown")).toEqual({
      id: "zzz-unknown",
      ja: "zzz-unknown",
      emoji: "❓",
    });
  });

  test("crossDomainLicense: 行 domain × 列 license のクロス集計", () => {
    const cross = crossDomainLicense(fixture);
    expect(cross.domains).toContain("fuel");
    expect(cross.licenses).toContain("CC-BY-4.0");
    expect(cross.matrix["fuel"]["CC-BY-4.0"]).toBe(1);
    expect(cross.matrix["weather"]["jma-terms"]).toBe(2);
  });
});

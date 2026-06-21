import { describe, expect, test } from "vitest";
import {
  buildIndicatorSummary,
  canonicalDomain,
  countByCanonicalDomain,
  crossDomainLicense,
  daysSinceCutoff,
  domainOf,
  enrichIndicators,
  filterByCanonicalDomain,
  filterByDomain,
  filterByFrequency,
  filterByStatus,
  frequencyJa,
  getDependentIndicators,
  getDependsOn,
  getIndicatorById,
  isSpdxLicense,
  recentlyUpdated,
  searchIndicators,
  slaStatusOf,
  summarizeByDomain,
  summarizeByFrequency,
  summarizeByLicense,
  summarizeStatus,
  type Catalog,
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

  test("domainOf: 正準 12 ドメインを全て解決 (❓ を出さない)", () => {
    for (const id of [
      "power",
      "fuel",
      "finance",
      "weather",
      "esg",
      "tech",
      "geopolitics",
      "regulation",
      "population",
      "corp_ir",
      "international",
      "economy",
    ]) {
      expect(domainOf(id).emoji).not.toBe("❓");
      expect(domainOf(id).id).toBe(id);
    }
  });

  test("domainOf / canonicalDomain: macro→economy, electricity→power のエイリアス解決", () => {
    expect(canonicalDomain("macro")).toBe("economy");
    expect(canonicalDomain("electricity")).toBe("power");
    expect(domainOf("macro").id).toBe("economy");
    expect(domainOf("macro").emoji).toBe("📊");
    expect(domainOf("electricity").id).toBe("power");
    // 旧 web 短縮 ID も防御的に解決
    expect(canonicalDomain("geo")).toBe("geopolitics");
    expect(canonicalDomain("ir")).toBe("corp_ir");
    // 未知はそのまま返す
    expect(canonicalDomain("zzz-unknown")).toBe("zzz-unknown");
  });

  test("filterByCanonicalDomain / countByCanonicalDomain: macro を economy に畳み込む", () => {
    const rows = [
      { domain: "economy" },
      { domain: "macro" },
      { domain: "macro" },
      { domain: "power" },
    ];
    expect(filterByCanonicalDomain(rows, "economy")).toHaveLength(3);
    expect(filterByCanonicalDomain(rows, "power")).toHaveLength(1);
    expect(filterByCanonicalDomain(rows, null)).toHaveLength(4);
    const counts = countByCanonicalDomain(rows);
    expect(counts.get("economy")).toBe(3);
    expect(counts.get("power")).toBe(1);
    expect(counts.get("macro")).toBeUndefined();
  });

  test("crossDomainLicense: 行 domain × 列 license のクロス集計", () => {
    const cross = crossDomainLicense(fixture);
    expect(cross.domains).toContain("fuel");
    expect(cross.licenses).toContain("CC-BY-4.0");
    expect(cross.matrix["fuel"]["CC-BY-4.0"]).toBe(1);
    expect(cross.matrix["weather"]["jma-terms"]).toBe(2);
  });
});

describe("Phase B-B Day 2: catalog ページ向けヘルパ", () => {
  const day2Fixture: Indicator[] = [
    ...fixture,
    {
      id: "fx-decomp-jepx-tokyo",
      name: "為替分解 JEPX 東京",
      domain: "power",
      frequency: "daily",
      unit: "—",
      source_name: "derived",
      source_url: "",
      license: "CC-BY-4.0",
      observation_cutoff: "2026-05-10",
      updated_at: "2026-05-11T05:00:00+09:00",
      depends_on: ["jepx-tokyo", "boj-jgb-10y"],
    },
    {
      id: "thermal-fuel-cost-ratio",
      name: "火力燃料コスト比",
      domain: "fuel",
      frequency: "monthly",
      unit: "—",
      source_name: "derived",
      source_url: "",
      license: "CC-BY-4.0",
      observation_cutoff: "2026-04-01",
      updated_at: "2026-05-09T10:00:00+09:00",
      depends_on: "fuel-coal-au",
    },
  ];
  const catalog: Catalog = {
    version: 1,
    schema: "D-011",
    generated_at: "2026-05-08T09:00:00+09:00",
    indicator_count: day2Fixture.length,
    indicators: day2Fixture,
  };

  test("searchIndicators: id + name 部分一致 (大小無視)", () => {
    expect(searchIndicators(day2Fixture, "JEPX").map((r) => r.id)).toEqual([
      "jepx-tokyo",
      "fx-decomp-jepx-tokyo",
    ]);
    expect(searchIndicators(day2Fixture, "石炭")).toHaveLength(1);
    expect(searchIndicators(day2Fixture, "")).toHaveLength(day2Fixture.length);
    expect(searchIndicators(day2Fixture, null)).toHaveLength(day2Fixture.length);
  });

  test("getIndicatorById: 存在で indicator、欠落で undefined", () => {
    expect(getIndicatorById(catalog, "jepx-tokyo")?.name).toBe("JEPX 東京");
    expect(getIndicatorById(catalog, "no-such-id")).toBeUndefined();
  });

  test("getDependsOn: 文字列 / 配列 / null を統一して文字列配列にする", () => {
    expect(
      getDependsOn(getIndicatorById(catalog, "fx-decomp-jepx-tokyo")!),
    ).toEqual(["jepx-tokyo", "boj-jgb-10y"]);
    expect(
      getDependsOn(getIndicatorById(catalog, "thermal-fuel-cost-ratio")!),
    ).toEqual(["fuel-coal-au"]);
    expect(getDependsOn(getIndicatorById(catalog, "fuel-coal-au")!)).toEqual([]);
  });

  test("getDependentIndicators: 逆引きで参照元を列挙", () => {
    expect(
      getDependentIndicators(catalog, "jepx-tokyo").map((i) => i.id),
    ).toEqual(["fx-decomp-jepx-tokyo"]);
    expect(
      getDependentIndicators(catalog, "fuel-coal-au").map((i) => i.id),
    ).toEqual(["thermal-fuel-cost-ratio"]);
    expect(getDependentIndicators(catalog, "no-such-id")).toEqual([]);
  });

  test("summarizeByFrequency / filterByFrequency: 頻度の集計と絞り込み", () => {
    const summary = summarizeByFrequency(day2Fixture);
    expect(summary.find((s) => s.frequency === "daily")?.count).toBe(5);
    expect(summary.find((s) => s.frequency === "monthly")?.count).toBe(2);
    expect(summary.find((s) => s.frequency === "annual")?.count).toBe(1);
    expect(filterByFrequency(day2Fixture, "monthly")).toHaveLength(2);
    expect(filterByFrequency(day2Fixture, null)).toHaveLength(day2Fixture.length);
  });
});

describe("SEO T2-1: catalog 個別ページの独自プローズ生成", () => {
  // 実 catalog の jepx-spot-tokyo メタデータを再現（observation_cutoff のみ
  // 決定的検証のため固定。実系列は日次更新で cutoff が日々変わるため）。
  const jepx: Indicator = {
    id: "jepx-spot-tokyo",
    name: "JEPX スポット 東京エリアプライス",
    domain: "power",
    frequency: "daily",
    unit: "¥/kWh",
    source_name: "JEPX スポット価格（日次サマリ）",
    source_url: "https://www.jepx.jp/electricpower/market-data/spot/",
    license: "jepx-terms",
    observation_cutoff: "2026-06-13",
    updated_at: "2026-06-13T09:14:07+09:00",
    backfill_start: "2005-04-01",
    notes: "東京電力 PG 管内の日次平均約定価格。首都圏の指標",
  };

  test("frequencyJa: 実在 4 値 + 防御的 weekly を日本語化、未知/空は原値フォールバック", () => {
    expect(frequencyJa("daily")).toBe("日次");
    expect(frequencyJa("weekly")).toBe("週次");
    expect(frequencyJa("monthly")).toBe("月次");
    expect(frequencyJa("quarterly")).toBe("四半期");
    expect(frequencyJa("annual")).toBe("年次");
    expect(frequencyJa("hourly")).toBe("hourly");
    expect(frequencyJa("")).toBe("");
  });

  test("buildIndicatorSummary: 公表者・頻度・単位・カバー期間・notes・ドメインを 1 段落に統合", () => {
    const summary = buildIndicatorSummary(jepx);
    // 系列ごとに固有の本文 — 出典/頻度/単位の導入文
    expect(summary).toContain(
      "JEPX スポット 東京エリアプライスは、JEPX スポット価格（日次サマリ）が日次で公表する ¥/kWh の系列です。",
    );
    // backfill_start〜observation_cutoff のカバー期間
    expect(summary).toContain("2005-04-01〜2026-06-13をカバー。");
    // notes（最も独自性が高いシグナル）をそのまま含む
    expect(summary).toContain("東京電力 PG 管内の日次平均約定価格。首都圏の指標。");
    // ドメイン日本語 + 共通の信頼シグナルで締める
    expect(summary).toContain("電力・電源ドメイン。一次出典付き・無料。");
  });

  test("buildIndicatorSummary: 別頻度(四半期)系列でも頻度語が切り替わる", () => {
    const quarterly: Indicator = {
      id: "q-series",
      name: "四半期テスト系列",
      domain: "economy",
      frequency: "quarterly",
      unit: "%",
      source_name: "テスト出典",
      source_url: "",
      license: "CC-BY-4.0",
      observation_cutoff: "2026-03-31",
      updated_at: "2026-04-01T00:00:00+09:00",
    };
    const summary = buildIndicatorSummary(quarterly);
    expect(summary).toContain("テスト出典が四半期で公表する % の系列です。");
    expect(summary).toContain("経済ドメイン。一次出典付き・無料。");
  });

  test("buildIndicatorSummary: graceful — notes / backfill 欠損文は丸ごとスキップ", () => {
    const minimal: Indicator = {
      id: "min-series",
      name: "最小系列",
      domain: "fuel",
      frequency: "monthly",
      unit: "$/mt",
      source_name: "World Bank",
      source_url: "",
      license: "CC-BY-4.0",
      observation_cutoff: "2026-04-01",
      updated_at: "2026-05-01T00:00:00+09:00",
    };
    const summary = buildIndicatorSummary(minimal);
    expect(summary).toContain("最小系列は、World Bankが月次で公表する $/mt の系列です。");
    // backfill_start が無いので「をカバー。」は出ない
    expect(summary).not.toContain("をカバー。");
    expect(summary).toContain("燃料ドメイン。一次出典付き・無料。");
  });

  test("buildIndicatorSummary: notes が既に句点で終わるとき二重句点にしない", () => {
    const summary = buildIndicatorSummary({ ...jepx, notes: "句点付き注記。" });
    expect(summary).toContain("句点付き注記。");
    expect(summary).not.toContain("句点付き注記。。");
  });
});

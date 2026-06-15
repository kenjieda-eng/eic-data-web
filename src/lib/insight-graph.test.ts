import { describe, expect, test } from "vitest";
import {
  buildInsightGraph,
  computeInsightEdge,
  INSIGHT_DOMAIN_COLORS,
  insightEdgeWidth,
  insightNodeRadius,
} from "./insight-graph";
import { INSIGHT_DOMAINS } from "./insight-validator";
import { INSIGHTS, type Insight } from "./insights";

describe("/insight/network: insight-graph", () => {
  test("buildInsightGraph: nodes は 47 件 (INSIGHTS と同数)、孤立ノードなし", () => {
    const g = buildInsightGraph();
    expect(g.nodes).toHaveLength(INSIGHTS.length);
    expect(g.nodes.length).toBeGreaterThanOrEqual(47);
    // 全 47 本が少なくとも 1 エッジを持つ (孤立ゼロ)
    const isolated = g.nodes.filter((n) => n.degree === 0);
    expect(isolated).toHaveLength(0);
  });

  test("buildInsightGraph: degree の合計 = エッジ数 × 2 (グラフ理論基本則)", () => {
    const g = buildInsightGraph();
    const totalDegree = g.nodes.reduce((s, n) => s + n.degree, 0);
    expect(totalDegree).toBe(g.edges.length * 2);
  });

  test("buildInsightGraph: 全エッジに有効な source / target / weight > 0", () => {
    const g = buildInsightGraph();
    const slugs = new Set(g.nodes.map((n) => n.slug));
    expect(g.edges.length).toBeGreaterThan(0);
    for (const e of g.edges) {
      expect(slugs.has(e.source)).toBe(true);
      expect(slugs.has(e.target)).toBe(true);
      expect(e.source).not.toBe(e.target);
      expect(e.weight).toBeGreaterThan(0);
      expect(["tag", "indicator", "region"]).toContain(e.kind);
      expect(e.sharedTags.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("buildInsightGraph: エッジは無向で重複なし (順序問わず)", () => {
    const g = buildInsightGraph();
    const seen = new Set<string>();
    for (const e of g.edges) {
      const key = [e.source, e.target].sort().join("--");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  test("computeInsightEdge: 規則 1 共通タグ ≥ 2 で weight = 共通数", () => {
    const a: Insight = {
      slug: "a",
      title: "A",
      lede: "",
      tags: ["X", "Y", "Z"],
      sources: [],
      updated: "2026-05-14",
    };
    const b: Insight = {
      slug: "b",
      title: "B",
      lede: "",
      tags: ["X", "Y", "W"],
      sources: [],
      updated: "2026-05-14",
    };
    // 共通: X, Y (count 2) — indicator/region いずれにも該当しない非主要タグ
    const e = computeInsightEdge(a, b);
    expect(e).not.toBeNull();
    expect(e!.weight).toBe(2);
    expect(e!.kind).toBe("tag");
    expect(e!.sharedTags.sort()).toEqual(["X", "Y"]);
  });

  test("computeInsightEdge: 規則 2 共通 indicator ≥ 1 で weight = 数 × 1.5", () => {
    const a: Insight = {
      slug: "a",
      title: "A",
      lede: "",
      tags: ["LNG", "U"],
      sources: [],
      updated: "2026-05-14",
    };
    const b: Insight = {
      slug: "b",
      title: "B",
      lede: "",
      tags: ["LNG", "V"],
      sources: [],
      updated: "2026-05-14",
    };
    // 共通: LNG (indicator 1 件) → 1 × 1.5 = 1.5。タグは 1 件のみで規則 1 は不発火、region なし
    const e = computeInsightEdge(a, b);
    expect(e).not.toBeNull();
    expect(e!.weight).toBeCloseTo(1.5);
    expect(e!.kind).toBe("indicator");
  });

  test("computeInsightEdge: 規則 3 共通 region のみで weight = 1.0", () => {
    const a: Insight = {
      slug: "a",
      title: "A",
      lede: "",
      tags: ["東京", "U"],
      sources: [],
      updated: "2026-05-14",
    };
    const b: Insight = {
      slug: "b",
      title: "B",
      lede: "",
      tags: ["東京", "V"],
      sources: [],
      updated: "2026-05-14",
    };
    // 共通: 東京 (region 1) のみ → 規則 1 不発火、規則 2 不発火、規則 3 = 1.0
    const e = computeInsightEdge(a, b);
    expect(e).not.toBeNull();
    expect(e!.weight).toBe(1.0);
    expect(e!.kind).toBe("region");
  });

  test("computeInsightEdge: 共通タグなしなら null、self-loop なら null", () => {
    const a: Insight = {
      slug: "a",
      title: "A",
      lede: "",
      tags: ["X"],
      sources: [],
      updated: "2026-05-14",
    };
    const b: Insight = {
      slug: "b",
      title: "B",
      lede: "",
      tags: ["Y"],
      sources: [],
      updated: "2026-05-14",
    };
    expect(computeInsightEdge(a, b)).toBeNull();
    expect(computeInsightEdge(a, a)).toBeNull();
  });

  test("computeInsightEdge: 規則 max() — indicator > tag > region でタイブレーク", () => {
    // 共通: LNG (indicator), 燃料 (非主要 indicator/region でも tag count に貢献)
    // 規則 1: shared count 2 → weight 2
    // 規則 2: indicator 1 → weight 1.5
    // → max=2 (規則 1) で kind=tag
    const a: Insight = {
      slug: "a",
      title: "A",
      lede: "",
      tags: ["LNG", "燃料"],
      sources: [],
      updated: "2026-05-14",
    };
    const b: Insight = {
      slug: "b",
      title: "B",
      lede: "",
      tags: ["LNG", "燃料"],
      sources: [],
      updated: "2026-05-14",
    };
    const e = computeInsightEdge(a, b);
    expect(e).not.toBeNull();
    expect(e!.weight).toBe(2);
    expect(e!.kind).toBe("tag");
  });

  test("insightNodeRadius: degree 0 → 6px、最大 degree → 18px、zero-div 安全", () => {
    expect(insightNodeRadius(0, 10)).toBe(6);
    expect(insightNodeRadius(10, 10)).toBe(18);
    expect(insightNodeRadius(5, 10)).toBeCloseTo(12);
    expect(insightNodeRadius(0, 0)).toBe(6);
  });

  test("insightEdgeWidth: weight 0 → 0.4px、weight max → 2.5px、clamp", () => {
    expect(insightEdgeWidth(0, 5)).toBe(0.4);
    expect(insightEdgeWidth(5, 5)).toBe(2.5);
    expect(insightEdgeWidth(-1, 5)).toBe(0.4); // clamp
    expect(insightEdgeWidth(10, 5)).toBe(2.5); // clamp
    expect(insightEdgeWidth(1, 0)).toBe(0.4); // zero-div
  });

  test("INSIGHT_DOMAIN_COLORS: 5 主要 domain (power/weather/fuel/finance/other) に色定義", () => {
    expect(INSIGHT_DOMAIN_COLORS.power).toMatch(/^#[0-9a-f]{6}$/i);
    expect(INSIGHT_DOMAIN_COLORS.weather).toMatch(/^#[0-9a-f]{6}$/i);
    expect(INSIGHT_DOMAIN_COLORS.fuel).toMatch(/^#[0-9a-f]{6}$/i);
    expect(INSIGHT_DOMAIN_COLORS.finance).toMatch(/^#[0-9a-f]{6}$/i);
    expect(INSIGHT_DOMAIN_COLORS.other).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("buildInsightGraph: 各 node の domain は正準 12 ドメイン + other のいずれか", () => {
    const g = buildInsightGraph();
    const validDomains = new Set<string>([...INSIGHT_DOMAINS, "other"]);
    for (const n of g.nodes) {
      expect(validDomains.has(n.domain)).toBe(true);
    }
    // 47 本中、主要 4 domain のいずれかが大半
    const majorCount = g.nodes.filter((n) =>
      ["power", "weather", "fuel", "finance"].includes(n.domain),
    ).length;
    expect(majorCount).toBeGreaterThanOrEqual(35);
  });
});

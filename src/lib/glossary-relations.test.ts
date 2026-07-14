import { describe, expect, test } from "vitest";
import { GLOSSARY_TERMS } from "../app/glossary/data";
import {
  buildGlossaryGraph,
  edgeWidth,
  GLOSSARY_CATEGORY_COLORS,
  GLOSSARY_RELATIONS,
  nodeRadius,
} from "./glossary-relations";

describe("/glossary/graph: glossary-relations", () => {
  test("GLOSSARY_RELATIONS は全 from/to が GLOSSARY_TERMS の slug を参照", () => {
    const slugs = new Set(GLOSSARY_TERMS.map((t) => t.slug));
    for (const r of GLOSSARY_RELATIONS) {
      expect(slugs.has(r.from)).toBe(true);
      expect(slugs.has(r.to)).toBe(true);
      expect(r.from).not.toBe(r.to);
    }
  });

  test("GLOSSARY_RELATIONS の weight は 0-1 の範囲", () => {
    for (const r of GLOSSARY_RELATIONS) {
      expect(r.weight).toBeGreaterThan(0);
      expect(r.weight).toBeLessThanOrEqual(1);
    }
  });

  test("GLOSSARY_RELATIONS は 70-185 件 (Day 4 拡張 70-100 + Day 6 PM +10 で 109 + Phase D #61 +10 で 119 + Phase D #61 連動 容量市場 +10 で 129 + D-018 需給調整市場 +9 で 138 + Phase 2 Ember 3部作 +20 で 158 + EU ETS 方法論 +12 で 170 + #74 lcoe/lcos +5 で 175 + #100 託送料金 +4 で 179 + #102 市場分断 +3 で 182)", () => {
    expect(GLOSSARY_RELATIONS.length).toBeGreaterThanOrEqual(70);
    expect(GLOSSARY_RELATIONS.length).toBeLessThanOrEqual(185);
    expect(GLOSSARY_RELATIONS.length).toBe(182);
  });

  test("GLOSSARY_RELATIONS は重複なし (順序問わず)", () => {
    const seen = new Set<string>();
    for (const r of GLOSSARY_RELATIONS) {
      const key = [r.from, r.to].sort().join("--");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  test("buildGlossaryGraph: nodes は 76 件、各 degree が正しく集計", () => {
    const g = buildGlossaryGraph();
    expect(g.nodes).toHaveLength(76);
    // 手動チェック: jepx-spot は 6 + Day4 拡張 2 (fuel-pass-through / industrial-production) + Day5 午後 2 (yen-denominated-cost / transmission-line-constraint) + Phase D 1 (occto) + Phase D #61 連動 1 (kw-value) + #102 市場分断 1 (market-splitting) = 13 本
    const jepx = g.nodes.find((n) => n.slug === "jepx-spot");
    expect(jepx?.degree).toBe(13);
    // 全 degree の合計 = エッジ数 × 2
    const totalDegree = g.nodes.reduce((sum, n) => sum + n.degree, 0);
    expect(totalDegree).toBe(g.edges.length * 2);
  });

  test("buildGlossaryGraph: edges は GLOSSARY_RELATIONS と同数 (全 slug が GLOSSARY_TERMS に存在)", () => {
    const g = buildGlossaryGraph();
    expect(g.edges).toHaveLength(GLOSSARY_RELATIONS.length);
    for (const e of g.edges) {
      expect(typeof e.source).toBe("string");
      expect(typeof e.target).toBe("string");
      expect(e.weight).toBeGreaterThan(0);
    }
  });

  test("buildGlossaryGraph: 存在しない slug を参照する relation は除外", () => {
    const g = buildGlossaryGraph(GLOSSARY_TERMS, [
      ...GLOSSARY_RELATIONS,
      { from: "non-existent", to: "jepx-spot", weight: 0.5 },
      { from: "jepx-spot", to: "jepx-spot", weight: 1 }, // self-loop
    ]);
    expect(g.edges).toHaveLength(GLOSSARY_RELATIONS.length);
  });

  test("buildGlossaryGraph: 各 node の categoryLabel は GLOSSARY_CATEGORIES 経由", () => {
    const g = buildGlossaryGraph();
    const labels = new Set(g.nodes.map((n) => n.categoryLabel));
    expect(labels.has("基本")).toBe(true);
    expect(labels.has("金融・マクロ")).toBe(true);
    expect(labels.has("制度")).toBe(true);
    expect(labels.has("経済")).toBe(true);
  });

  test("nodeRadius: degree 0 = 最小 8px、最大 degree = 20px", () => {
    expect(nodeRadius(0, 10)).toBe(8);
    expect(nodeRadius(10, 10)).toBe(20);
    expect(nodeRadius(5, 10)).toBeCloseTo(14);
    expect(nodeRadius(0, 0)).toBe(8); // maxDegree=0 でも 8 (zero-div 安全)
  });

  test("edgeWidth: weight 0 = 0.5px、weight 1 = 3px、clamp 動作", () => {
    expect(edgeWidth(0)).toBe(0.5);
    expect(edgeWidth(1)).toBe(3);
    expect(edgeWidth(0.5)).toBeCloseTo(1.75);
    expect(edgeWidth(-1)).toBe(0.5); // clamp
    expect(edgeWidth(2)).toBe(3); // clamp
  });

  test("GLOSSARY_CATEGORY_COLORS: 7 カテゴリ全てに色定義 (Day 5 午後で international 追加)", () => {
    expect(GLOSSARY_CATEGORY_COLORS.basic).toMatch(/^#[0-9a-f]{6}$/i);
    expect(GLOSSARY_CATEGORY_COLORS.regulation).toMatch(/^#[0-9a-f]{6}$/i);
    expect(GLOSSARY_CATEGORY_COLORS.power).toMatch(/^#[0-9a-f]{6}$/i);
    expect(GLOSSARY_CATEGORY_COLORS.fuel).toMatch(/^#[0-9a-f]{6}$/i);
    expect(GLOSSARY_CATEGORY_COLORS.finance).toMatch(/^#[0-9a-f]{6}$/i);
    expect(GLOSSARY_CATEGORY_COLORS.economy).toMatch(/^#[0-9a-f]{6}$/i);
    expect(GLOSSARY_CATEGORY_COLORS.international).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("全 76 用語が少なくとも 1 つの関連 (孤立ノードなし)", () => {
    const g = buildGlossaryGraph();
    const isolated = g.nodes.filter((n) => n.degree === 0);
    expect(isolated).toHaveLength(0);
  });
});

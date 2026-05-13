import { describe, expect, test } from "vitest";
import { INSIGHTS } from "./insights";
import {
  findRegionBySlug,
  getRegionShape,
  PROJECTION,
  projectLatLng,
  REGION_SHAPES,
  REGIONS,
  regionPin,
} from "./region-coords";

describe("/map: region-coords", () => {
  test("REGIONS は 9 件 (JEPX 9 エリアと整合)", () => {
    expect(REGIONS).toHaveLength(9);
    const slugs = REGIONS.map((r) => r.slug).sort();
    expect(slugs).toEqual([
      "chubu",
      "chugoku",
      "hokkaido",
      "hokuriku",
      "kansai",
      "kyushu",
      "shikoku",
      "tohoku",
      "tokyo",
    ]);
  });

  test("REGIONS 各 region の insightSlug は INSIGHTS に存在 (リンク切れ防止)", () => {
    const insightSlugs = new Set(INSIGHTS.map((i) => i.slug));
    for (const r of REGIONS) {
      expect(insightSlugs.has(r.insightSlug), `${r.slug}: ${r.insightSlug}`).toBe(
        true,
      );
    }
  });

  test("REGIONS の color は tailwind-500 系 #RRGGBB", () => {
    for (const r of REGIONS) {
      expect(r.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
    // 9 色がすべて異なる
    const colors = new Set(REGIONS.map((r) => r.color));
    expect(colors.size).toBe(9);
  });

  test("REGIONS の lat/lng は日本の範囲内 (24-46°N / 122-146°E)", () => {
    for (const r of REGIONS) {
      expect(r.lat).toBeGreaterThan(30);
      expect(r.lat).toBeLessThan(46);
      expect(r.lng).toBeGreaterThan(128);
      expect(r.lng).toBeLessThan(146);
    }
  });

  test("projectLatLng: 端点 (lngMin, latMax) → (0, 0)、(lngMax, latMin) → (width, height)", () => {
    const tl = projectLatLng(PROJECTION.latMax, PROJECTION.lngMin);
    expect(tl).toEqual({ x: 0, y: 0 });
    const br = projectLatLng(PROJECTION.latMin, PROJECTION.lngMax);
    expect(br).toEqual({ x: PROJECTION.width, y: PROJECTION.height });
  });

  test("projectLatLng: 線形性 — 中央点は (width/2, height/2)", () => {
    const midLat = (PROJECTION.latMin + PROJECTION.latMax) / 2;
    const midLng = (PROJECTION.lngMin + PROJECTION.lngMax) / 2;
    const mid = projectLatLng(midLat, midLng);
    expect(mid.x).toBeCloseTo(PROJECTION.width / 2);
    expect(mid.y).toBeCloseTo(PROJECTION.height / 2);
  });

  test("regionPin: 札幌 (43.06, 141.35) はキャンバス右上、福岡 (33.59, 130.40) は左下", () => {
    const hokkaido = REGIONS.find((r) => r.slug === "hokkaido")!;
    const kyushu = REGIONS.find((r) => r.slug === "kyushu")!;
    const h = regionPin(hokkaido);
    const k = regionPin(kyushu);
    // 北海道 は 九州 より右上 (x 大、y 小)
    expect(h.x).toBeGreaterThan(k.x);
    expect(h.y).toBeLessThan(k.y);
  });

  test("REGION_SHAPES: 全 9 slug に shape 定義あり、rx/ry > 0", () => {
    for (const r of REGIONS) {
      const s = getRegionShape(r.slug);
      expect(s, `${r.slug} の shape 未定義`).toBeDefined();
      expect(s!.rx).toBeGreaterThan(0);
      expect(s!.ry).toBeGreaterThan(0);
    }
    expect(Object.keys(REGION_SHAPES)).toHaveLength(9);
  });

  test("findRegionBySlug: 存在する slug は region を返す、未知 slug は undefined", () => {
    expect(findRegionBySlug("tokyo")?.ja).toBe("東京 (関東)");
    expect(findRegionBySlug("non-existent")).toBeUndefined();
  });

  test("REGIONS insightNumber は 1-10 の範囲、9 件すべて異なる", () => {
    const nums = REGIONS.map((r) => r.insightNumber);
    for (const n of nums) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    }
    expect(new Set(nums).size).toBe(9);
  });

  test("REGIONS の city は 9 つすべて異なる (JMA 気象官署が region と 1:1 対応)", () => {
    const cities = REGIONS.map((r) => r.city);
    expect(new Set(cities).size).toBe(9);
  });
});

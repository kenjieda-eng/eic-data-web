import { describe, expect, test } from "vitest";
import { adaptIndicatorResponse, idToDirectory } from "./series";

describe("Phase C Day 3 hotfix: idToDirectory", () => {
  test("default = id 先頭セグメント (fuel/jepx/jma/jgb/fx 系)", () => {
    expect(idToDirectory("fuel-lng-jp-cif")).toBe("fuel");
    expect(idToDirectory("jepx-spot-tokyo")).toBe("jepx");
    expect(idToDirectory("jma-snow-max-tokyo")).toBe("jma");
    expect(idToDirectory("jgb-10y-yield")).toBe("jgb");
    expect(idToDirectory("fx-usdjpy-monthly-avg")).toBe("fx");
  });

  test("us-treasury-* は finance", () => {
    expect(idToDirectory("us-treasury-2y")).toBe("finance");
    expect(idToDirectory("us-treasury-10y")).toBe("finance");
    expect(idToDirectory("us-treasury-30y")).toBe("finance");
  });

  test("meti-* は enecho-power", () => {
    expect(idToDirectory("meti-gen-thermal")).toBe("enecho-power");
    expect(idToDirectory("meti-demand-total")).toBe("enecho-power");
    expect(idToDirectory("meti-renewables-share")).toBe("enecho-power");
  });

  test("Phase 3-B 第 2 弾 米マクロ 3 系列は macro (Day 3 hotfix で修正)", () => {
    expect(idToDirectory("us-cpi-yoy")).toBe("macro");
    expect(idToDirectory("us-fed-funds-rate")).toBe("macro");
    expect(idToDirectory("us-industrial-production")).toBe("macro");
  });

  test("hyphen 不在 id は throw", () => {
    expect(() => idToDirectory("bogus")).toThrow();
  });

  test("idToDirectory は fallback。capacity-*/balancing-* など catalog 実体と乖離する id は csv_path 優先で正解パス解決される (本テストは fallback 挙動のみ確認)", () => {
    // capacity-* の実体は occto-capacity/ なので idToDirectory の "capacity" 推測は不正解。
    // 実 URL 組み立ては fetchSeries で ind.csv_path を最優先するため問題なし。
    expect(idToDirectory("capacity-main-auction-price-national")).toBe("capacity");
    expect(idToDirectory("balancing-primary-tokyo")).toBe("balancing");
  });
});

describe("P0 hotfix: adaptIndicatorResponse (クライアント /api/indicator 経由)", () => {
  // route.ts は Indicator を top-level に spread し、時系列を data に載せる形。
  const okResponse = {
    id: "jepx-spot-tokyo",
    name: "JEPX スポット 東京",
    domain: "power",
    frequency: "daily",
    unit: "¥/kWh",
    source_name: "JEPX",
    source_url: "https://www.jepx.jp/",
    license: "CC-BY-4.0",
    observation_cutoff: "2026-07-08",
    updated_at: "2026-07-09T00:00:00Z",
    data: [
      { date: "2026-07-07", value: 9.32 },
      { date: "2026-07-08", value: null },
      { date: "", value: 1 }, // 空 date はスキップ
    ],
    meta: { generated_at: "2026-07-09T00:00:00Z", schema: "series-v1" },
  };

  test("API 形 → SeriesMeta / SeriesPoint に変換 (必須8フィールド + data)", () => {
    const { meta, points } = adaptIndicatorResponse("jepx-spot-tokyo", okResponse);
    expect(meta).toEqual({
      id: "jepx-spot-tokyo",
      name: "JEPX スポット 東京",
      unit: "¥/kWh",
      source_name: "JEPX",
      source_url: "https://www.jepx.jp/",
      observation_cutoff: "2026-07-08",
      license: "CC-BY-4.0",
      domain: "power",
    });
    // 空 date 行は除外、null 値は null のまま保持。
    expect(points).toEqual([
      { date: "2026-07-07", value: 9.32 },
      { date: "2026-07-08", value: null },
    ]);
  });

  test("エラー本文 (error フィールド) は throw", () => {
    expect(() =>
      adaptIndicatorResponse("bogus", { error: "indicator not found", id: "bogus" }),
    ).toThrow(/bogus/);
  });

  test("CSV 取得失敗 (meta.series_error) は throw してチャート error 表示を活かす", () => {
    const withSeriesError = {
      ...okResponse,
      data: [],
      meta: { series_error: "Failed to fetch series jepx-spot-tokyo: 429" },
    };
    expect(() =>
      adaptIndicatorResponse("jepx-spot-tokyo", withSeriesError),
    ).toThrow(/series/);
  });

  test("必須フィールド欠落は throw", () => {
    const missingUnit: Record<string, unknown> = { ...okResponse };
    delete missingUnit.unit;
    expect(() => adaptIndicatorResponse("jepx-spot-tokyo", missingUnit)).toThrow(
      /unit/,
    );
  });
});

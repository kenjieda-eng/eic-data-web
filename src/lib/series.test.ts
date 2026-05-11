import { describe, expect, test } from "vitest";
import { idToDirectory } from "./series";

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
});

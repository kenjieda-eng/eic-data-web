import { describe, expect, it } from "vitest";
import { buildSparkline, formatEmbedNumber } from "./embed-sparkline";

describe("buildSparkline", () => {
  it("returns null when there are no valued points", () => {
    expect(buildSparkline([])).toBeNull();
    expect(buildSparkline([{ date: "2026-05-01", value: null }])).toBeNull();
  });

  it("builds a path with one M and N-1 L commands", () => {
    const points = [
      { date: "2026-01", value: 1 },
      { date: "2026-02", value: 2 },
      { date: "2026-03", value: 3 },
    ];
    const s = buildSparkline(points);
    expect(s).not.toBeNull();
    expect(s!.path.match(/M/g)!.length).toBe(1);
    expect(s!.path.match(/L/g)!.length).toBe(2);
    expect(s!.count).toBe(3);
    expect(s!.min).toBe(1);
    expect(s!.max).toBe(3);
    expect(s!.first).toBe(1);
    expect(s!.last).toBe(3);
  });

  it("classifies trend as up when last > first beyond threshold", () => {
    const s = buildSparkline([
      { date: "1", value: 10 },
      { date: "2", value: 20 },
    ]);
    expect(s!.trend).toBe("up");
  });

  it("classifies trend as down when last < first beyond threshold", () => {
    const s = buildSparkline([
      { date: "1", value: 20 },
      { date: "2", value: 10 },
    ]);
    expect(s!.trend).toBe("down");
  });

  it("classifies trend as flat when delta is below threshold", () => {
    const s = buildSparkline([
      { date: "1", value: 100 },
      { date: "2", value: 100.1 },
    ]);
    expect(s!.trend).toBe("flat");
  });

  it("classifies trend as unknown when only one valued point", () => {
    const s = buildSparkline([
      { date: "1", value: null },
      { date: "2", value: 5 },
    ]);
    expect(s!.trend).toBe("unknown");
  });

  it("ignores null points but keeps valued ordering", () => {
    const s = buildSparkline([
      { date: "1", value: 1 },
      { date: "2", value: null },
      { date: "3", value: 5 },
    ]);
    expect(s!.count).toBe(2);
    expect(s!.first).toBe(1);
    expect(s!.last).toBe(5);
  });

  it("respects custom width/height/padding", () => {
    const s = buildSparkline(
      [
        { date: "1", value: 0 },
        { date: "2", value: 10 },
      ],
      { width: 100, height: 50, padding: 5 },
    )!;
    // first point x = padding = 5; last point x = width - padding = 95
    expect(s.path.startsWith("M5.00,")).toBe(true);
    expect(s.path).toContain("L95.00,");
  });
});

describe("formatEmbedNumber", () => {
  it("uses 0 decimals when |n| >= 100", () => {
    expect(formatEmbedNumber(123.456, "円/kWh")).toBe("123 円/kWh");
    expect(formatEmbedNumber(-200.7, "")).toBe("-201");
  });
  it("uses 2 decimals when |n| < 100", () => {
    expect(formatEmbedNumber(9.32, "円/kWh")).toBe("9.32 円/kWh");
    expect(formatEmbedNumber(0, "JPY")).toBe("0.00 JPY");
  });
});

import { describe, expect, test } from "vitest";
import {
  CUSTOM_LICENSES,
  D011_SCHEMA,
  METHODOLOGY_SECTIONS,
  QUALITY_SIGNALS,
  SPDX_LICENSES,
} from "./sections";

describe("METHODOLOGY_SECTIONS", () => {
  test("contains 10 sections in order 1-10", () => {
    expect(METHODOLOGY_SECTIONS).toHaveLength(10);
    METHODOLOGY_SECTIONS.forEach((s, idx) => {
      expect(s.number).toBe(idx + 1);
      expect(s.id).toBe(`methodology-sec-${idx + 1}`);
    });
  });

  test("ids are unique", () => {
    const ids = METHODOLOGY_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("D011_SCHEMA", () => {
  test("has 10 required + 5 recommended + 4 optional = 19 fields", () => {
    const counts = D011_SCHEMA.reduce(
      (acc, f) => ({ ...acc, [f.tier]: (acc[f.tier] ?? 0) + 1 }),
      {} as Record<string, number>,
    );
    expect(counts.required).toBe(10);
    expect(counts.recommended).toBe(5);
    expect(counts.optional).toBe(4);
    expect(D011_SCHEMA).toHaveLength(19);
  });
});

describe("license tables", () => {
  test("SPDX has 4 rows, custom has 7 rows", () => {
    expect(SPDX_LICENSES).toHaveLength(4);
    expect(CUSTOM_LICENSES).toHaveLength(7);
  });

  test("custom license rows include eprx-terms and occto-terms", () => {
    const ids = CUSTOM_LICENSES.map((l) => l.id);
    expect(ids).toContain("eprx-terms");
    expect(ids).toContain("occto-terms");
  });
});

describe("QUALITY_SIGNALS", () => {
  test("has 4 signals", () => {
    expect(QUALITY_SIGNALS).toHaveLength(4);
  });
});

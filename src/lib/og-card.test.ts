import { describe, expect, it } from "vitest";
import {
  catalogCard,
  ellipsize,
  glossaryCard,
  insightCard,
  isValidOgType,
} from "./og-card";

describe("ellipsize", () => {
  it("returns the input as-is when within limit", () => {
    expect(ellipsize("hello", 10)).toBe("hello");
    expect(ellipsize("12345", 5)).toBe("12345");
  });
  it("truncates with ellipsis to exactly max length", () => {
    const r = ellipsize("abcdefghij", 6);
    expect(r.length).toBe(6);
    expect(r.endsWith("…")).toBe(true);
    expect(r).toBe("abcde…");
  });
});

describe("catalogCard", () => {
  it("builds badge/title/body/meta from indicator fields", () => {
    const c = catalogCard({
      id: "jepx-spot-tokyo",
      name: "JEPX 東京エリア スポット",
      source_name: "JEPX",
      frequency: "daily",
      unit: "JPY/kWh",
      observation_cutoff: "2026-05-16",
      license: "JEPX 利用規約",
    });
    expect(c.badge).toContain("カタログ");
    expect(c.title).toBe("JEPX 東京エリア スポット");
    expect(c.body).toBe("JEPX / daily / JPY/kWh");
    expect(c.meta).toContain("2026-05-16");
    expect(c.meta).toContain("JEPX 利用規約");
  });
  it("falls back to id when name is empty", () => {
    const c = catalogCard({
      id: "x",
      name: "",
      source_name: "s",
      frequency: "f",
      unit: "u",
      observation_cutoff: "d",
      license: "l",
    });
    expect(c.title).toBe("x");
  });
});

describe("insightCard", () => {
  it("ellipsizes a long lede to 140 chars", () => {
    const lede = "あ".repeat(200);
    const c = insightCard({
      title: "T",
      lede,
      tags: ["a", "b"],
      updated: "2026-05-01",
    });
    expect([...c.body].length).toBe(140);
    expect(c.body.endsWith("…")).toBe(true);
  });
  it("caps tags to first 4 in meta", () => {
    const c = insightCard({
      title: "T",
      lede: "L",
      tags: ["a", "b", "c", "d", "e", "f"],
      updated: "2026-05-01",
    });
    expect(c.meta).toContain("a / b / c / d");
    expect(c.meta).not.toContain(" / e");
  });
});

describe("glossaryCard", () => {
  it("ellipsizes a long description to 120 chars", () => {
    const c = glossaryCard({
      slug: "x",
      name: "X",
      description: "い".repeat(200),
    });
    expect([...c.body].length).toBe(120);
    expect(c.body.endsWith("…")).toBe(true);
  });
  it("uses slug as meta", () => {
    const c = glossaryCard({ slug: "jepx-spot", name: "J", description: "d" });
    expect(c.meta).toBe("jepx-spot");
  });
});

describe("isValidOgType", () => {
  it("accepts the three valid types", () => {
    expect(isValidOgType("catalog")).toBe(true);
    expect(isValidOgType("insight")).toBe(true);
    expect(isValidOgType("glossary")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isValidOgType("foo")).toBe(false);
    expect(isValidOgType("")).toBe(false);
    expect(isValidOgType("Catalog")).toBe(false);
  });
});

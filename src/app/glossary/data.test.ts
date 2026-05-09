import { describe, expect, test } from "vitest";
import {
  GLOSSARY_TERMS,
  getTermBySlug,
  groupTermsByCategory,
  searchTerms,
} from "./data";

describe("GLOSSARY_TERMS", () => {
  test("contains 23 terms", () => {
    expect(GLOSSARY_TERMS).toHaveLength(23);
  });

  test("every term has slug, name, description, category", () => {
    for (const t of GLOSSARY_TERMS) {
      expect(t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.category).toMatch(/^(basic|regulation|fuel|power|finance)$/);
    }
  });

  test("slugs are unique", () => {
    const slugs = GLOSSARY_TERMS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("getTermBySlug", () => {
  test("returns the term when slug matches", () => {
    const term = getTermBySlug("jepx-spot");
    expect(term?.name).toBe("JEPX スポット");
  });

  test("returns undefined for unknown slug", () => {
    expect(getTermBySlug("not-a-real-slug")).toBeUndefined();
  });
});

describe("searchTerms", () => {
  test("returns all terms when query is empty", () => {
    expect(searchTerms(GLOSSARY_TERMS, "")).toHaveLength(GLOSSARY_TERMS.length);
    expect(searchTerms(GLOSSARY_TERMS, null)).toHaveLength(GLOSSARY_TERMS.length);
  });

  test("matches by slug", () => {
    const out = searchTerms(GLOSSARY_TERMS, "jepx");
    expect(out.some((t) => t.slug === "jepx-spot")).toBe(true);
  });

  test("matches by description (case-insensitive)", () => {
    const out = searchTerms(GLOSSARY_TERMS, "FRB");
    expect(out.some((t) => t.slug === "fed-funds-rate")).toBe(true);
  });
});

describe("groupTermsByCategory", () => {
  test("groups every term and preserves total count", () => {
    const groups = groupTermsByCategory(GLOSSARY_TERMS);
    const total = groups.reduce((sum, g) => sum + g.terms.length, 0);
    expect(total).toBe(GLOSSARY_TERMS.length);
  });

  test("orders basic before finance", () => {
    const groups = groupTermsByCategory(GLOSSARY_TERMS);
    const basicIdx = groups.findIndex((g) => g.category === "basic");
    const financeIdx = groups.findIndex((g) => g.category === "finance");
    expect(basicIdx).toBeLessThan(financeIdx);
  });
});

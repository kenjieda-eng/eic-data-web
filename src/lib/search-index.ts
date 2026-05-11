import type { Catalog, Indicator } from "./catalog";
import { GLOSSARY_CATEGORIES, GLOSSARY_TERMS, type GlossaryTerm } from "../app/glossary/data";
import { INSIGHTS, type Insight } from "./insights";

export type SearchCategory = "indicator" | "insight" | "glossary";

export interface SearchEntry {
  id: string;
  category: SearchCategory;
  title: string;
  description: string;
  url: string;
  tokens: string;
  meta?: string;
}

function indicatorEntry(i: Indicator): SearchEntry {
  return {
    id: i.id,
    category: "indicator",
    title: i.name,
    description: `${i.domain} ／ ${i.frequency} ／ ${i.unit} ／ ${i.source_name}`,
    url: `/catalog/${i.id}`,
    tokens: [i.id, i.name, i.domain, i.frequency, i.unit, i.source_name, i.publisher ?? ""]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    meta: i.source_name,
  };
}

function insightEntry(i: Insight): SearchEntry {
  return {
    id: i.slug,
    category: "insight",
    title: i.title,
    description: i.lede,
    url: `/insight/${i.slug}`,
    tokens: [i.slug, i.title, i.lede, i.tags.join(" "), i.sources.join(" ")]
      .join(" ")
      .toLowerCase(),
    meta: i.tags.join(" / "),
  };
}

function glossaryEntry(t: GlossaryTerm): SearchEntry {
  const category = GLOSSARY_CATEGORIES[t.category];
  return {
    id: t.slug,
    category: "glossary",
    title: t.name,
    description: t.description,
    url: `/glossary/${t.slug}`,
    tokens: [t.slug, t.name, t.description, t.category, category].join(" ").toLowerCase(),
    meta: category,
  };
}

export interface SearchIndex {
  entries: SearchEntry[];
  totals: Record<SearchCategory | "all", number>;
}

export function buildSearchIndex(catalog: Catalog): SearchIndex {
  const entries: SearchEntry[] = [
    ...catalog.indicators.map(indicatorEntry),
    ...INSIGHTS.map(insightEntry),
    ...GLOSSARY_TERMS.map(glossaryEntry),
  ];
  return {
    entries,
    totals: {
      all: entries.length,
      indicator: catalog.indicators.length,
      insight: INSIGHTS.length,
      glossary: GLOSSARY_TERMS.length,
    },
  };
}

export interface SearchOptions {
  query: string | null | undefined;
  category?: SearchCategory | null;
  limit?: number;
}

export interface SearchResult {
  entries: SearchEntry[];
  counts: Record<SearchCategory | "all", number>;
  truncated: boolean;
}

const DEFAULT_LIMIT = 200;

export function searchEntries(
  index: SearchIndex,
  options: SearchOptions,
): SearchResult {
  const rawQuery = (options.query ?? "").trim().toLowerCase();
  const category = options.category ?? null;
  const limit = options.limit ?? DEFAULT_LIMIT;

  const candidates = rawQuery
    ? index.entries.filter((e) => e.tokens.includes(rawQuery))
    : index.entries;

  const counts: Record<SearchCategory | "all", number> = {
    all: candidates.length,
    indicator: 0,
    insight: 0,
    glossary: 0,
  };
  for (const e of candidates) {
    counts[e.category] += 1;
  }

  const filtered = category
    ? candidates.filter((e) => e.category === category)
    : candidates;
  const truncated = filtered.length > limit;
  const entries = truncated ? filtered.slice(0, limit) : filtered;

  return { entries, counts, truncated };
}

export const SEARCH_CATEGORY_LABELS: Record<SearchCategory | "all", string> = {
  all: "全体",
  indicator: "指標カタログ",
  insight: "Insight",
  glossary: "用語集",
};

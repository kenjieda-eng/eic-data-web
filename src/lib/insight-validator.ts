/**
 * Insight frontmatter バリデータ — Phase C Day 1 (2026-05-12) で確立
 *
 * 新規 Insight 執筆時の frontmatter (src/content/insight-template.mdx の
 * yaml 風コメントブロックや、将来の自動生成スクリプトで抽出する dict) を
 * 構造的に検証する。エラーメッセージは執筆ガイド (docs/insight-authoring-guide.md) と整合。
 *
 * 既存 41 本の MDX には適用しない (それらは PR 当時に self-check 済)。
 * Phase C 以降に追加される新 Insight に対してテンプレ整合性を保証する役割。
 */

export const INSIGHT_DOMAINS = [
  "power",
  "weather",
  "fuel",
  "finance",
  "esg",
  "technology",
  "international",
  "economy",
  "policy",
] as const;
export type InsightDomain = (typeof INSIGHT_DOMAINS)[number];

export const INSIGHT_RENDERERS = [
  "ChartLine",
  "ChartDual",
  "ChartLagBars",
  "ChartDecomp",
  "ChartHeatmap",
  "ChartSpread",
] as const;
export type InsightRenderer = (typeof INSIGHT_RENDERERS)[number];

export interface InsightFrontmatter {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  author: string;
  domain: InsightDomain;
  tags: string[];
  indicators: string[];
  renderer: InsightRenderer;
  relatedInsights: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export function validateInsightFrontmatter(
  frontmatter: unknown,
): ValidationResult {
  const errors: string[] = [];

  if (typeof frontmatter !== "object" || frontmatter === null) {
    return { valid: false, errors: ["frontmatter must be an object"] };
  }
  const fm = frontmatter as Record<string, unknown>;

  // slug
  if (typeof fm.slug !== "string" || fm.slug.length === 0) {
    errors.push("slug is required");
  } else if (!SLUG_RE.test(fm.slug)) {
    errors.push("slug must be ASCII kebab-case (a-z, 0-9, hyphen)");
  } else if (fm.slug.length < 4 || fm.slug.length > 40) {
    errors.push("slug must be 4-40 chars");
  }

  // title
  if (typeof fm.title !== "string" || fm.title.length === 0) {
    errors.push("title is required");
  } else if (fm.title.length > 40) {
    errors.push("title must be ≤ 40 chars");
  }

  // description
  if (typeof fm.description !== "string" || fm.description.length === 0) {
    errors.push("description is required");
  } else if (fm.description.length > 160) {
    errors.push("description must be ≤ 160 chars");
  }

  // publishedAt
  if (typeof fm.publishedAt !== "string" || !ISO_DATE_RE.test(fm.publishedAt)) {
    errors.push("publishedAt must be ISO 8601 YYYY-MM-DD");
  }

  // author
  if (typeof fm.author !== "string" || fm.author.length === 0) {
    errors.push("author is required");
  }

  // domain
  if (
    typeof fm.domain !== "string" ||
    !(INSIGHT_DOMAINS as readonly string[]).includes(fm.domain)
  ) {
    errors.push(
      `domain must be one of: ${INSIGHT_DOMAINS.join(", ")}`,
    );
  }

  // tags
  if (!isStringArray(fm.tags)) {
    errors.push("tags must be an array of strings");
  } else if (fm.tags.length < 3 || fm.tags.length > 5) {
    errors.push("tags must be 3-5");
  } else if (new Set(fm.tags).size !== fm.tags.length) {
    errors.push("tags must be unique");
  }

  // indicators
  if (!isStringArray(fm.indicators)) {
    errors.push("indicators must be an array of strings");
  } else if (fm.indicators.length < 2 || fm.indicators.length > 5) {
    errors.push("indicators must be 2-5");
  }

  // renderer
  if (
    typeof fm.renderer !== "string" ||
    !(INSIGHT_RENDERERS as readonly string[]).includes(fm.renderer)
  ) {
    errors.push(
      `renderer must be one of: ${INSIGHT_RENDERERS.join(", ")}`,
    );
  }

  // relatedInsights
  if (!isStringArray(fm.relatedInsights)) {
    errors.push("relatedInsights must be an array of strings");
  } else if (
    fm.relatedInsights.length < 2 ||
    fm.relatedInsights.length > 4
  ) {
    errors.push("relatedInsights must be 2-4");
  }

  return { valid: errors.length === 0, errors };
}

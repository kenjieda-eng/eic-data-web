/**
 * N9 (Day 6, 2026-05-17): /api/og/<type>/<id> の表示カード生成 helper。
 * ImageResponse JSX とは独立した pure 関数として切り出し、
 * type 振り分け・文字列丸めの正しさを vitest で担保する。
 *
 * 実体は route.ts 側でも独立に保持しているが、ここではテストとロジック整合性のため
 * カード辞書化する単純な関数を提供する。
 */

import type { Indicator } from "./catalog";
import type { Insight } from "./insights";

export interface OgCard {
  badge: string;
  title: string;
  body: string;
  meta: string;
}

export function ellipsize(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export function catalogCard(indicator: Pick<Indicator,
  "id" | "name" | "source_name" | "frequency" | "unit" | "observation_cutoff" | "license"
>): OgCard {
  return {
    badge: "📊 編集指標カタログ",
    title: indicator.name || indicator.id,
    body: `${indicator.source_name} / ${indicator.frequency} / ${indicator.unit}`,
    meta: `as-of ${indicator.observation_cutoff} ／ ${indicator.license}`,
  };
}

export function insightCard(insight: Pick<Insight,
  "title" | "lede" | "tags" | "updated"
>): OgCard {
  return {
    badge: "🔍 EIC Data Insight",
    title: insight.title,
    body: ellipsize(insight.lede, 140),
    meta: `${insight.tags.slice(0, 4).join(" / ")} ／ 更新 ${insight.updated}`,
  };
}

export function glossaryCard(term: { name: string; slug: string; description: string }): OgCard {
  return {
    badge: "📖 用語集",
    title: term.name,
    body: ellipsize(term.description, 120),
    meta: term.slug,
  };
}

export const VALID_OG_TYPES = new Set(["catalog", "insight", "glossary"] as const);
export type OgType = "catalog" | "insight" | "glossary";

export function isValidOgType(type: string): type is OgType {
  return VALID_OG_TYPES.has(type as OgType);
}

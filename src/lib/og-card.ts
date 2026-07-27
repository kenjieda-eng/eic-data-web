/**
 * N9 (Day 6, 2026-05-17): /api/og/<type>/<id> の表示カード生成 helper。
 * ImageResponse JSX とは独立した pure 関数として切り出し、
 * type 振り分け・文字列丸めの正しさを vitest で担保する。
 *
 * 実体は route.ts 側でも独立に保持しているが、ここではテストとロジック整合性のため
 * カード辞書化する単純な関数を提供する。
 */

import { GLOSSARY_NAME_BY_SLUG } from "../app/glossary/data";
import type { Indicator } from "./catalog";
import { glossaryTextToPlain } from "./glossaryText";
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
    body: ellipsize(
      glossaryTextToPlain(term.description, GLOSSARY_NAME_BY_SLUG),
      120,
    ),
    meta: term.slug,
  };
}

/**
 * default タイプ: TOP / メタページ (data-quality, methodology, search 等) 用の汎用カード。
 * id は path-slug (例: "home", "data-quality", "methodology")。
 * 2026-05-18: OGP 自動生成完全版で追加、全 ~302 ページ自動配置のため。
 */
export function defaultCard(id: string): OgCard {
  return {
    badge: "EIC Data",
    title: "日本のエネルギーと金融の引用インフラ",
    body: "エネルギー・金融・マクロ経済の引用可能データ基盤。catalog 133 系列 + Insight 61 本 + 用語集 50 項目。",
    meta: id === "home" ? "data.eic-jp.org" : `data.eic-jp.org/${id}`,
  };
}

/**
 * page タイプ: ハブ・特集ページ用の「ページ固有タイトルを描く」汎用カード。
 * 2026-07-27 追加。default カードはサイト共通の固定タイトルしか描けないため、
 * /insight/guide のようなハブページで固有タイトルを見せる用途を賄えない。
 *
 * id → カードは下の PAGE_OG_CARDS に明示登録する。URL のタイトル文字列を
 * そのまま描画する方式にしないのは、未知 id で無制限に画像生成できてしまう
 * (route 冒頭の「不正 id は 400/404」= DoS 防止方針) のを避けるため。
 */
const PAGE_OG_CARDS = new Map<string, OgCard>([
  [
    "insight-guide",
    {
      badge: "🎓 教材ハブ",
      title: "電力市場を学ぶ — 教材14本の読み順ガイド",
      body: "JEPX スポット・エリアプライス・容量市場・需給調整市場・インバランス・非化石証書を、俯瞰から各論へ 5 章で読む。",
      // 右下に data.eic-jp.org が常時入るので、左下はパスではなく中身の要約を出す
      meta: "5 章・教材 14 本 ／ CC BY 4.0",
    },
  ],
]);

export function pageCard(id: string): OgCard | null {
  return PAGE_OG_CARDS.get(id) ?? null;
}

export const VALID_OG_TYPES = new Set([
  "catalog",
  "insight",
  "glossary",
  "default",
  "page",
] as const);
export type OgType = "catalog" | "insight" | "glossary" | "default" | "page";

export function isValidOgType(type: string): type is OgType {
  return VALID_OG_TYPES.has(type as OgType);
}

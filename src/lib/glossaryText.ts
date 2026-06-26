/**
 * 用語集 description 内の [[slug]] 相互リンク記法を解釈する純関数群。
 * React 非依存・副作用なしで、レンダラ (GlossaryText) と
 * プレーン化 (meta description / JSON-LD / OG 画像 / 検索インデックス) の双方から共有する。
 * slug → 用語名 の解決表は呼び出し側から渡す（テスト容易性のため）。
 */

export type GlossaryTextToken =
  | { type: "text"; value: string }
  | { type: "link"; slug: string; label: string };

export type NameBySlug = Map<string, string> | Record<string, string>;

/** 用語 slug は小文字英数とハイフンのみ。description 本文との誤マッチを避けるため厳密に限定。 */
const WIKILINK_SOURCE = "\\[\\[([a-z0-9-]+)\\]\\]";

function resolveName(nameBySlug: NameBySlug, slug: string): string | undefined {
  return nameBySlug instanceof Map ? nameBySlug.get(slug) : nameBySlug[slug];
}

/**
 * description を [[slug]] 境界で分割しトークン列にする。
 * - 既知 slug → link トークン（label = 用語名）
 * - 未知 slug → text トークン（slug をプレーン表示。graceful にフォールバックしページを壊さない）
 * - 記法外テキストはそのまま text トークン
 */
export function parseGlossaryText(
  text: string,
  nameBySlug: NameBySlug,
): GlossaryTextToken[] {
  const tokens: GlossaryTextToken[] = [];
  // /g は lastIndex を持ち状態を残すため、呼び出しごとに新しい RegExp を生成する。
  const re = new RegExp(WIKILINK_SOURCE, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const slug = match[1];
    const name = resolveName(nameBySlug, slug);
    if (name) {
      tokens.push({ type: "link", slug, label: name });
    } else {
      tokens.push({ type: "text", value: slug });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }
  return tokens;
}

/**
 * [[slug]] を解決済みテキスト（既知 = 用語名 / 未知 = slug）に置換したプレーン文字列。
 * リンク描画できない文脈（meta description・JSON-LD・OG 画像・検索インデックス）で使う。
 */
export function glossaryTextToPlain(
  text: string,
  nameBySlug: NameBySlug,
): string {
  return parseGlossaryText(text, nameBySlug)
    .map((token) => (token.type === "link" ? token.label : token.value))
    .join("");
}

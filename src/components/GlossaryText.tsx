import Link from "next/link";
import { Fragment } from "react";
import { GLOSSARY_NAME_BY_SLUG } from "@/app/glossary/data";
import { parseGlossaryText } from "@/lib/glossaryText";

/**
 * 用語集 description を描画する。description 内の [[slug]] 記法を、
 * 既存用語への実リンク (<Link href="/glossary/slug">用語名</Link>) に解決する。
 * 未知 slug・記法外テキストはプレーン文字として安全に描画し、ページを壊さない。
 * dangerouslySetInnerHTML は使わず、Link と文字列の React ノードを組み立てる。
 */
export default function GlossaryText({ text }: { text: string }) {
  const tokens = parseGlossaryText(text, GLOSSARY_NAME_BY_SLUG);
  return (
    <>
      {tokens.map((token, i) =>
        token.type === "link" ? (
          <Link
            key={i}
            href={`/glossary/${token.slug}`}
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            {token.label}
          </Link>
        ) : (
          <Fragment key={i}>{token.value}</Fragment>
        ),
      )}
    </>
  );
}

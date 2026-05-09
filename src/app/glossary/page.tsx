import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import GlossarySearchBox from "./components/GlossarySearchBox";
import GlossaryTable from "./components/GlossaryTable";
import { GLOSSARY_TERMS, searchTerms } from "./data";

export const metadata: Metadata = {
  title: "用語集 — EIC Data",
  description:
    "EIC Data 掲載指標で使われる主な用語 23 件。基本・制度・電力・燃料・金融マクロの 5 カテゴリで分類。各用語の個別ページから関連 Insight を辿れる。",
};

function pickQuery(
  raw: Record<string, string | string[] | undefined>,
): string {
  const v = raw.q;
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function GlossaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query = pickQuery(raw);
  const filtered = searchTerms(GLOSSARY_TERMS, query);

  return (
    <Container className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ 用語集"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          用語集 ／ {GLOSSARY_TERMS.length} 件
        </h1>
        <p className="mt-2 text-sm text-subink leading-relaxed">
          EIC Data 掲載指標で使われる主な用語{" "}
          <strong className="text-ink tabular-nums">
            {GLOSSARY_TERMS.length}
          </strong>{" "}
          件。基本・制度・電力・燃料・金融マクロの 5 カテゴリで分類。各用語名をクリックすると詳細ページに遷移し、関連する Insight を確認できる。
        </p>
      </header>

      <GlossarySearchBox query={query} />

      {query && (
        <p className="mb-3 text-[12px] text-faint">
          「{query}」の検索結果: {filtered.length} 件 / {GLOSSARY_TERMS.length} 件
        </p>
      )}

      <GlossaryTable terms={filtered} />

      <section className="mt-8 bg-slate-50 border border-slate-200 rounded-md p-5 text-[13px] text-subink leading-relaxed">
        <h3 className="text-[14px] font-semibold text-ink mb-2">
          用語集の役割
        </h3>
        <p>
          EIC Data の指標解説や Insight 本文では、エネルギー・電力・金融・マクロの専門用語を多く使います。本ページはそれらの定義をまとめ、各用語ページで関連する{" "}
          <Link
            href="/insight/map"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            Insight
          </Link>
          {" "}や{" "}
          <Link
            href="/catalog"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            編集指標カタログ
          </Link>
          {" "}を辿れるように設計しています。
        </p>
      </section>
    </Container>
  );
}

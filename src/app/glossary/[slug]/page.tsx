import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import RelatedInsights from "../components/RelatedInsights";
import { GLOSSARY_CATEGORIES, GLOSSARY_TERMS, getTermBySlug } from "../data";
import { findRelatedInsights } from "../related";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GLOSSARY_TERMS.map((t) => ({ slug: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) {
    return { title: "用語が見つかりません — EIC Data" };
  }
  return {
    title: `${term.name} — EIC Data 用語集`,
    description: term.description.slice(0, 120),
  };
}

export default async function GlossaryTermPage({ params }: PageProps) {
  const { slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) notFound();

  const related = findRelatedInsights(term);

  return (
    <Container className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ "}
          <Link href="/glossary" className="hover:text-emerald-700">
            用語集
          </Link>
          {" ／ "}
          {term.name}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{term.name}</h1>
        <p className="mt-2 text-[12px] text-faint">
          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-subink">
            {GLOSSARY_CATEGORIES[term.category]}
          </span>
          <span className="ml-2 tabular-nums">{term.slug}</span>
        </p>
      </header>

      <article className="bg-white border border-slate-200 rounded-md p-5 text-[13px] text-ink leading-relaxed">
        <h2 className="sr-only">定義</h2>
        <p>{term.description}</p>
      </article>

      <section className="mt-8">
        <h2 className="mb-3 text-[14px] font-semibold text-ink">
          関連 Insight
          <span className="ml-2 text-[11px] text-faint tabular-nums">
            {related.length} 本
          </span>
        </h2>
        <RelatedInsights insights={related} />
      </section>

      <div className="mt-8 flex gap-3 text-[12px]">
        <Link
          href="/glossary"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          ← 用語集トップに戻る
        </Link>
        <Link
          href="/insight/map"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          インサイトマップ →
        </Link>
      </div>
    </Container>
  );
}

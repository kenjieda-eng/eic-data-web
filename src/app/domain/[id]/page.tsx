import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import {
  enrichIndicators,
  fetchCatalog,
  filterByDomain,
} from "@/lib/catalog";
import DomainHeader from "../components/DomainHeader";
import DomainIndicatorTable from "../components/DomainIndicatorTable";
import DomainInsights from "../components/DomainInsights";
import DomainQualitySummary from "../components/DomainQualitySummary";
import {
  DOMAINS_DAY8,
  findRelatedInsightsForDomain,
  getDomainById,
} from "../data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return DOMAINS_DAY8.map((d) => ({ id: d.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const meta = getDomainById(id);
  if (!meta) {
    return { title: "ドメインが見つかりません — EIC Data" };
  }
  return {
    title: `${meta.name} ドメイン — EIC Data`,
    description: meta.description.slice(0, 120),
  };
}

export default async function DomainPage({ params }: PageProps) {
  const { id } = await params;
  const meta = getDomainById(id);
  if (!meta) notFound();

  const catalog = await fetchCatalog();
  const enriched = enrichIndicators(catalog.indicators);
  const rows = filterByDomain(enriched, meta.id);
  const related = findRelatedInsightsForDomain(meta);

  return (
    <Container className="py-10">
      <DomainHeader meta={meta} indicatorCount={rows.length} />

      {meta.metaPage && (
        <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-900">
          <p className="font-semibold">
            {meta.emoji} {meta.name} ドメインは編集軸のメタページです（β 段階で
            catalog 系列は未掲載）
          </p>
          <p className="mt-1 text-amber-800">
            Phase C 以降で系列を順次追加予定。当面は関連 Insight からの参照軸として機能します。
          </p>
        </section>
      )}

      {!meta.metaPage && <DomainQualitySummary rows={rows} />}

      {!meta.metaPage && (
        <section className="mt-8">
          <h2 className="mb-3 text-[14px] font-semibold text-ink">
            編集指標カタログ
            <span className="ml-2 text-[11px] text-faint tabular-nums">
              {rows.length} 系列
            </span>
          </h2>
          <DomainIndicatorTable meta={meta} rows={rows} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-[14px] font-semibold text-ink">
          関連 Insight
          <span className="ml-2 text-[11px] text-faint tabular-nums">
            {related.length} 本
          </span>
        </h2>
        <DomainInsights insights={related} />
      </section>

      <div className="mt-8 flex flex-wrap gap-3 text-[12px]">
        <Link
          href="/catalog"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          ← カタログ一覧
        </Link>
        <Link
          href="/insight/map"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          インサイトマップ →
        </Link>
        <Link
          href="/data-quality"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          データ品質ダッシュボード →
        </Link>
      </div>
    </Container>
  );
}

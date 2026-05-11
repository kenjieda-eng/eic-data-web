import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import {
  domainOf,
  fetchCatalog,
  getDependentIndicators,
  getDependsOn,
  getIndicatorById,
  slaStatusOf,
} from "@/lib/catalog";
import CitationButton from "@/components/CitationButton";
import IndicatorMetadataPanel from "../components/IndicatorMetadataPanel";
import DependsOnPanel from "../components/DependsOnPanel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const catalog = await fetchCatalog();
  return catalog.indicators.map((i) => ({ id: i.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const catalog = await fetchCatalog();
  const indicator = getIndicatorById(catalog, id);
  if (!indicator) {
    return { title: "系列が見つかりません — EIC Data" };
  }
  return {
    title: `${indicator.name} (${indicator.id}) — EIC Data`,
    description: `D-011 メタデータ: ${indicator.name}。出典 ${indicator.source_name}、頻度 ${indicator.frequency}、ライセンス ${indicator.license}。`,
  };
}

export const dynamicParams = false;

const SITE_URL = "https://data.eic-jp.org";

function buildDatasetJsonLd(indicator: NonNullable<ReturnType<typeof getIndicatorById>>) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${indicator.name} (${indicator.id})`,
    description:
      indicator.notes ||
      `${indicator.name}: ${indicator.frequency} の ${indicator.unit} 系列。出典 ${indicator.source_name}、ライセンス ${indicator.license}。`,
    url: `${SITE_URL}/catalog/${indicator.id}`,
    identifier: indicator.id,
    keywords: [indicator.domain, indicator.frequency, indicator.unit]
      .filter(Boolean)
      .join(", "),
    license: indicator.license_url || indicator.license,
    creator: {
      "@type": "Organization",
      name: indicator.source_name,
      url: indicator.source_url,
    },
    publisher: {
      "@type": "Organization",
      name: "一般社団法人エネルギー情報センター",
      url: "https://eic-jp.org/",
    },
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE_URL}/api/indicator/${indicator.id}`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/zip",
        contentUrl: `${SITE_URL}/download/all`,
      },
    ],
    variableMeasured: {
      "@type": "PropertyValue",
      name: indicator.name,
      unitText: indicator.unit,
    },
    temporalCoverage: indicator.backfill_start
      ? `${indicator.backfill_start}/${indicator.observation_cutoff}`
      : indicator.observation_cutoff,
    spatialCoverage:
      indicator.domain === "macro" || indicator.domain === "fuel"
        ? "国際"
        : "日本",
    isAccessibleForFree: true,
    inLanguage: "ja",
  };
}

export default async function IndicatorPage({ params }: PageProps) {
  const { id } = await params;
  const catalog = await fetchCatalog();
  const indicator = getIndicatorById(catalog, id);
  if (!indicator) notFound();

  const { ageDays, status } = slaStatusOf(indicator);
  const dependsOnIds = getDependsOn(indicator);
  const dependsOn = dependsOnIds
    .map((dep) => getIndicatorById(catalog, dep))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const dependents = getDependentIndicators(catalog, indicator.id);
  const dom = domainOf(indicator.domain);
  const datasetJsonLd = buildDatasetJsonLd(indicator);

  return (
    <Container className="py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ "}
          <Link href="/catalog" className="hover:text-emerald-700">
            編集指標カタログ
          </Link>
          {" ／ "}
          {indicator.id}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          {indicator.name || indicator.id}
        </h1>
        <p className="mt-2 text-sm text-subink leading-relaxed">
          <span aria-hidden>{dom.emoji}</span> {dom.ja} ／{" "}
          <code className="tabular-nums text-faint">{indicator.id}</code>
        </p>
        {indicator.notes && (
          <p className="mt-2 text-[12px] text-subink leading-relaxed bg-slate-50 border border-slate-200 rounded px-3 py-2">
            {indicator.notes}
          </p>
        )}
      </header>

      <div className="space-y-4">
        <IndicatorMetadataPanel
          indicator={indicator}
          ageDays={ageDays}
          status={status}
        />
        <DependsOnPanel
          dependsOn={dependsOn}
          dependsOnIds={dependsOnIds}
          dependents={dependents}
        />
      </div>

      <div className="mt-6">
        <CitationButton
          citation={{
            slug: indicator.id,
            title: indicator.name || indicator.id,
            kind: "indicator",
            sourceName: indicator.source_name,
            sourceUrl: indicator.source_url,
            license: indicator.license,
          }}
        />
      </div>

      <div className="mt-6 flex gap-3 text-[12px]">
        <Link
          href="/catalog"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          ← カタログ一覧に戻る
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

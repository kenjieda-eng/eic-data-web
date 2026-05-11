import type { Metadata } from "next";
import Container from "@/components/Container";
import {
  enrichIndicators,
  fetchCatalog,
  filterByDomain,
  filterByFrequency,
  searchIndicators,
  summarizeByDomain,
  summarizeByFrequency,
} from "@/lib/catalog";
import SearchBox from "./components/SearchBox";
import CatalogFilterChips from "./components/CatalogFilterChips";
import CatalogTable from "./components/CatalogTable";
import { parseFilters } from "./filters";

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await fetchCatalog();
  return {
    title: "編集指標カタログ — EIC Data",
    description: `編集部が一次出典を確認した全 ${catalog.indicator_count} 系列の D-011 メタデータカタログ。ID / 名称で検索、ドメイン × 頻度で絞り込み、各系列の詳細ページに 19 項目フル表示。`,
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [catalog, raw] = await Promise.all([fetchCatalog(), searchParams]);
  const filters = parseFilters(raw);
  const now = new Date();

  const enriched = enrichIndicators(catalog.indicators, now);
  const domainCounts = summarizeByDomain(enriched);
  const frequencyCounts = summarizeByFrequency(enriched);

  const filtered = searchIndicators(
    filterByFrequency(filterByDomain(enriched, filters.domain), filters.frequency),
    filters.query,
  );

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          ホーム ／ 編集指標カタログ
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          編集指標カタログ ／ {catalog.indicator_count} 系列
        </h1>
        <p className="mt-2 text-sm text-subink leading-relaxed">
          編集部が一次出典を確認した全{" "}
          <strong className="text-ink tabular-nums">
            {catalog.indicator_count}
          </strong>{" "}
          系列。検索 + ドメイン × 頻度で絞り込み、各 ID をクリックすると D-011 19 項目フル表示の個別ページに遷移。
        </p>
        <p className="mt-2 text-[11px] text-faint tabular-nums">
          schema {catalog.schema} ／ generated {catalog.generated_at}
        </p>
      </header>

      <SearchBox filters={filters} />

      <CatalogFilterChips
        filters={filters}
        domainCounts={domainCounts}
        frequencyCounts={frequencyCounts}
        total={catalog.indicator_count}
        shown={filtered.length}
      />

      <CatalogTable rows={filtered} />

      <p className="mt-6 text-[11px] text-faint">
        各系列の詳細は <code>/catalog/[id]</code> で個別ページとして SSG 生成。
        depends_on の派生系列も逆引きでリンク表示。
      </p>
    </Container>
  );
}

import type { Metadata } from "next";
import Container from "@/components/Container";
import {
  crossDomainLicense,
  domainOf,
  enrichIndicators,
  fetchCatalog,
  filterByDomain,
  filterByStatus,
  recentlyUpdated,
  summarizeByDomain,
  summarizeByLicense,
  summarizeStatus,
} from "@/lib/catalog";
import SummaryCards from "./components/SummaryCards";
import PieChart from "./components/PieChart";
import SlaInterpretation from "./components/SlaInterpretation";
import FilterChips from "./components/FilterChips";
import IndicatorTable from "./components/IndicatorTable";
import RecentlyUpdated from "./components/RecentlyUpdated";
import DomainLicenseMatrix from "./components/DomainLicenseMatrix";
import LicenseLegend from "./components/LicenseLegend";
import { parseFilters } from "./filters";

export const metadata: Metadata = {
  title: "データ品質ダッシュボード — EIC Data",
  description:
    "D-011 メタデータ・スキーマで集めた全系列の鮮度・出典・ライセンスを 1 ページで一覧。FRED 風の研究者向け機能で、引用インフラの根拠を可視化する。",
};

const RECENT_DAYS = 7;

export default async function DataQualityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [catalog, raw] = await Promise.all([fetchCatalog(), searchParams]);
  const filters = parseFilters(raw);
  const now = new Date();

  const enriched = enrichIndicators(catalog.indicators, now);
  const counts = summarizeStatus(enriched);
  const domainCounts = summarizeByDomain(enriched);
  const licenseCounts = summarizeByLicense(enriched);
  const cross = crossDomainLicense(enriched);

  const filtered = filterByStatus(
    filterByDomain(enriched, filters.domain),
    filters.status,
  );

  const recent = recentlyUpdated(catalog.indicators, RECENT_DAYS, now);

  const domainPieData = domainCounts.map(({ domain, count }) => {
    const info = domainOf(domain);
    return { label: info.ja, emoji: info.emoji, count };
  });

  const licensePieData = licenseCounts.map(({ license, count, isSpdx }) => ({
    label: license,
    emoji: isSpdx ? "🟢" : "🟡",
    count,
    isSpdx,
  }));

  return (
    <Container className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          ホーム ／ データ品質
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          データ品質ダッシュボード
        </h1>
        <p className="mt-2 text-sm text-subink leading-relaxed">
          D-011 メタデータ・スキーマで集めた{" "}
          <strong className="text-ink tabular-nums">
            {catalog.indicator_count}
          </strong>{" "}
          系列の鮮度・出典・ライセンスを 1 ページで一覧。
          FRED 風の研究者向け機能で、引用インフラの根拠を可視化する。
        </p>
        <p className="mt-2 text-[11px] text-faint tabular-nums">
          schema {catalog.schema} ／ generated {catalog.generated_at}
        </p>
      </header>

      <SummaryCards total={catalog.indicator_count} counts={counts} />

      <SlaInterpretation
        total={catalog.indicator_count}
        warningCount={counts.warning}
        breachCount={counts.breach}
      />

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <PieChart
          title={`ドメイン分布（${catalog.indicator_count} 系列）`}
          description="現在パイプラインに乗っている系列のドメイン内訳。"
          data={domainPieData}
        />
        <PieChart
          title={`ライセンス分布（${catalog.indicator_count} 系列）`}
          description="SPDX 識別子（緑）と公的機関の独自規約（黄）の比率。研究者・ジャーナリスト向けの引用可否がここで一目でわかる。"
          data={licensePieData}
        />
      </div>

      <FilterChips
        filters={filters}
        domainCounts={domainCounts}
        statusCounts={counts}
        total={catalog.indicator_count}
        shown={filtered.length}
      />

      <IndicatorTable rows={filtered} />

      <RecentlyUpdated rows={recent} days={RECENT_DAYS} />

      <DomainLicenseMatrix
        domains={cross.domains}
        licenses={cross.licenses}
        matrix={cross.matrix}
      />

      <LicenseLegend />

      <p className="mt-6 text-[11px] text-faint">
        * SPDX = Software Package Data Exchange。{" "}
        {licensePieData.filter((l) => l.isSpdx).length} 種類が SPDX、
        {licensePieData.filter((l) => !l.isSpdx).length} 種類が独自規約。
        いずれもライセンス確認済 (D-002 / D-005 準拠)。
      </p>
    </Container>
  );
}

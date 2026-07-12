import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "EIC Data — Japan's Energy & Finance Data, Citable",
  description:
    "Free, citable data on Japan's energy and finance: JEPX spot prices (all 9 areas), capacity & balancing markets, generation mix, fuel import prices, FX and JGB yields — 557 series with primary sources, full-history charts, CSV, and citation formats (BibTeX/Chicago/APA). CC BY 4.0.",
  alternates: {
    canonical: "/en",
    languages: { ja: "/" },
  },
};

// 内部リンク（/catalog /insight /today /compare）は Link、外部 URL は a タグ。
// 本文の英文は docs/en-landing-copy-2026-07-12.md の確定版を一字一句そのまま使用。
const LINK_CLASS = "text-sky-700 underline hover:text-sky-800";

export default function EnLandingPage() {
  return (
    <Container size="wide" className="py-10">
      <article
        lang="en"
        className="max-w-3xl mx-auto text-[15px] leading-7 text-slate-800"
      >
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight">
          EIC Data — Japan&apos;s Energy &amp; Finance Data, Citable
        </h1>

        <p className="mt-5">
          EIC Data is a free public-information site operated by the Energy
          Information Center (一般社団法人エネルギー情報センター), a Japanese
          non-profit organization. We compile Japan&apos;s energy and financial
          indicators in one place, in one format, with primary sources attached
          — so that researchers, journalists, and practitioners can cite them
          with confidence.
        </p>
        <p className="mt-4">
          The site&apos;s content is written in Japanese. This page summarizes in
          English what is available and how to use it. Series IDs, units, and CSV
          headers are in English, so the data itself is usable without reading
          Japanese.
        </p>

        <h2 className="mt-8 mb-3 text-lg md:text-xl font-semibold text-ink">
          What&apos;s inside
        </h2>
        <ul className="list-disc list-outside pl-5 space-y-2">
          <li>
            <strong>557 data series across 12 domains</strong>, updated daily
            from primary sources: JEPX day-ahead spot prices (all nine areas),
            capacity market and balancing market results, generation mix by
            source (METI), fuel import prices (LNG, crude oil, coal), foreign
            exchange and JGB yields, weather, feed-in tariff (FIT) prices, EU
            ETS, and international comparisons (Ember).
          </li>
          <li>
            <strong>Every series page</strong> ({" "}
            <Link href="/catalog" className={LINK_CLASS}>
              /catalog
            </Link>{" "}
            ) provides a full-history interactive chart, summary statistics,
            19-field metadata (source, license, update frequency, and more), and
            CSV download.
          </li>
          <li>
            <strong>
              101 data-driven analyses (&quot;Insights&quot;, in Japanese)
            </strong>{" "}
            ({" "}
            <Link href="/insight" className={LINK_CLASS}>
              /insight
            </Link>{" "}
            ), including an educational series on how Japan&apos;s power markets
            work — wholesale (JEPX), capacity, balancing, fuel-cost adjustment,
            FIT/FIP surcharge, and wheeling charges.
          </li>
          <li>
            <strong>A daily morning summary</strong> ({" "}
            <Link href="/today" className={LINK_CLASS}>
              /today
            </Link>{" "}
            ) auto-generated from the latest data.
          </li>
        </ul>

        <h2 className="mt-8 mb-3 text-lg md:text-xl font-semibold text-ink">
          How to cite
        </h2>
        <p>
          Every series and article page provides one-click citation formats
          (BibTeX / Chicago / APA). Editorial content is licensed under{" "}
          <strong>CC BY 4.0</strong>; each data series follows its original
          source&apos;s license, shown in the series metadata. A general form:
        </p>
        <blockquote className="mt-3 border-l-4 border-slate-300 pl-4 text-subink italic">
          EIC Data (Energy Information Center). &quot;&lt;page title&gt;.&quot;
          https://data.eic-jp.org/&lt;path&gt; (accessed YYYY-MM-DD). License: CC
          BY 4.0.
        </blockquote>

        <h2 className="mt-8 mb-3 text-lg md:text-xl font-semibold text-ink">
          Data access
        </h2>
        <ul className="list-disc list-outside pl-5 space-y-2">
          <li>
            Series catalog with charts and CSV:{" "}
            <Link href="/catalog" className={LINK_CLASS}>
              https://data.eic-jp.org/catalog
            </Link>
          </li>
          <li>
            JSON API per series: https://data.eic-jp.org/api/indicator/&lt;series-id&gt;
          </li>
          <li>
            Bulk download (all series, ZIP):{" "}
            <a
              href="https://data.eic-jp.org/download/all"
              className={LINK_CLASS}
            >
              https://data.eic-jp.org/download/all
            </a>
          </li>
          <li>
            Comparison tool (overlay up to 5 series):{" "}
            <Link href="/compare" className={LINK_CLASS}>
              https://data.eic-jp.org/compare
            </Link>
          </li>
        </ul>

        <h2 className="mt-8 mb-3 text-lg md:text-xl font-semibold text-ink">
          Notes
        </h2>
        <ul className="list-disc list-outside pl-5 space-y-2">
          <li>
            All content on this site describes <strong>historical data only</strong>.
            Nothing here constitutes investment, trading, or business advice.
          </li>
          <li>
            Operated by the Energy Information Center (Tokyo, Japan) —{" "}
            <a href="https://eic-jp.org/" className={LINK_CLASS}>
              https://eic-jp.org/
            </a>{" "}
            (Japanese).
          </li>
        </ul>
      </article>
    </Container>
  );
}

import type { MDXComponents } from "mdx/types";
import ChartLine from "@/components/ChartLine";
import ChartDual from "@/components/ChartDual";
import ChartLagBars from "@/components/ChartLagBars";
import ChartDecomp from "@/components/ChartDecomp";
import ChartHeatmap from "@/components/ChartHeatmap";
import ChartSpread from "@/components/ChartSpread";
import BalancingProductsCompareChart from "@/components/BalancingProductsCompareChart";
import InsightCitation from "@/components/InsightCitation";
import InsightDataUsed from "@/components/InsightDataUsed";
import InsightNav from "@/components/InsightNav";
import InsightStructuredData from "@/components/InsightStructuredData";
import UtterancesComments from "@/components/UtterancesComments";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ChartLine,
    ChartDual,
    ChartLagBars,
    ChartDecomp,
    ChartHeatmap,
    ChartSpread,
    BalancingProductsCompareChart,
    InsightNav,
    InsightCitation,
    InsightDataUsed,
    InsightStructuredData,
    UtterancesComments,

    // Phase B-C P 案: 見出し階層強化 + 本文 18px (議事録 v2 観点 3 + 8)
    h1: ({ children }) => (
      <h1 className="mt-8 text-3xl md:text-4xl font-bold text-ink leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink leading-snug">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 text-xl md:text-2xl font-semibold text-ink">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mt-4 text-base md:text-lg text-subink leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mt-4 ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
        {children}
      </ul>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-4 border-emerald-200 bg-emerald-50/50 px-4 py-2 text-subink">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-emerald-700 underline hover:text-emerald-900"
      >
        {children}
      </a>
    ),
    pre: ({ children }) => (
      <pre className="mt-4 overflow-x-auto rounded bg-slate-100 p-3 text-xs text-ink">
        {children}
      </pre>
    ),
    // 2026-11-16: 本文中の `code`（記事末の構成系列など）。長い系列 ID が切れずに狭い画面で横にはみ出すので、どこでも折り返せるようにする。
    // pre の中は white-space: pre なので折り返さない（見た目は変わらない）。
    code: ({ children, ...props }) => (
      <code {...props} className={`wrap-anywhere ${props.className ?? ""}`.trim()}>
        {children}
      </code>
    ),
    // 2026-11-15: GFM の表（next.config.ts の remark-gfm）。狭い画面では表だけ横に動かす。
    // 列の寄せ（|---:| など）は th / td の style で来るので props をそのまま渡す。
    table: ({ children }) => (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm md:text-base text-subink">
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th
        {...props}
        className="border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-semibold text-ink whitespace-nowrap"
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td {...props} className="border-b border-slate-200 px-3 py-2 align-top">
        {children}
      </td>
    ),
    ...components,
  };
}

import type { MDXComponents } from "mdx/types";
import ChartLine from "@/components/ChartLine";
import ChartDual from "@/components/ChartDual";
import ChartLagBars from "@/components/ChartLagBars";
import ChartDecomp from "@/components/ChartDecomp";
import ChartHeatmap from "@/components/ChartHeatmap";
import ChartSpread from "@/components/ChartSpread";
import BalancingProductsCompareChart from "@/components/BalancingProductsCompareChart";
import InsightCitation from "@/components/InsightCitation";
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
    ...components,
  };
}

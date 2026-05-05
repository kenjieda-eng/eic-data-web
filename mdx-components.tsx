import type { MDXComponents } from "mdx/types";
import ChartLine from "@/components/ChartLine";
import ChartDual from "@/components/ChartDual";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ChartLine,
    ChartDual,

    h1: ({ children }) => (
      <h1 className="mt-8 text-3xl font-bold text-ink">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-8 text-xl font-semibold text-ink">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 text-base font-semibold text-ink">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mt-4 text-base text-subink leading-relaxed">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mt-4 ml-6 list-disc space-y-1 text-subink">{children}</ul>
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

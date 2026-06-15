"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  InsightDomain,
  InsightRenderer,
} from "@/lib/insight-validator";

interface FacetItem<T extends string> {
  value: T | "all";
  count: number;
}

interface Props {
  domains: FacetItem<InsightDomain>[];
  renderers: FacetItem<InsightRenderer>[];
  tags: { value: string; count: number }[];
  currentTag: string | null;
  currentDomain: InsightDomain | null;
  currentRenderer: InsightRenderer | null;
}

const DOMAIN_LABELS: Record<InsightDomain, string> = {
  power: "電力",
  weather: "気象",
  fuel: "燃料",
  finance: "金融",
  esg: "ESG",
  tech: "技術",
  geopolitics: "地政",
  regulation: "制度",
  population: "人口",
  corp_ir: "企業IR",
  international: "国際",
  economy: "経済",
};

export default function InsightFilterChips({
  domains,
  renderers,
  tags,
  currentTag,
  currentDomain,
  currentRenderer,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function buildHref(
    facet: "tag" | "domain" | "renderer",
    value: string | null,
  ): string {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (value) {
      next.set(facet, value);
    } else {
      next.delete(facet);
    }
    const qs = next.toString();
    return `/insight${qs ? `?${qs}` : ""}`;
  }

  function chip(
    facet: "tag" | "domain" | "renderer",
    value: string | null,
    label: string,
    count: number | null,
    selected: boolean,
  ) {
    const href = buildHref(facet, value);
    return (
      <Link
        key={`${facet}-${value ?? "all"}`}
        href={href}
        prefetch={false}
        onClick={(e) => {
          e.preventDefault();
          router.replace(href, { scroll: false });
        }}
        className={`rounded-full border px-3 py-1 text-sm transition tabular-nums ${
          selected
            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
            : "border-slate-300 bg-white text-subink hover:border-emerald-300 hover:text-emerald-700"
        }`}
      >
        {label}
        {count !== null && (
          <span className="ml-1 text-xs text-faint">{count}</span>
        )}
      </Link>
    );
  }

  const hasAny = currentTag || currentDomain || currentRenderer;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-faint">
          domain
        </span>
        {domains.map((d) =>
          chip(
            "domain",
            d.value === "all" ? null : d.value,
            d.value === "all" ? "全体" : DOMAIN_LABELS[d.value],
            d.count,
            d.value === "all" ? !currentDomain : currentDomain === d.value,
          ),
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-faint">
          renderer
        </span>
        {renderers.map((r) =>
          chip(
            "renderer",
            r.value === "all" ? null : r.value,
            r.value === "all" ? "全体" : r.value,
            r.count,
            r.value === "all"
              ? !currentRenderer
              : currentRenderer === r.value,
          ),
        )}
      </div>

      <details className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
        <summary className="cursor-pointer text-subink">
          tag 絞り込み (
          {currentTag ? (
            <span className="font-semibold text-emerald-700">
              現在: {currentTag}
            </span>
          ) : (
            <span className="text-faint">全 {tags.length} タグ</span>
          )}
          )
        </summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {chip("tag", null, "全体", null, !currentTag)}
          {tags.slice(0, 24).map((t) =>
            chip("tag", t.value, t.value, t.count, currentTag === t.value),
          )}
        </div>
      </details>

      {hasAny && (
        <div>
          <Link
            href="/insight"
            onClick={(e) => {
              e.preventDefault();
              router.replace("/insight", { scroll: false });
            }}
            className="inline-flex items-center text-xs text-emerald-700 underline hover:text-emerald-900"
          >
            すべてのフィルタをクリア
          </Link>
        </div>
      )}
    </div>
  );
}

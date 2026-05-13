import Link from "next/link";
import { Suspense } from "react";
import Container from "@/components/Container";
import {
  filterInsights,
  getInsightDomain,
  getInsightRenderer,
  summarizeInsightFacets,
} from "@/lib/insight-facets";
import {
  INSIGHT_DOMAINS,
  INSIGHT_RENDERERS,
  type InsightDomain,
  type InsightRenderer,
} from "@/lib/insight-validator";
import { INSIGHTS } from "@/lib/insights";
import InsightFilterChips from "./InsightFilterChips";

export const metadata = {
  title: "インサイト | EIC Data",
  description:
    "EIC Data 編集部による、複数指標を組み合わせて意味を引き出す独自ページ。タグ・ドメイン・チャート種別で絞り込み可能。",
};

const DOMAIN_LABELS: Record<InsightDomain, string> = {
  power: "電力",
  weather: "気象",
  fuel: "燃料",
  finance: "金融",
  esg: "ESG",
  technology: "技術",
  international: "国際",
  economy: "経済",
  policy: "制度",
};

function pickString(
  raw: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const v = raw[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function pickDomain(value: string | null): InsightDomain | null {
  if (!value) return null;
  return (INSIGHT_DOMAINS as readonly string[]).includes(value)
    ? (value as InsightDomain)
    : null;
}

function pickRenderer(value: string | null): InsightRenderer | null {
  if (!value) return null;
  return (INSIGHT_RENDERERS as readonly string[]).includes(value)
    ? (value as InsightRenderer)
    : null;
}

export default async function InsightIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const tag = pickString(raw, "tag");
  const domain = pickDomain(pickString(raw, "domain"));
  const renderer = pickRenderer(pickString(raw, "renderer"));

  const facets = summarizeInsightFacets(INSIGHTS);
  const filtered = filterInsights(INSIGHTS, { tag, domain, renderer });

  return (
    <Container size="wide" className="py-10">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight">
          インサイト
        </h1>
        <div className="flex items-center gap-4 text-[13px]">
          <Link
            href="/insight/map"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            6 軸マップで俯瞰 →
          </Link>
          <Link
            href="/insight/network"
            className="text-emerald-700 underline hover:text-emerald-800"
          >
            ネットワークで俯瞰 →
          </Link>
        </div>
      </div>
      <p className="mt-2 text-base md:text-lg text-subink leading-relaxed">
        データが語るストーリー。EIC Data
        編集部が複数指標を組み合わせて意味を引き出す独自ページ。
        <strong className="text-ink tabular-nums">{INSIGHTS.length}</strong>{" "}
        本のうち <strong className="text-ink tabular-nums">{filtered.length}</strong>{" "}
        本を表示中。
      </p>

      <Suspense
        fallback={<div className="mt-4 text-sm text-subink">フィルタ準備中...</div>}
      >
        <InsightFilterChips
          domains={facets.domains}
          renderers={facets.renderers}
          tags={facets.tags}
          currentTag={tag}
          currentDomain={domain}
          currentRenderer={renderer}
        />
      </Suspense>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-base text-subink">
          条件に一致する Insight はありませんでした。
          <Link
            href="/insight"
            className="ml-2 text-emerald-700 underline hover:text-emerald-900"
          >
            フィルタをクリア
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => {
            const d = getInsightDomain(it);
            const r = getInsightRenderer(it.slug);
            return (
              <Link
                key={it.slug}
                href={`/insight/${it.slug}`}
                className="block rounded-md border border-slate-200 bg-white p-5 transition hover:border-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-faint">
                  <span>インサイト</span>
                  <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] tabular-nums normal-case">
                    {r}
                  </span>
                </div>
                <div className="mt-1 text-lg font-semibold text-ink">
                  {it.title}
                </div>
                <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
                  {it.lede}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  {d && (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      {DOMAIN_LABELS[d]}
                    </span>
                  )}
                  {it.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-slate-100 px-2 py-0.5 text-subink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-xs text-faint">
                  出典: {it.sources.join(" + ")} ／ 更新 {it.updated}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}

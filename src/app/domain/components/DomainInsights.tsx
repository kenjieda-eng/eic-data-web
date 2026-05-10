import Link from "next/link";
import type { Insight } from "@/lib/insights";

interface DomainInsightsProps {
  insights: Insight[];
}

export default function DomainInsights({ insights }: DomainInsightsProps) {
  if (insights.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-[12px] text-subink">
        このドメインに直接関連する Insight はまだありません。
        <Link
          href="/insight/map"
          className="ml-1 text-emerald-700 underline hover:text-emerald-800"
        >
          インサイトマップで全体を見る →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {insights.map((i) => (
        <Link
          key={i.slug}
          href={`/insight/${i.slug}`}
          className="block bg-white border border-slate-200 rounded-md p-4 hover:border-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <div className="text-[10px] uppercase tracking-wider text-faint">
            インサイト
          </div>
          <div className="mt-1 text-[13px] font-semibold text-emerald-700">
            {i.title}
          </div>
          <p className="mt-1 text-[12px] text-subink leading-relaxed">{i.lede}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {i.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-subink"
              >
                {tag}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}

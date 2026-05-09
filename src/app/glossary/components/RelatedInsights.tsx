import Link from "next/link";
import type { Insight } from "@/lib/insights";

interface RelatedInsightsProps {
  insights: Insight[];
}

export default function RelatedInsights({ insights }: RelatedInsightsProps) {
  if (insights.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-[12px] text-subink">
        この用語に直接関連する Insight はまだありません。
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
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {insights.map((i) => (
          <li key={i.slug} className="p-4 hover:bg-slate-50 transition-colors">
            <Link
              href={`/insight/${i.slug}`}
              className="text-[13px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
            >
              {i.title}
            </Link>
            <p className="mt-1 text-[12px] text-subink leading-relaxed">
              {i.lede}
            </p>
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
          </li>
        ))}
      </ul>
    </div>
  );
}

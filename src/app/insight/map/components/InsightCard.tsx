import Link from "next/link";
import type { Insight } from "@/lib/insights";

const LEDE_LIMIT = 80;

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + "…";
}

export default function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Link
      href={`/insight/${insight.slug}`}
      className="block rounded-md border border-slate-200 bg-white p-4 transition hover:border-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
    >
      <div className="text-[12px] font-semibold text-ink leading-tight">
        {insight.title}
      </div>
      <p className="mt-1.5 text-[11px] text-subink leading-relaxed">
        {truncate(insight.lede, LEDE_LIMIT)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
        {insight.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded bg-slate-100 px-1.5 py-0.5 text-subink"
          >
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}

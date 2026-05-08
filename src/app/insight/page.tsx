import Link from "next/link";
import Container from "@/components/Container";
import { INSIGHTS } from "@/lib/insights";

export const metadata = {
  title: "インサイト | EIC Data",
  description:
    "EIC Data 編集部による、複数指標を組み合わせて意味を引き出す独自ページ。",
};

export default function InsightIndexPage() {
  return (
    <Container className="py-10">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-ink">インサイト</h1>
        <Link
          href="/insight/map"
          className="text-[12px] text-emerald-700 underline hover:text-emerald-800"
        >
          6 軸マップで俯瞰 →
        </Link>
      </div>
      <p className="mt-2 text-subink">
        データが語るストーリー。EIC Data
        編集部が複数指標を組み合わせて意味を引き出す独自ページ。
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {INSIGHTS.map((it) => (
          <Link
            key={it.slug}
            href={`/insight/${it.slug}`}
            className="block rounded-md border border-slate-200 bg-white p-5 transition hover:border-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <div className="text-xs uppercase tracking-wider text-faint">
              インサイト
            </div>
            <div className="mt-1 text-lg font-semibold text-ink">
              {it.title}
            </div>
            <p className="mt-2 text-sm text-subink">{it.lede}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
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
        ))}
      </div>
    </Container>
  );
}

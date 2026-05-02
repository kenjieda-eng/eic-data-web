import Link from "next/link";
import Container from "@/components/Container";

export const metadata = {
  title: "インサイト | EIC Data",
  description:
    "EIC Data 編集部による、複数指標を組み合わせて意味を引き出す独自ページ。",
};

const INSIGHTS: {
  slug: string;
  title: string;
  lede: string;
  tags: string[];
  sources: string[];
  updated: string;
}[] = [
  {
    slug: "temp-vs-price",
    title: "気温 × 電力価格：東京 15 年史",
    lede: "JMA 日平均気温と JEPX 東京エリア卸電力価格の 15 年相関",
    tags: ["電力", "気象", "東京"],
    sources: ["JEPX スポット市場", "気象庁 日次気温"],
    updated: "2026-05-02",
  },
];

export default function InsightIndexPage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-ink">インサイト</h1>
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

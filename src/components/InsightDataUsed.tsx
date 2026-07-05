import Link from "next/link";
import { fetchCatalog } from "@/lib/catalog";
import { getSeriesForInsight } from "@/lib/insight-series-map";

/**
 * 内部リンク L1: Insight 記事末尾の「この記事で使ったデータ」枠。
 *
 * async サーバーコンポーネント。slug から本文チャートの元系列 id を逆引きし、
 * catalog で名称・単位を解決して各系列ページ (全期間チャート・出典・CSV) へ
 * 内部リンクを張る。行き止まりの記事から系列カタログへ導線を通すのが目的。
 *
 * graceful: 参照系列が無い / catalog に載っていない場合は何も描画しない (null)。
 */
export default async function InsightDataUsed({ slug }: { slug: string }) {
  const ids = getSeriesForInsight(slug);
  if (ids.length === 0) return null;

  const catalog = await fetchCatalog();
  const byId = new Map(catalog.indicators.map((i) => [i.id, i] as const));
  const series = ids
    .map((id) => byId.get(id))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));
  if (series.length === 0) return null;

  return (
    <section className="mt-8 rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">
        <span aria-hidden>📊</span> この記事で使ったデータ
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-subink">
        チャートの元系列。全期間チャート・出典・CSV は各系列ページへ。
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {series.map((ind) => (
          <Link
            key={ind.id}
            href={`/catalog/${ind.id}`}
            className="text-[13px] text-emerald-700 underline hover:text-emerald-800"
          >
            {ind.name || ind.id}
            {ind.unit ? `（${ind.unit}）` : ""}
          </Link>
        ))}
      </div>
      <div className="mt-3 text-[13px]">
        <Link
          href="/catalog"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          指標カタログで探す →
        </Link>
      </div>
    </section>
  );
}

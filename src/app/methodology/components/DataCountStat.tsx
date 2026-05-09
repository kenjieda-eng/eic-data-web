import Link from "next/link";

interface DataCountStatProps {
  totalCount: number;
  realCount: number;
  refCount: number;
}

export default function DataCountStat({
  totalCount,
  realCount,
  refCount,
}: DataCountStatProps) {
  return (
    <>
      <p>
        現在、編集層{" "}
        <strong className="tabular-nums">{totalCount}</strong> 指標のうち{" "}
        <strong className="text-emerald-700 tabular-nums">
          {realCount} 指標
        </strong>
        は一次出典から取得した実データ
        （
        <span className="inline-block rounded bg-emerald-100 px-1.5 text-[11px] font-semibold text-emerald-800 align-middle">
          実データ
        </span>
        ）を掲載している。残り{" "}
        <strong className="tabular-nums">{refCount} 指標</strong>
        は UI 検証用の参考値
        （
        <span className="inline-block rounded bg-slate-200 px-1.5 text-[11px] font-semibold text-slate-700 align-middle">
          参考値
        </span>
        ）で、β 公開までに順次差し替える。
      </p>
      <p className="mt-3 text-sm text-slate-700">
        最新の実データ一覧は{" "}
        <Link
          href="/catalog"
          className="text-sky-700 underline hover:text-sky-800"
        >
          編集指標カタログ
        </Link>
        {" "}を参照。系列ごとの鮮度は{" "}
        <Link
          href="/data-quality"
          className="text-sky-700 underline hover:text-sky-800"
        >
          データ品質ダッシュボード
        </Link>
        {" "}から確認可能。
      </p>
    </>
  );
}

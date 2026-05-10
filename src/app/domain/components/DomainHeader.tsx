import Link from "next/link";
import type { DomainPageMeta } from "../data";

interface DomainHeaderProps {
  meta: DomainPageMeta;
  indicatorCount: number;
}

export default function DomainHeader({ meta, indicatorCount }: DomainHeaderProps) {
  return (
    <header className="mb-6">
      <p className="text-xs text-faint uppercase tracking-wider">
        <Link href="/" className="hover:text-emerald-700">
          ホーム
        </Link>
        {" ／ "}
        <Link href="/catalog" className="hover:text-emerald-700">
          編集指標カタログ
        </Link>
        {" ／ "}
        <span aria-hidden>{meta.emoji}</span> {meta.name}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">
        <span aria-hidden className="mr-2">
          {meta.emoji}
        </span>
        {meta.name}
        {meta.metaPage ? (
          <span className="ml-2 text-[13px] font-normal text-faint">
            ／ 編集軸メタページ
          </span>
        ) : (
          <span> ／ {indicatorCount} 系列</span>
        )}
      </h1>
      <p className="mt-3 text-[13px] text-subink leading-relaxed max-w-3xl">
        {meta.description}
      </p>
      <div className="mt-3 flex items-center gap-2 text-[12px]">
        {!meta.metaPage && (
          <Link
            href={`/catalog?domain=${meta.id}`}
            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100"
          >
            カタログで絞り込む →
          </Link>
        )}
        <Link
          href="/insight/map"
          className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-subink hover:bg-slate-200"
        >
          インサイトマップ
        </Link>
      </div>
    </header>
  );
}

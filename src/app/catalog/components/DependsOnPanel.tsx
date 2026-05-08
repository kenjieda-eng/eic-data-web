import Link from "next/link";
import type { Indicator } from "@/lib/catalog";

interface DependsOnPanelProps {
  dependsOn: Indicator[];
  dependsOnIds: string[];
  dependents: Indicator[];
}

function IndicatorChip({ id, name }: { id: string; name?: string }) {
  return (
    <Link
      href={`/catalog/${id}`}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] border border-slate-200 rounded-md bg-white hover:border-emerald-500 hover:text-emerald-700 transition-colors"
    >
      <code className="tabular-nums text-faint">{id}</code>
      {name && <span className="text-subink truncate max-w-[200px]">{name}</span>}
    </Link>
  );
}

export default function DependsOnPanel({
  dependsOn,
  dependsOnIds,
  dependents,
}: DependsOnPanelProps) {
  if (dependsOn.length === 0 && dependents.length === 0 && dependsOnIds.length === 0) {
    return null;
  }

  const missingIds = dependsOnIds.filter(
    (id) => !dependsOn.some((d) => d.id === id),
  );

  return (
    <section className="bg-white border border-slate-200 rounded-md p-5">
      <h2 className="text-[14px] font-semibold text-ink mb-4">系列の依存関係</h2>
      {dependsOnIds.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            依存先 (depends_on)
          </div>
          <div className="flex flex-wrap gap-2">
            {dependsOn.map((d) => (
              <IndicatorChip key={d.id} id={d.id} name={d.name} />
            ))}
            {missingIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center px-3 py-1.5 text-[12px] border border-slate-200 rounded-md bg-slate-50 text-faint"
                title="catalog に未登録"
              >
                <code className="tabular-nums">{id}</code>
                <span className="ml-2 text-[10px]">未登録</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {dependents.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            この系列を参照している派生系列 ({dependents.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {dependents.map((d) => (
              <IndicatorChip key={d.id} id={d.id} name={d.name} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

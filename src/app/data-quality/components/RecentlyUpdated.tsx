import { domainOf, type Indicator } from "@/lib/catalog";

interface RecentlyUpdatedProps {
  rows: Indicator[];
  days: number;
}

export default function RecentlyUpdated({ rows, days }: RecentlyUpdatedProps) {
  if (rows.length === 0) {
    return (
      <section className="mt-6 bg-white border border-slate-200 rounded-md p-5">
        <h3 className="text-[14px] font-semibold text-ink mb-3">
          📡 最近 {days} 日に更新された系列
        </h3>
        <p className="text-[12px] text-faint">
          過去 {days} 日以内に更新された系列はありません。
        </p>
      </section>
    );
  }

  const byDomain = new Map<string, Indicator[]>();
  for (const r of rows) {
    const arr = byDomain.get(r.domain) ?? [];
    arr.push(r);
    byDomain.set(r.domain, arr);
  }
  const groups = [...byDomain.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );

  return (
    <section className="mt-6 bg-white border border-slate-200 rounded-md p-5">
      <h2 className="text-[14px] font-semibold text-ink mb-3">
        📡 最近 {days} 日に更新された系列
      </h2>
      <p className="text-[12px] text-subink mb-3">
        過去 {days} 日以内に <strong>{rows.length} 系列</strong>{" "}
        が更新されています（メタデータ <code>updated_at</code> ベース）。
        日次パイプライン（JEPX / JMA / JGB）の継続稼働を示す指標。
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
        {groups.map(([dom, items]) => {
          const info = domainOf(dom);
          const latest = items[0]?.updated_at?.slice(0, 19).replace("T", " ");
          return (
            <div
              key={dom}
              className="border border-slate-200 rounded p-2.5 bg-slate-50"
            >
              <div className="text-[11px] text-subink font-semibold mb-1">
                <span aria-hidden>{info.emoji}</span> {info.ja} ({items.length}{" "}
                系列)
              </div>
              <div className="text-[10px] text-faint tabular-nums">
                最新更新: {latest || "—"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

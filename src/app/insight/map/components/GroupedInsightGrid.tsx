import type { GroupedInsight } from "@/lib/grouping";
import type { Insight } from "@/lib/insights";
import InsightCard from "./InsightCard";

interface GroupedInsightGridProps {
  groups: GroupedInsight[];
  unclassified: Insight[];
  searchQuery?: string;
}

function highlightTotal(groups: GroupedInsight[]): number {
  return groups.reduce((s, g) => s + g.insights.length, 0);
}

export default function GroupedInsightGrid({
  groups,
  unclassified,
  searchQuery,
}: GroupedInsightGridProps) {
  const isFiltered = Boolean(searchQuery);
  const totalShown = highlightTotal(groups) + unclassified.length;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {groups.map(({ group, insights }) => (
          <div
            key={group.id}
            className="bg-slate-50 border border-slate-200 rounded-md p-3 text-center"
          >
            <div className="text-[24px]">{group.icon}</div>
            <div className="mt-1 text-[11px] text-subink leading-tight">
              {group.title}
            </div>
            <div className="mt-1 text-[16px] font-semibold tabular-nums text-ink">
              {insights.length}
            </div>
          </div>
        ))}
      </div>

      {isFiltered && (
        <p className="mb-4 text-[12px] text-faint">
          検索 <code className="px-1 bg-slate-100 rounded">{searchQuery}</code>{" "}
          に該当: <strong className="text-ink tabular-nums">{totalShown}</strong>{" "}
          本
        </p>
      )}

      {groups.map(({ group, insights }) => {
        if (insights.length === 0 && isFiltered) return null;
        return (
          <section key={group.id} className="mb-8" id={group.id}>
            <div className="flex items-baseline gap-3 mb-2 border-b border-slate-200 pb-2">
              <span className="text-[20px]" aria-hidden>
                {group.icon}
              </span>
              <h2 className="text-[18px] font-semibold text-ink">
                {group.title}
                <span className="ml-2 text-[12px] text-faint tabular-nums font-normal">
                  ({insights.length} 本)
                </span>
              </h2>
            </div>
            <p className="text-[13px] text-subink leading-relaxed mb-4">
              {group.lede}
            </p>
            {insights.length === 0 ? (
              <p className="text-[12px] text-faint">
                該当する Insight はありません。
              </p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {insights.map((i) => (
                  <InsightCard key={i.slug} insight={i} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {unclassified.length > 0 && (
        <section className="mb-8" id="unclassified">
          <div className="flex items-baseline gap-3 mb-2 border-b border-amber-200 pb-2">
            <span className="text-[20px]" aria-hidden>
              📌
            </span>
            <h2 className="text-[18px] font-semibold text-ink">
              未分類
              <span className="ml-2 text-[12px] text-faint tabular-nums font-normal">
                ({unclassified.length} 本)
              </span>
            </h2>
          </div>
          <p className="text-[13px] text-faint leading-relaxed mb-4">
            分類体系の更新が追いついていない Insight。次回アップデートでグループに振り分け予定。
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unclassified.map((i) => (
              <InsightCard key={i.slug} insight={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

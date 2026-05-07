import type { SlaStatus } from "@/lib/catalog";

interface SummaryCardsProps {
  total: number;
  counts: Record<SlaStatus, number>;
}

const CARD_BASE =
  "bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-1";

export default function SummaryCards({ total, counts }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className={CARD_BASE}>
        <div className="text-[11px] uppercase tracking-wider text-faint">
          登録系列
        </div>
        <div className="text-[26px] font-semibold tabular-nums text-ink">
          {total}
        </div>
        <div className="text-[10px] text-faint">D-011 schema 準拠</div>
      </div>
      <div className={CARD_BASE}>
        <div className="text-[11px] uppercase tracking-wider text-faint">
          🟢 健全
        </div>
        <div
          className="text-[26px] font-semibold tabular-nums"
          style={{ color: "#16a34a" }}
        >
          {counts.healthy}
        </div>
        <div className="text-[10px] text-faint">SLA 内</div>
      </div>
      <div className={CARD_BASE}>
        <div className="text-[11px] uppercase tracking-wider text-faint">
          🟡 警告
        </div>
        <div
          className="text-[26px] font-semibold tabular-nums"
          style={{ color: "#d97706" }}
        >
          {counts.warning}
        </div>
        <div className="text-[10px] text-faint">SLA × 1.5 以内</div>
      </div>
      <div className={CARD_BASE}>
        <div className="text-[11px] uppercase tracking-wider text-faint">
          🔴 SLA 違反
        </div>
        <div
          className="text-[26px] font-semibold tabular-nums"
          style={{ color: "#dc2626" }}
        >
          {counts.breach}
        </div>
        <div className="text-[10px] text-faint">要対応</div>
      </div>
    </div>
  );
}

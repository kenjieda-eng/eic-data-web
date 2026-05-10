import {
  isSpdxLicense,
  summarizeByLicense,
  summarizeStatus,
  type EnrichedIndicator,
} from "@/lib/catalog";

interface DomainQualitySummaryProps {
  rows: EnrichedIndicator[];
}

export default function DomainQualitySummary({ rows }: DomainQualitySummaryProps) {
  const status = summarizeStatus(rows);
  const licenses = summarizeByLicense(rows);
  const total = rows.length;
  const breachPct = total === 0 ? 0 : Math.round((status.breach / total) * 100);
  const healthyPct = total === 0 ? 0 : Math.round((status.healthy / total) * 100);

  return (
    <section className="bg-white border border-slate-200 rounded-md p-5">
      <h2 className="text-[14px] font-semibold text-ink mb-3">
        データ品質サマリー
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-faint mb-2">
            SLA 状態
          </h3>
          <ul className="space-y-1 text-[12px]">
            <li className="flex items-center justify-between">
              <span className="text-emerald-700">Healthy</span>
              <span className="tabular-nums text-ink">
                {status.healthy} 系列 ({healthyPct}%)
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-amber-700">Warning</span>
              <span className="tabular-nums text-ink">{status.warning} 系列</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-rose-700">Breach</span>
              <span className="tabular-nums text-ink">
                {status.breach} 系列 ({breachPct}%)
              </span>
            </li>
            {status.unknown > 0 && (
              <li className="flex items-center justify-between">
                <span className="text-slate-500">Unknown</span>
                <span className="tabular-nums text-ink">
                  {status.unknown} 系列
                </span>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-faint mb-2">
            ライセンス内訳
          </h3>
          <ul className="space-y-1 text-[12px]">
            {licenses.map((l) => (
              <li key={l.license} className="flex items-center justify-between gap-2">
                <span
                  className={`truncate ${
                    isSpdxLicense(l.license)
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {l.license}
                </span>
                <span className="tabular-nums text-ink whitespace-nowrap">
                  {l.count} 系列
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

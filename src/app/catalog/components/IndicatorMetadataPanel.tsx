import {
  domainOf,
  isSpdxLicense,
  type Indicator,
  type SlaStatus,
} from "@/lib/catalog";

interface IndicatorMetadataPanelProps {
  indicator: Indicator;
  ageDays: number | null;
  status: SlaStatus;
}

const STATUS_LABELS: Record<SlaStatus, string> = {
  healthy: "🟢 健全",
  warning: "🟡 警告",
  breach: "🔴 SLA 違反",
  unknown: "⚪ 不明",
};

const STATUS_COLORS: Record<SlaStatus, string> = {
  healthy: "#16a34a",
  warning: "#d97706",
  breach: "#dc2626",
  unknown: "#94a3b8",
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "日次",
  weekly: "週次",
  monthly: "月次",
  quarterly: "四半期",
  annual: "年次",
};

interface RowProps {
  label: string;
  children: React.ReactNode;
}

function Row({ label, children }: RowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="text-[11px] uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className="text-[13px] text-ink leading-relaxed">{children}</div>
    </div>
  );
}

export default function IndicatorMetadataPanel({
  indicator: i,
  ageDays,
  status,
}: IndicatorMetadataPanelProps) {
  const dom = domainOf(i.domain);
  const licIsSpdx = isSpdxLicense(i.license);
  const statusColor = STATUS_COLORS[status];

  return (
    <section className="bg-white border border-slate-200 rounded-md p-5">
      <h2 className="text-[14px] font-semibold text-ink mb-4">
        D-011 メタデータ (19 項目)
      </h2>
      <div className="grid md:grid-cols-2 gap-x-8">
        <div>
          <Row label="ID">
            <code className="tabular-nums">{i.id}</code>
          </Row>
          <Row label="名称">{i.name || "—"}</Row>
          <Row label="ドメイン">
            <span aria-hidden>{dom.emoji}</span> {dom.ja}
          </Row>
          <Row label="頻度">
            {FREQUENCY_LABELS[i.frequency] ?? i.frequency ?? "—"}
          </Row>
          <Row label="単位">{i.unit || "—"}</Row>
          <Row label="出典">
            {i.source_url ? (
              <a
                href={i.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline hover:text-emerald-800"
              >
                {i.source_name || i.source_url} ↗
              </a>
            ) : (
              i.source_name || "—"
            )}
          </Row>
          <Row label="発行元">{i.publisher || "—"}</Row>
          <Row label="集計方式">{i.aggregation || "—"}</Row>
          <Row label="タイムゾーン">{i.tz || "—"}</Row>
          <Row label="欠損ポリシー">{i.missing_policy || "—"}</Row>
        </div>
        <div>
          <Row label="ライセンス">
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded ${
                licIsSpdx
                  ? "text-emerald-700 bg-emerald-50"
                  : "text-amber-700 bg-amber-50"
              }`}
            >
              {i.license || "—"}
            </span>
            {i.license_url && (
              <>
                {" "}
                <a
                  href={i.license_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-700 underline hover:text-emerald-800"
                >
                  規約 ↗
                </a>
              </>
            )}
          </Row>
          {i.license_notice && (
            <Row label="ライセンス注記">
              <p className="text-[12px] text-subink bg-amber-50 border border-amber-200 rounded px-3 py-2">
                {i.license_notice}
              </p>
            </Row>
          )}
          <Row label="観測 cutoff">
            <span className="tabular-nums">{i.observation_cutoff || "—"}</span>
          </Row>
          <Row label="経過">
            {ageDays === null ? "—" : `${ageDays} 日前`}
          </Row>
          <Row label="SLA">
            <span
              className="text-[10px] px-2 py-0.5 rounded font-medium tracking-wider"
              style={{
                background: `${statusColor}20`,
                color: statusColor,
              }}
            >
              {STATUS_LABELS[status]}
            </span>
            <span className="ml-2 text-[11px] text-faint">
              {i.freshness_sla_days
                ? `freshness_sla_days = ${i.freshness_sla_days}`
                : "freshness_sla_days 未設定 (default 30)"}
            </span>
          </Row>
          <Row label="バックフィル開始">
            <span className="tabular-nums">{i.backfill_start || "—"}</span>
          </Row>
          <Row label="updated_at">
            <span className="tabular-nums">{i.updated_at || "—"}</span>
          </Row>
          {i.notes && <Row label="備考">{i.notes}</Row>}
        </div>
      </div>
    </section>
  );
}

import { D011_SCHEMA } from "../sections";

const TIER_BADGE: Record<string, string> = {
  required: "bg-rose-100 text-rose-700",
  recommended: "bg-amber-100 text-amber-700",
  optional: "bg-slate-100 text-slate-600",
};

const TIER_LABEL: Record<string, string> = {
  required: "必須",
  recommended: "推奨",
  optional: "任意",
};

export default function MetadataSchemaTable() {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead className="bg-white border-b border-slate-200">
          <tr>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              層
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              項目名
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              説明
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {D011_SCHEMA.map((f) => (
            <tr key={f.name} className="border-b border-slate-100">
              <td className="px-2 py-1.5">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${TIER_BADGE[f.tier]}`}
                >
                  {TIER_LABEL[f.tier]}
                </span>
              </td>
              <td className="px-2 py-1.5 tabular-nums font-mono text-ink">
                {f.name}
              </td>
              <td className="px-2 py-1.5 text-subink">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

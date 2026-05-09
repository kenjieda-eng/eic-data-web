import { QUALITY_SIGNALS } from "../sections";

export default function QualitySignalsTable() {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead className="bg-white border-b border-slate-200">
          <tr>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              シグナル
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              意味
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              読み解き方
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {QUALITY_SIGNALS.map((s) => (
            <tr key={s.field} className="border-b border-slate-100">
              <td className="px-2 py-1.5 font-mono tabular-nums">{s.field}</td>
              <td className="px-2 py-1.5 text-subink">{s.meaning}</td>
              <td className="px-2 py-1.5 text-subink">{s.reading}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

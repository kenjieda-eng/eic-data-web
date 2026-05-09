import { CUSTOM_LICENSES, SPDX_LICENSES } from "../sections";

export function SpdxLicenseTable() {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead className="bg-white border-b border-slate-200">
          <tr>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              識別子
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              再配布
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              帰属表示
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              改変
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              EIC Data 採用例
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {SPDX_LICENSES.map((l) => (
            <tr key={l.id} className="border-b border-slate-100">
              <td className="px-2 py-1.5 font-mono tabular-nums">{l.id}</td>
              <td className="px-2 py-1.5">{l.redistribute}</td>
              <td className="px-2 py-1.5">{l.attribution}</td>
              <td className="px-2 py-1.5">{l.modify}</td>
              <td className="px-2 py-1.5 text-subink">{l.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CustomLicenseTable() {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead className="bg-white border-b border-slate-200">
          <tr>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              識別子
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              該当系列（EIC Data 内）
            </th>
            <th className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-faint">
              利用規約のポイント
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {CUSTOM_LICENSES.map((l) => (
            <tr key={l.id} className="border-b border-slate-100">
              <td className="px-2 py-1.5 font-mono tabular-nums">{l.id}</td>
              <td className="px-2 py-1.5 text-subink">{l.series}</td>
              <td className="px-2 py-1.5 text-subink">{l.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

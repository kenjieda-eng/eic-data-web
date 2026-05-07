import { domainOf, isSpdxLicense } from "@/lib/catalog";

interface DomainLicenseMatrixProps {
  domains: string[];
  licenses: string[];
  matrix: Record<string, Record<string, number>>;
}

export default function DomainLicenseMatrix({
  domains,
  licenses,
  matrix,
}: DomainLicenseMatrixProps) {
  return (
    <section className="mt-6 bg-white border border-slate-200 rounded-md p-5">
      <h3 className="text-[14px] font-semibold text-ink mb-3">
        ドメイン × ライセンス 内訳
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-faint font-medium whitespace-nowrap">
                ドメイン
              </th>
              {licenses.map((lic) => (
                <th
                  key={lic}
                  className={`px-3 py-2 text-[10px] tracking-wider font-medium whitespace-nowrap ${
                    isSpdxLicense(lic) ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {lic}
                </th>
              ))}
              <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-faint font-medium">
                合計
              </th>
            </tr>
          </thead>
          <tbody>
            {domains.map((dom) => {
              const info = domainOf(dom);
              const row = matrix[dom] ?? {};
              const total = Object.values(row).reduce((a, b) => a + b, 0);
              return (
                <tr key={dom} className="border-b border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap text-subink">
                    <span aria-hidden>{info.emoji}</span> {info.ja}
                  </td>
                  {licenses.map((lic) => (
                    <td
                      key={lic}
                      className="px-3 py-2 tabular-nums text-center text-subink"
                    >
                      {row[lic] ? row[lic] : "—"}
                    </td>
                  ))}
                  <td className="px-3 py-2 tabular-nums text-center font-semibold text-ink">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import Link from "next/link";
import {
  GLOSSARY_CATEGORIES,
  groupTermsByCategory,
  type GlossaryTerm,
} from "../data";

interface GlossaryTableProps {
  terms: GlossaryTerm[];
}

const TH =
  "px-3 py-2 text-[10px] uppercase tracking-wider text-faint font-medium whitespace-nowrap";
const TD = "px-3 py-2 text-[12px] align-top";

export default function GlossaryTable({ terms }: GlossaryTableProps) {
  if (terms.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-faint text-sm">
        該当する用語がありません。検索キーワードを変更してください。
      </div>
    );
  }

  const groups = groupTermsByCategory(terms);

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.category}>
          <h2 className="mb-2 text-[13px] font-semibold text-ink">
            {GLOSSARY_CATEGORIES[g.category]}
            <span className="ml-2 text-[11px] text-faint tabular-nums">
              {g.terms.length} 件
            </span>
          </h2>
          <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className={`${TH} w-[200px]`}>用語</th>
                  <th className={TH}>説明</th>
                </tr>
              </thead>
              <tbody>
                {g.terms.map((t) => (
                  <tr
                    key={t.slug}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className={`${TD} whitespace-nowrap`}>
                      <Link
                        href={`/glossary/${t.slug}`}
                        className="font-semibold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        {t.name}
                      </Link>
                      <div className="text-[10px] text-faint tabular-nums">
                        {t.slug}
                      </div>
                    </td>
                    <td className={`${TD} text-subink leading-relaxed`}>
                      {t.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

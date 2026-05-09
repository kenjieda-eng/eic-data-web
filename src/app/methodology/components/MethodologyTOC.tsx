import { METHODOLOGY_SECTIONS } from "../sections";

export default function MethodologyTOC() {
  return (
    <nav
      aria-label="方法論の目次"
      className="rounded-xl border border-emerald-300 bg-emerald-50 p-5"
    >
      <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">
        目次（全 {METHODOLOGY_SECTIONS.length} セクション）
      </div>
      <ol className="mt-3 grid md:grid-cols-2 gap-x-4 gap-y-1 text-[13px] list-decimal list-inside text-slate-700">
        {METHODOLOGY_SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="text-emerald-700 hover:text-emerald-900 underline"
            >
              {s.title}
            </a>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-emerald-700">
        クリックで該当セクションへスクロール。各セクションは Phase B-C の MDX 移植時に独立ページに昇格予定。
      </p>
    </nav>
  );
}

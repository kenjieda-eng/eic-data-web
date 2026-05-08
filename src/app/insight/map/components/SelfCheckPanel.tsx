import type { ValidationResult } from "@/lib/grouping";

interface SelfCheckPanelProps {
  result: ValidationResult;
  totalInsights: number;
}

export default function SelfCheckPanel({
  result,
  totalInsights,
}: SelfCheckPanelProps) {
  const { orphanSlugs, unclassifiedSlugs, duplicateSlugs, totalIssues } =
    result;

  if (totalIssues === 0) {
    return (
      <section className="mb-6 bg-emerald-50 border border-emerald-200 rounded-md p-4">
        <h3 className="text-[14px] font-semibold text-emerald-800 mb-1">
          ✅ 整合性チェック: 問題なし
        </h3>
        <p className="text-[12px] text-emerald-900 leading-relaxed">
          {totalInsights} 本の Insight が 6 軸グループに過不足なく分類されています。
          重複 slug / グループ未分類 / グループ内の不在 slug いずれも検出されませんでした。
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 bg-amber-50 border border-amber-200 rounded-md p-4">
      <h3 className="text-[14px] font-semibold text-ink mb-2">
        ⚠️ 整合性チェック: {totalIssues} 件の警告
      </h3>
      <p className="text-[12px] text-subink leading-relaxed mb-3">
        全 {totalInsights} 本の Insight をスキャンした結果、以下の項目で分類体系の更新が必要です。
        いずれもユーザ表示には影響せず、編集側のメンテナンス情報です。
      </p>
      <div className="grid md:grid-cols-3 gap-3 text-[12px]">
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-semibold text-rose-700 mb-1">
            重複 slug ({duplicateSlugs.length})
          </div>
          {duplicateSlugs.length === 0 ? (
            <p className="text-[11px] text-faint">— 検出されませんでした</p>
          ) : (
            <ul className="text-[11px] text-subink space-y-0.5 list-disc pl-4">
              {duplicateSlugs.map((s) => (
                <li key={s}>
                  <code>{s}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-semibold text-amber-700 mb-1">
            グループ未分類 ({unclassifiedSlugs.length})
          </div>
          {unclassifiedSlugs.length === 0 ? (
            <p className="text-[11px] text-faint">— 全て分類済み</p>
          ) : (
            <ul className="text-[11px] text-subink space-y-0.5 list-disc pl-4">
              {unclassifiedSlugs.map((s) => (
                <li key={s}>
                  <code>{s}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-semibold text-sky-700 mb-1">
            グループ内の不在 slug ({orphanSlugs.length})
          </div>
          {orphanSlugs.length === 0 ? (
            <p className="text-[11px] text-faint">— 全て実装済み</p>
          ) : (
            <ul className="text-[11px] text-subink space-y-0.5 list-disc pl-4">
              {orphanSlugs.map(({ groupId, slug }) => (
                <li key={`${groupId}-${slug}`}>
                  <code>{slug}</code>
                  <span className="ml-1 text-faint">@ {groupId}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

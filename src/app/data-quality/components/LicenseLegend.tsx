export default function LicenseLegend() {
  return (
    <section className="mt-6 bg-slate-50 border border-slate-200 rounded-md p-5 text-[13px] text-subink leading-relaxed">
      <h3 className="text-[14px] font-semibold text-ink mb-3">
        ライセンス識別子について
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-[12px] font-semibold text-emerald-700 mb-1">
            🟢 SPDX 識別子
          </div>
          <p className="text-[12px]">
            標準的なオープンライセンス。SPDX (Software Package Data Exchange) の識別子で表記。
          </p>
          <ul className="mt-2 text-[11px] space-y-0.5 list-disc pl-5">
            <li>
              <code className="text-emerald-700">CC-BY-4.0</code> — クリエイティブコモンズ 表示 4.0（出典明示で自由利用可）
            </li>
            <li>
              <code className="text-emerald-700">public-domain</code> — パブリックドメイン（自由利用可）
            </li>
            <li>
              <code className="text-emerald-700">MIT / Apache-2.0</code> — オープンソースライセンス
            </li>
          </ul>
        </div>
        <div>
          <div className="text-[12px] font-semibold text-amber-700 mb-1">
            🟡 独自識別子
          </div>
          <p className="text-[12px]">
            公的機関・市場運営団体の独自利用規約。出典明示は必須、追加文言が必要なケースあり。
          </p>
          <ul className="mt-2 text-[11px] space-y-0.5 list-disc pl-5">
            <li>
              <code className="text-amber-700">jepx-terms</code> — JEPX（日本卸電力取引所）公開規約
            </li>
            <li>
              <code className="text-amber-700">jma-terms</code> — 気象庁ホームページ利用規約
            </li>
            <li>
              <code className="text-amber-700">boj-terms</code> — 日本銀行 API 利用規約（注: 「日本銀行によって保証されない」文言が必須）
            </li>
            <li>
              <code className="text-amber-700">meti-terms</code> — 政府標準利用規約 2.0（CC BY 4.0 互換）
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

interface SlaInterpretationProps {
  total: number;
  warningCount: number;
  breachCount: number;
}

export default function SlaInterpretation({
  total,
  warningCount,
  breachCount,
}: SlaInterpretationProps) {
  if (warningCount === 0 && breachCount === 0) return null;

  return (
    <section
      aria-label="SLA 警告/違反の解釈"
      className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6"
    >
      <h3 className="text-[14px] font-semibold text-ink mb-2">
        ⚠️ SLA 警告／違反の正しい読み方
      </h3>
      <p className="text-[12px] text-subink leading-relaxed mb-3">
        現在{" "}
        <strong style={{ color: "#d97706" }}>{warningCount} 件の警告</strong> +{" "}
        <strong style={{ color: "#dc2626" }}>{breachCount} 件の違反</strong>{" "}
        が表示されていますが、これは{" "}
        <b>「データ取得が違法・不正」を意味するものではありません</b>。 全 {total}{" "}
        系列は公開・無料・ライセンス OK のソース（D-002 / D-005 準拠）からのみ取得されており、
        「違反」表示は単に「観測値の最終確定日が <code>freshness_sla_days</code> を超えた」状態を可視化しています。
        内訳を読み解くと、原因は 3 種類に分かれます:
      </p>
      <div className="grid md:grid-cols-3 gap-3 mt-3">
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-semibold text-emerald-700 mb-1">
            A. 公的機関の公開遅延
          </div>
          <p className="text-[11px] text-subink">
            METI 電力調査統計は <b>4 ヶ月遅れ</b> で公開、World Bank Pink Sheet
            は前月号が翌月確定。ソース側の正常な公開頻度であり、
            <b>パイプラインの問題ではない</b>。SLA 値の調整で解消可能。
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-semibold text-sky-700 mb-1">
            B. 季節依存データ
          </div>
          <p className="text-[11px] text-subink">
            「最深積雪」は冬季しか観測値がないので、雪国以外の地点は最終確定日が冬の最後の日で固定される（大阪は 2021 年 1 月以来雪なし）。これは{" "}
            <b>気象現象の自然な不在</b> であり、データ欠落ではない。
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-semibold text-rose-700 mb-1">
            C. 本物のラグ（要監視）
          </div>
          <p className="text-[11px] text-subink">
            観測所側の値到着が一時的に遅れているケース。次回の Nightly Fetch で自動回復することが多いが、
            <b>2 週間続けば調査対象</b>。現時点では <code>jma-precip-tohoku</code> 等の数件のみ。
          </p>
        </div>
      </div>
      <p className="text-[11px] text-faint mt-3 leading-relaxed">
        設計判断: 「SLA 違反」は問題の早期発見が目的なので、誤検知（A・B 型）も含めて広く表示する方針です。
        公的機関の公開遅延に合わせて <code>freshness_sla_days</code> を緩めると違反数は劇的に減りますが、本物のラグ検知も鈍くなるトレードオフがあります。
      </p>
    </section>
  );
}

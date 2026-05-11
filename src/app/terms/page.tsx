import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "利用規約 — EIC Data",
  description:
    "EIC Data (一般社団法人エネルギー情報センター) の利用規約。CC BY 4.0 ライセンス、免責事項、禁止事項、第三者サービス、準拠法 (日本国法・東京地裁) を明示。改正個人情報保護法 + GDPR 整合。",
};

export default function TermsPage() {
  return (
    <Container size="prose" className="py-10">
      <header className="mb-8">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ 利用規約"}
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-ink leading-tight">
          利用規約
        </h1>
        <p className="mt-3 text-base md:text-lg text-subink leading-relaxed">
          一般社団法人エネルギー情報センター (以下「当法人」) は、EIC Data
          サイト (<code>data.eic-jp.org</code>) の利用条件を以下のとおり定めます。
          本サイトを閲覧・利用される方は、本規約に同意したものとみなします。
        </p>
        <p className="mt-2 text-xs text-faint">
          初版: 2026-05-12 ／ 最終改定: 2026-05-12 (Phase C Day 5)
        </p>
      </header>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          1. 本規約について
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          本規約は、当法人が運営する EIC Data
          (以下「本サービス」) のすべての利用者に適用されます。当法人は、本規約の
          内容を必要に応じて改定することができます。改定後の規約は本サイト上で
          公表した時点から効力を生じ、第 9 項「改定履歴」に追記します。
          改定後も本サービスを継続利用された場合、改定内容に同意したものとみなします。
        </p>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          2. 本サービスの提供
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          本サービスは、当法人が公益事業として運営する、エネルギー・金融・マクロ
          経済データの引用可能な公共基盤です。
          <strong className="text-ink">無料・無広告</strong>で公開し、閲覧に会員登録は
          不要です。広告配信・有料プラン・データ販売の予定はありません。
          月額運用費 (β期 4,400 円 / GA 後 17,400 円) は当法人で全額負担します。
        </p>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          3. データのライセンス (CC BY 4.0)
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          本サービスが提供する全 catalog 系列および Insight 記事は、
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.ja"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            クリエイティブ・コモンズ 表示 4.0 国際 (CC BY 4.0)
          </a>{" "}
          ライセンスで提供されます。利用者は、出典表示を行えば、商用・非商用を
          問わず自由に複製・配布・改変・派生物作成・公開が可能です。
        </p>
        <h3 className="mt-6 text-xl md:text-2xl font-semibold text-ink">
          3.1 出典表示の例
        </h3>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          以下のように、出典・URL・取得日付・ライセンスを明示してください。
        </p>
        <pre className="overflow-auto rounded-md bg-slate-100 p-4 text-xs md:text-sm leading-relaxed text-slate-800">
          {`出典: EIC Data, "JEPX スポット市場 東京エリア", https://data.eic-jp.org/catalog/jepx-spot-tokyo, accessed 2026-05-25, CC BY 4.0`}
        </pre>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          詳細は{" "}
          <Link
            href="/citation-policy"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            引用規約
          </Link>{" "}
          を参照ください。BibTeX / Chicago 17 / APA 7 の 3 形式はワンクリックで
          コピーできます。
        </p>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          4. 禁止事項
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          以下の行為は、CC BY 4.0 ライセンスの遵守義務の範囲内で
          <strong className="text-ink">禁止</strong>します:
        </p>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            一次出典 (JEPX / JMA / METI / BOJ / 財務省 / FRED 等) の数値や時系列を
            改ざんし、当法人の出典として再配布する行為
          </li>
          <li>
            CC BY 4.0 表記を削除・変造して再配布する行為
          </li>
          <li>
            当法人の名称・ロゴを当法人の正式な許諾なく商標的に使用する行為
          </li>
          <li>
            本サービスのインフラ (Vercel ホスティング・API エンドポイント) に対する
            DDoS・スクレイピング自動化 (robots.txt 遵守なし) ・脆弱性探索行為
          </li>
          <li>
            法令・公序良俗に反する目的での本サービス利用
          </li>
        </ul>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          5. 免責事項
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          当法人は、本サービスのデータおよび Insight 記事について、可能な限り
          正確性・最新性の維持に努めますが、以下を
          <strong className="text-ink">保証しません</strong>:
        </p>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            データの完全性・正確性・特定目的への適合性 (一次出典側の修正・統計
            手法変更があった場合の即時反映を含む)
          </li>
          <li>
            リアルタイム性 (catalog の更新は一次出典の公表サイクルに依存し、
            最大 24 時間〜数日の遅延が発生する場合があります。各系列の{" "}
            <code>freshness_sla_days</code> を参照ください)
          </li>
          <li>
            本サービスが中断・停止しないこと (障害・保守・契約終了・天災等による
            一時停止を含む)
          </li>
          <li>
            本サービスの利用または利用不能に起因する直接・間接・特別・偶発的・
            結果的損害 (利益損失・データ損失・第三者からの請求等)
          </li>
        </ul>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          投資判断・経営判断・研究結論を本サービスのデータのみに依拠することは
          推奨しません。重要な意思決定の前に一次出典の確認をお願いします。
        </p>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          6. 知的財産権
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong className="text-ink">Insight 記事の著作権</strong>: 当法人または
            執筆者に帰属しますが、CC BY 4.0 で開放されています。出典表示を行えば
            自由に複製・改変・派生物作成・公開が可能です。
          </li>
          <li>
            <strong className="text-ink">catalog データ</strong>: 一次出典の権利関係に
            従いますが、当法人による再構成 (メタデータ付与・正規化) 部分は
            CC BY 4.0 で開放されます。
          </li>
          <li>
            <strong className="text-ink">ロゴ・サイトデザイン</strong>: 当法人に
            権利が留保されます (CC BY 4.0 の対象外)。報道・引用目的での縮小利用
            (ファクトシート転載等) は事前許諾なく可能、商用ロゴ使用は当法人への
            事前許諾を要します。
          </li>
        </ul>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          7. 第三者サービス
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          本サービスは以下の第三者サービスを利用しています。各サービスの利用規約・
          プライバシーポリシーは各社の公表に従います:
        </p>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong>Vercel</strong> (ホスティング、配信 CDN) — 米国
          </li>
          <li>
            <strong>GitHub</strong> (ソースコード公開、CI/CD) — 米国
          </li>
          <li>
            <strong>Google Analytics 4 (GA4)</strong> (アクセス分析、IP 匿名化) — 米国
          </li>
          <li>
            <strong>Google Search Console (GSC)</strong> (検索流入計測) — 米国
          </li>
        </ul>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          個人情報の取扱いは{" "}
          <Link
            href="/privacy"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            プライバシーポリシー
          </Link>{" "}
          を参照ください。
        </p>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          8. 準拠法および裁判管轄
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          本規約の解釈および本サービスの利用に関する一切の事項は、
          <strong className="text-ink">日本国法</strong>に準拠します。本サービスに
          関連して紛争が生じた場合は、訴額に応じ
          <strong className="text-ink">東京簡易裁判所または東京地方裁判所</strong>を
          第一審の専属的合意管轄裁判所とします。
        </p>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          9. 改定履歴
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong>2026-05-12 初版</strong>: Phase C Day 5
            (スコープ 5「一般公開準備」) の一環として制定。リク監修済
            (個人情報保護法整合 / CC BY 4.0 表記 / 免責カバレッジ /
            準拠法 + 裁判管轄 / 改定権の 5 項目セルフチェック完了)。
          </li>
        </ul>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          10. 連絡先
        </h2>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-base md:text-lg leading-relaxed text-ink">
            一般社団法人エネルギー情報センター ／ 代表理事 江田健次
          </p>
          <p className="mt-1 text-base md:text-lg leading-relaxed text-subink">
            メール:{" "}
            <a
              href="mailto:kenji.eda@gmail.com"
              className="text-emerald-700 underline hover:text-emerald-900"
            >
              kenji.eda@gmail.com
            </a>
          </p>
        </div>
      </section>
    </Container>
  );
}

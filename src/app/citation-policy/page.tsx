import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "引用規約 — EIC Data",
  description:
    "EIC Data のデータ・Insight 引用に関する公式ガイド。BibTeX / Chicago 17 / APA 7 の 3 形式早見表、データ引用 vs Insight 引用の使い分け、CC BY 4.0 帰属表示要件を明示。",
};

export default function CitationPolicyPage() {
  return (
    <Container size="prose" className="py-10">
      <header className="mb-8">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ 引用規約"}
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-ink leading-tight">
          引用規約
        </h1>
        <p className="mt-3 text-base md:text-lg text-subink leading-relaxed">
          EIC Data のデータおよび Insight 記事を、学術論文・報道記事・行政資料・
          内部レポート等で引用する際の作法を定めます。CC BY 4.0
          ライセンスの帰属表示義務を満たす最小要件を明示し、3 形式の引用文字列を
          各ページの CitationButton で即座にコピーできるようにしています。
        </p>
        <p className="mt-2 text-xs text-faint">
          初版: 2026-05-12 ／ 最終改定: 2026-05-12 (Phase C Day 5)
        </p>
      </header>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          1. 3 形式の使い分け (早見表)
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          各 Insight および catalog ページの右上に常設の{" "}
          <strong className="text-ink">CitationButton</strong> から、BibTeX /
          Chicago 17 / APA 7 の 3 形式をワンクリックでコピーできます。利用場面に
          応じて選択してください。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm md:text-base">
            <thead>
              <tr className="border-b border-slate-300 text-left">
                <th className="py-2 pr-4 font-semibold text-ink">形式</th>
                <th className="py-2 pr-4 font-semibold text-ink">主な用途</th>
                <th className="py-2 pr-4 font-semibold text-ink">対応分野</th>
              </tr>
            </thead>
            <tbody className="text-subink">
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 font-mono text-emerald-700">BibTeX</td>
                <td className="py-2 pr-4">LaTeX 論文・学位論文・技術書</td>
                <td className="py-2 pr-4">理工系・経済学・統計学全般</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 font-mono text-emerald-700">
                  Chicago 17
                </td>
                <td className="py-2 pr-4">
                  人文・歴史・政策論文、報道記事の脚注
                </td>
                <td className="py-2 pr-4">
                  人文社会科学、メディア (シカゴマニュアル準拠)
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-emerald-700">APA 7</td>
                <td className="py-2 pr-4">心理学・教育学・社会科学論文</td>
                <td className="py-2 pr-4">
                  社会科学・行動科学 (米国心理学会様式)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          2. データ引用 vs Insight 引用
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          EIC Data の引用には 2 種類あります。
          <strong className="text-ink">引用対象に応じて正しい型を選んでください。</strong>
        </p>

        <h3 className="mt-6 text-xl md:text-2xl font-semibold text-ink">
          2.1 データ引用 (catalog 系列) — Dataset 型
        </h3>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          特定系列の時系列データを参照する場合、
          <strong className="text-ink">catalog の個別ページ</strong> (例:{" "}
          <code>/catalog/jepx-spot-tokyo</code>) から Dataset 型の引用を取得します。
          BibTeX の <code>@dataset</code> エントリ、APA の Dataset 様式、Chicago の
          Database 様式に対応します。引用には系列名・出典機関名・URL・accessed
          日付・ライセンスが含まれます。
        </p>

        <h3 className="mt-6 text-xl md:text-2xl font-semibold text-ink">
          2.2 Insight 引用 (記事) — Article 型
        </h3>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          独自 Insight 記事の論考・解釈を参照する場合、
          <strong className="text-ink">Insight 個別ページ</strong> (例:{" "}
          <code>/insight/temp-vs-price</code>) から Article 型の引用を取得します。
          BibTeX の <code>@article</code> エントリ、APA の Article 様式、Chicago の
          Magazine Article 様式に対応します。引用には記事タイトル・著者・公開日・
          URL・accessed 日付・ライセンスが含まれます。
        </p>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          3. CitationButton の使い方
        </h2>
        <ol className="ml-6 list-decimal space-y-2 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong className="text-ink">引用したいページを開く</strong>: Insight
            個別ページまたは catalog 個別ページに移動します。
          </li>
          <li>
            <strong className="text-ink">CitationButton をクリック</strong>:
            ページ上部・タイトル右側にある <code>📋 引用</code> ボタンを押すと
            3 形式タブが表示されます。
          </li>
          <li>
            <strong className="text-ink">形式を選択</strong>: BibTeX / Chicago 17 /
            APA 7 から執筆媒体に合うものを選びます。
          </li>
          <li>
            <strong className="text-ink">コピーして使用</strong>: 右上のコピーアイコンを
            押すとクリップボードに転送されます。引用元側のテンプレート (BibTeX
            ファイル、参考文献欄、脚注欄) にペーストしてください。
          </li>
        </ol>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          実装の詳細は{" "}
          <Link
            href="/methodology"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            方法論
          </Link>{" "}
          §引用フォーマット を参照ください。
        </p>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          4. 媒体取材時の表記
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong>サービス名</strong>: 「EIC Data」(全角でも半角でも可、
            <code>e</code> 小文字推奨)
          </li>
          <li>
            <strong>運営者名</strong>: 「一般社団法人エネルギー情報センター」
            (略称「EIC」も使用可、初出は正式名称を併記推奨)
          </li>
          <li>
            <strong>代表者名</strong>: 「代表理事 江田健次 (えだ・けんじ)」
          </li>
          <li>
            <strong>サイト URL</strong>: <code>https://data.eic-jp.org/</code>
          </li>
          <li>
            <strong>ロゴ使用</strong>: 報道・引用目的での縮小利用 (記事内・ファクトシート
            転載等) は事前許諾なく可能。商用ロゴ使用、看板・印刷物への拡大利用は
            kenji.eda@gmail.com まで事前にご相談ください。
          </li>
        </ul>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          5. 二次利用時の要求 (CC BY 4.0 帰属表示)
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          CC BY 4.0 ライセンスの帰属表示義務を満たすには、以下 5 項目を明示してください:
        </p>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong>出典名</strong>: 「EIC Data」または引用元ページのタイトル
          </li>
          <li>
            <strong>URL</strong>: 引用元ページの完全 URL
          </li>
          <li>
            <strong>accessed_at</strong>: 利用者がアクセスした日付 (YYYY-MM-DD)
          </li>
          <li>
            <strong>ライセンス表示</strong>: 「CC BY 4.0」
          </li>
          <li>
            <strong>改変の有無</strong>: 派生物を作成した場合は「改変あり」と明記
          </li>
        </ul>
        <h3 className="mt-6 text-xl md:text-2xl font-semibold text-ink">
          5.1 表記例
        </h3>
        <pre className="overflow-auto rounded-md bg-slate-100 p-4 text-xs md:text-sm leading-relaxed text-slate-800">
          {`出典: EIC Data, "JEPX スポット市場 東京エリア", https://data.eic-jp.org/catalog/jepx-spot-tokyo, accessed 2026-05-25, CC BY 4.0`}
        </pre>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          報道・社内資料・スライド等で文字数制約がある場合、最低限「EIC Data /
          CC BY 4.0 / URL」が含まれていれば帰属義務を満たします。
        </p>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          6. 問い合わせ
        </h2>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-base md:text-lg leading-relaxed text-ink">
            引用形式・取材・ロゴ使用・派生物公開に関する問い合わせ:
          </p>
          <p className="mt-1 text-base md:text-lg leading-relaxed text-subink">
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
        <p className="text-base md:text-lg leading-relaxed text-subink">
          関連: {" "}
          <Link
            href="/terms"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            利用規約
          </Link>{" "}
          ／{" "}
          <Link
            href="/privacy"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            プライバシーポリシー
          </Link>{" "}
          ／{" "}
          <Link
            href="/methodology"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            方法論
          </Link>
        </p>
      </section>
    </Container>
  );
}

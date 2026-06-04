import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "プライバシーポリシー — EIC Data",
  description:
    "EIC Data (一般社団法人エネルギー情報センター) のプライバシーポリシー。GA4 / GSC の利用、Cookie 説明、データ保持期間、第三者提供方針を明示。改正個人情報保護法 (PIPL) + GDPR 整合。",
};

export default function PrivacyPage() {
  return (
    <Container size="wide" className="py-10">
      <header className="mb-8 max-w-3xl mx-auto">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ プライバシーポリシー"}
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-ink leading-tight">
          プライバシーポリシー
        </h1>
        <p className="mt-3 text-base md:text-lg text-subink leading-relaxed">
          一般社団法人エネルギー情報センター (以下「当法人」) は、EIC Data
          サイト (<code>data.eic-jp.org</code>) の利用者の個人情報・利用情報を
          以下のとおり取り扱います。
        </p>
        <p className="mt-2 text-xs text-faint">初版: 2026-05-12 ／ 最終改定: 2026-05-12</p>
      </header>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          1. 本サイトについて
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          EIC Data は当法人が運営する、エネルギー・金融・マクロ経済の引用可能な
          公共データ基盤です。<strong className="text-ink">無料・無広告</strong>で
          公開しており、閲覧に会員登録は不要です。データは
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            CC BY 4.0
          </a>{" "}
          ライセンスで提供します。
        </p>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          2. 取得する情報
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          以下の情報を、サイト改善 + 検索パフォーマンス監視のために取得します。
          氏名・メールアドレス等の直接識別情報は取得しません。
        </p>

        <h3 className="mt-6 text-xl md:text-2xl font-semibold text-ink">
          2.1 Google Analytics 4 (GA4)
        </h3>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong>IP アドレス (匿名化済)</strong>: Google 側で最後のオクテットが
            <code>0</code> に置換されるため、特定の個人を識別できません
          </li>
          <li>
            <strong>Cookie</strong>: <code>_ga</code>、<code>_ga_*</code>{" "}
            (訪問者一意識別、有効期限 2 年)
          </li>
          <li>訪問ページ URL、参照元 URL、デバイス情報 (OS / ブラウザ / 画面サイズ)</li>
          <li>滞在時間、スクロール深度、クリックイベント</li>
          <li>
            カスタムイベント:{" "}
            <code className="text-xs">csv_download</code> /{" "}
            <code className="text-xs">cite_copy</code> /{" "}
            <code className="text-xs">external_source_click</code> /{" "}
            <code className="text-xs">filter_change</code>
          </li>
        </ul>

        <h3 className="mt-6 text-xl md:text-2xl font-semibold text-ink">
          2.2 Google Search Console (GSC)
        </h3>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>Google 検索からの流入クエリ (検索キーワード)</li>
          <li>検索結果での表示回数、クリック数、CTR、平均掲載順位</li>
          <li>クロールエラー、構造化データの妥当性、Core Web Vitals</li>
        </ul>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          3. 利用目的
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>サイト改善 (どの記事が読まれているか、どのデバイスでアクセスされているか)</li>
          <li>検索パフォーマンス監視 (Google 検索からの流入経路把握)</li>
          <li>Insight 編集の優先順位決定 (上位検索クエリからの次ネタ発掘)</li>
          <li>不具合・エラーの検知と修正</li>
        </ul>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          広告配信・メール配信・商品販売目的での利用は<strong className="text-ink">行いません</strong>。
        </p>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          4. 第三者提供
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          取得した情報は <strong className="text-ink">Google (GA4 / GSC) のみ</strong>{" "}
          に提供します。それ以外の第三者には提供しません。Google のプライバシー方針は{" "}
          <a
            href="https://policies.google.com/privacy"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            policies.google.com/privacy
          </a>{" "}
          を参照してください。
        </p>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          5. データ保持期間
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong>GA4</strong>: 14 ヶ月 (Google デフォルト設定、当法人で変更なし)
          </li>
          <li>
            <strong>GSC</strong>: 16 ヶ月 (Google プロダクト仕様)
          </li>
          <li>当法人のサーバには利用情報を保存しません (Vercel ホスティングのアクセスログは Vercel の保持期間に従う)</li>
        </ul>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          6. Cookie について
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong>必須 Cookie</strong>: なし (本サイトは閲覧のみで認証不要、ログイン Cookie なし)
          </li>
          <li>
            <strong>分析 Cookie</strong>: GA4 が <code>_ga</code> / <code>_ga_*</code>{" "}
            を設定 (有効期限 2 年)。訪問者は以下の方法で無効化可能:
          </li>
        </ul>
        <ul className="ml-12 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            ブラウザの Cookie ブロック機能 (Chrome / Firefox / Safari / Edge の設定 → プライバシー)
          </li>
          <li>
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              className="text-emerald-700 underline hover:text-emerald-900"
            >
              Google Analytics オプトアウトアドオン
            </a>{" "}
            (公式拡張機能)
          </li>
        </ul>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          Cookie を無効化しても本サイトの閲覧 + データ取得 + 引用機能はすべて
          利用可能です (UI / API 機能に影響なし)。
        </p>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          6.5 透明性ダッシュボード
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          当法人が本サイトで集計している利用統計の月次値は{" "}
          <Link
            href="/usage-stats"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            /usage-stats
          </Link>{" "}
          で全件公開しています。集計対象は <code>API リクエスト数</code> /{" "}
          <code>CSV ダウンロード数</code> / <code>引用コピー数</code> の 3 種のみで、
          個人特定情報 (IP / メール / User-Agent) は含みません。
          JSON 形式は <code>/api/usage-stats</code> でも取得できます。
        </p>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          7. EU 訪問者 (GDPR 整合)
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          本サイトは EU 一般データ保護規則 (GDPR) を踏まえ、以下を遵守します:
        </p>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong>Cookie 同意</strong>: GA4 は匿名化 IP + 分析目的のみのため、
            EU でも明示的な事前同意なしで利用可能 (legitimate interest 法理)
          </li>
          <li>
            データ主体の権利 (アクセス / 訂正 / 削除 / 移行) に関する問い合わせは
            下記連絡先で対応
          </li>
          <li>
            データ転送は Google の SCC (標準契約条項) + 十分性認定に基づく
          </li>
        </ul>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          8. 改正個人情報保護法 (PIPL 2022) 整合
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          本サイトは改正個人情報保護法 (2022 年 4 月施行) を踏まえ、以下を遵守します:
        </p>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>仮名加工情報の取扱い (GA4 の匿名化 IP は仮名加工に該当)</li>
          <li>
            個人関連情報の第三者提供 (Cookie 由来の利用情報の Google 共有) について本ページで明示
          </li>
          <li>越境移転 (Google = 米国法人) について GDPR 同条項に基づき開示</li>
        </ul>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          9. 連絡先
        </h2>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-base md:text-lg leading-relaxed text-ink">
            一般社団法人エネルギー情報センター ／ 代表 EDA 健次
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
          <p className="mt-1 text-sm text-faint">
            本サイト + 当法人運営の他サイト (eic-jp.org / pps-net.org) 共通の
            プライバシーに関する問い合わせ窓口です。
          </p>
        </div>
      </section>

      <section className="prose-section space-y-3 max-w-3xl mx-auto">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          10. 改定履歴
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong>2026-05-12 初版</strong>: Phase C Day 4 で GA4 + GSC 実装に
            合わせて公開 (リク監修済、改正 PIPL + GDPR 整合確認済)
          </li>
        </ul>
      </section>
    </Container>
  );
}

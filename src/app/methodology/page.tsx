import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { fetchCatalog } from "@/lib/catalog";
import DataCountStat from "./components/DataCountStat";
import { CustomLicenseTable, SpdxLicenseTable } from "./components/LicenseTables";
import MetadataSchemaTable from "./components/MetadataSchemaTable";
import MethodologySectionCard from "./components/MethodologySection";
import MethodologyTOC from "./components/MethodologyTOC";
import QualitySignalsTable from "./components/QualitySignalsTable";
import { D011_SCHEMA, METHODOLOGY_SECTIONS } from "./sections";

export const metadata: Metadata = {
  title: "方法論 — EIC Data",
  description:
    "EIC Data の編集方針。一次出典優先・再現可能・透明な運用を原則とする。10 セクション: 二層アーキテクチャ / 一次出典 / 実データ / 更新頻度 / 訂正 / 引用 / D-011 / 引用作法 / ライセンス / SLA。",
};

export default async function MethodologyPage() {
  const catalog = await fetchCatalog();
  const totalCount = catalog.indicator_count;
  const realCount = totalCount;
  const refCount = 0;

  const sec = (n: number) =>
    METHODOLOGY_SECTIONS.find((s) => s.number === n)!;

  return (
    <Container className="py-10">
      <header className="mb-6">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ 方法論"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          方法論（Methodology）
        </h1>
        <p className="mt-2 text-sm text-subink leading-relaxed">
          一次出典優先・再現可能・透明な運用を原則とする EIC Data の編集方針。
        </p>
      </header>

      <div className="space-y-6 text-[15px] leading-7 text-slate-800">
        <MethodologyTOC />

        <MethodologySectionCard section={sec(1)}>
          <p>
            編集層（Editorial Tier, 約 200 指標）と配信層（Distribution Tier, 約 30,000 系列）を分離。編集層は人が一次出典確認・解釈・更新する「文脈つき」データ、配信層は自動収集・機械処理向けのメタデータ中心カタログ。
          </p>
        </MethodologySectionCard>

        <MethodologySectionCard section={sec(2)}>
          <p>
            掲載するすべての指標には一次出典（官公庁・市場運営者・取引所・学術機関・企業 IR）を明示する。二次出典のみの場合は編集層に掲載しない。ライセンスは公開 API／CC-BY／政府公表データ等、再配布可能なものを優先する。
          </p>
        </MethodologySectionCard>

        <MethodologySectionCard section={sec(3)}>
          <DataCountStat
            totalCount={totalCount}
            realCount={realCount}
            refCount={refCount}
          />
        </MethodologySectionCard>

        <MethodologySectionCard section={sec(4)}>
          <p>
            各指標は原則として出典のオリジナル公表サイクル（日次・週次・月次・四半期・年次）に従う。毎日 07:00 JST にバッチ更新し、未更新の場合は as-of 日付を維持する。
          </p>
        </MethodologySectionCard>

        <MethodologySectionCard section={sec(5)}>
          <p>
            値に誤りが判明した場合は訂正履歴に記録し、当該指標ページに訂正バナーを掲出する。遡及修正は一次出典に従う。
          </p>
        </MethodologySectionCard>

        <MethodologySectionCard section={sec(6)}>
          <p>
            当サイトの数値を論文・記事・社内資料等で引用する場合は、本ページ「8. 引用の作法」記載の citation ID と as-of 日付を併記する。
          </p>
        </MethodologySectionCard>

        <MethodologySectionCard section={sec(7)}>
          <p>
            すべての配信系列は{" "}
            <strong>
              {D011_SCHEMA.length} 項目 × 3 層
            </strong>{" "}
            の構造化メタデータを持つ。これにより、研究者が「この系列は引用しても大丈夫か？」を 5 秒で判断できる。現在の状態は{" "}
            <Link
              href="/data-quality"
              className="text-sky-700 underline hover:text-sky-800"
            >
              データ品質ダッシュボード
            </Link>
            {" "}から確認可能。
          </p>
          <MetadataSchemaTable />
          <p className="mt-3 text-[12px] text-subink">
            実装: 各 fetch_*.py がデータ書き出し時に <code className="font-mono">{"{id}.metadata.json"}</code> を生成 → CI が <code className="font-mono">data/catalog/indicators.json</code> にまとめる → 公開層がビルド時に 1 fetch して描画。詳細は{" "}
            <a
              href="https://github.com/kenjieda-eng/eic-data-pipeline/blob/main/docs/source_map.yaml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 underline hover:text-sky-800"
            >
              source_map.yaml
            </a>
            {" "}参照。
          </p>
        </MethodologySectionCard>

        <MethodologySectionCard section={sec(8)}>
          <p>
            EIC Data は「引用インフラ」を北極星に掲げる。読者が論文・記事・資料で本サイトの値を引用する際の標準形式と、編集チームが内部で守る作法をここに明示する。
          </p>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            8.1 なぜ &quot;引用の作法&quot; が必要か
          </h3>
          <p className="mt-2">
            日本のエネルギー・金融データは、複数機関が異なる粒度・命名・タイムゾーンで公表しており、孫引きが起きやすい。EIC Data の値を引用する際に{" "}
            <strong>(a) 一次出典に到達できる</strong> /{" "}
            <strong>(b) as-of 日付が明示される</strong> /{" "}
            <strong>(c) 第三者が再現できる</strong> の 3 条件を満たすと、引用された数値の信頼性が読者にも担保される。
          </p>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            8.2 推奨する 3 形式
          </h3>
          <div className="mt-3 space-y-3">
            <div className="rounded border border-slate-200 bg-white p-3">
              <div className="text-[11px] uppercase tracking-wider text-faint">
                短縮形（記事・SNS・社内チャット）
              </div>
              <pre className="mt-1 text-[12px] leading-relaxed whitespace-pre-wrap text-ink">
{`JEPX 東京エリア 月次平均（2026-03 = ¥12.3/kWh）／ 出典: EIC Data, https://data.eic-jp.org/catalog/jepx-spot-tokyo （as-of 2026-04-29）`}
              </pre>
            </div>
            <div className="rounded border border-slate-200 bg-white p-3">
              <div className="text-[11px] uppercase tracking-wider text-faint">
                完全形（学術誌・白書・調査レポート）
              </div>
              <pre className="mt-1 text-[12px] leading-relaxed whitespace-pre-wrap text-ink">
{`EIC Data (2026). "JEPX 東京エリアスポット価格（日次）". 一般社団法人エネルギー情報センター.
取得日 2026-04-29. https://data.eic-jp.org/catalog/jepx-spot-tokyo
一次出典: 日本卸電力取引所 (JEPX) スポット市場価格. https://www.jepx.jp/electricpower/market-data/spot/
ライセンス: jepx-terms（再配布可、原典明示必須）`}
              </pre>
            </div>
            <div className="rounded border border-slate-200 bg-white p-3">
              <div className="text-[11px] uppercase tracking-wider text-faint">
                BibTeX（LaTeX 論文）
              </div>
              <pre className="mt-1 text-[12px] leading-relaxed whitespace-pre-wrap text-ink">
{`@misc{eicdata_jepx_tokyo_2026,
  author       = {{EIC Data / Energy Information Center}},
  title        = {JEPX 東京エリアスポット価格（日次, 2016--2026）},
  year         = {2026},
  url          = {https://data.eic-jp.org/catalog/jepx-spot-tokyo},
  note         = {accessed 2026-04-29; primary source: JEPX Spot Market},
  howpublished = {\\url{https://www.jepx.jp/electricpower/market-data/spot/}}
}`}
              </pre>
            </div>
          </div>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            8.3 引用に必須の 4 要素
          </h3>
          <ol className="mt-2 list-decimal list-inside space-y-1">
            <li>
              <strong>系列名と単位</strong>（例:
              「JEPX 東京エリア 月次平均（¥/kWh）」）
            </li>
            <li>
              <strong>as-of 日付</strong>（取得時点の最終確定日、データ品質ダッシュボードの{" "}
              <code className="font-mono">observation_cutoff</code>{" "}
              と一致）
            </li>
            <li>
              <strong>EIC Data の URL + 一次出典の URL</strong>（両方記載、第三者再現性の担保）
            </li>
            <li>
              <strong>ライセンス識別子</strong>（SPDX または独自、再配布可否を読者に示す）
            </li>
          </ol>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            8.4 派生指標（Insight 系）の引用
          </h3>
          <p className="mt-2">
            Insight ページ（複数指標を組み合わせた編集物）を引用する場合は、{" "}
            <strong>(i) Insight slug</strong>（例:{" "}
            <code className="font-mono">us-jp-rate-spread-vs-usdjpy</code>） +{" "}
            <strong>(ii) 構成系列の indicator id 配列</strong>（D-011 の{" "}
            <code className="font-mono">depends_on</code>{" "}
            フィールドと一致）を明示する。編集物としての著作権は EIC Data に帰属（CC BY 4.0）。元データの著作権・ライセンスは各構成系列のメタデータに従う。
          </p>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            8.5 編集チームへの作法（Internal）
          </h3>
          <ol className="mt-2 list-decimal list-inside space-y-1">
            <li>
              記事の本文中、または末尾に「出典: 機関名（一次）／ EIC Data」の形式で必ず併記する
            </li>
            <li>
              数値を貼った直後に as-of 日付を必ず添える（&quot;2026-03 月次平均&quot;、&quot;2026-04-28 終値&quot; など）
            </li>
            <li>
              派生指標を作るときは、計算式と{" "}
              <code className="font-mono">depends_on</code>{" "}
              配列を Insight 詳細の「読み方」末尾に明示する
            </li>
          </ol>

          <p className="mt-4 text-[12px] text-subink">
            本セクションは Phase B-C の MDX 移植時に独立した{" "}
            <code className="font-mono">/methodology/citation</code>{" "}
            ページに昇格予定。
          </p>
        </MethodologySectionCard>

        <MethodologySectionCard section={sec(9)}>
          <p>
            EIC Data の各系列メタデータには{" "}
            <code className="font-mono">license</code>{" "}
            フィールドがあり、SPDX 標準識別子か EIC Data 独自識別子のいずれかが入る。研究者・ジャーナリスト・実務者が引用・再配布前に判断すべきライセンス読み解きの作法をここに整理する。
          </p>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            9.1 EIC Data のライセンス哲学
          </h3>
          <p className="mt-2">
            「データ調達にお金を使わない／公開情報のみで構築」を方針化し、すべての系列を「再配布可能なライセンス」または「明示された利用規約に従って引用可能」なものに限定している。商用データベンダー契約はせず、機関固有の利用規約（boj-terms / jepx-terms など）も読者が一次出典を確認できるよう{" "}
            <code className="font-mono">license_url</code> +{" "}
            <code className="font-mono">license_notice</code>{" "}
            をメタデータに必ず付与する。
          </p>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            9.2 SPDX 系識別子（国際標準）
          </h3>
          <p className="mt-2">
            SPDX (Software Package Data Exchange) は OSI / Linux Foundation が管理する標準ライセンス識別子。機械可読で、再配布条件が明確。EIC Data で使用するもの:
          </p>
          <SpdxLicenseTable />

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            9.3 独自識別子（機関固有の利用規約）
          </h3>
          <p className="mt-2">
            SPDX に該当しない、機関ごとの独自利用規約を持つ系列のための識別子。{" "}
            <code className="font-mono">license_url</code> +{" "}
            <code className="font-mono">license_notice</code>{" "}
            でその実態を明示する。
          </p>
          <CustomLicenseTable />

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            9.4 引用時の併記必須項目
          </h3>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>SPDX (CC-BY-4.0 / public-domain)</strong>: ライセンス識別子 + 一次出典 URL のみで十分
            </li>
            <li>
              <strong>boj-terms</strong>: 上記 +
              「日本銀行によって保証されたものではありません」の免責文言を必ず併記
            </li>
            <li>
              <strong>jepx-terms / jma-terms / meti-terms / wb-pink-sheet-terms</strong>: 上記 + 「○○（機関名）公表値を EIC Data が加工」の旨を明示
            </li>
          </ul>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            9.5 派生指標（Insight 系）の著作権
          </h3>
          <p className="mt-2">
            複数指標を組み合わせた Insight ページ（例: 日米金利差 × USD/JPY、円建て LNG 算出）の{" "}
            <strong>編集物としての著作権は EIC Data に帰属（CC BY 4.0）</strong>。ただし元データの著作権・ライセンスは各構成系列に従う。引用時は{" "}
            <code className="font-mono">depends_on</code>{" "}
            配列で構成系列を明示し、それぞれのライセンスも併せて列挙する作法が望ましい。
          </p>

          <p className="mt-3 text-[12px] text-subink">
            実装: 各 fetch_*.py が書き出す{" "}
            <code className="font-mono">{"{id}.metadata.json"}</code> の{" "}
            <code className="font-mono">license</code> +{" "}
            <code className="font-mono">license_url</code> +{" "}
            <code className="font-mono">license_notice</code> +{" "}
            <code className="font-mono">depends_on</code>{" "}
            フィールドを、ビルド時に読み込んで指標詳細・Insight 詳細ページに展開。詳細は{" "}
            <Link
              href="/data-quality"
              className="text-sky-700 underline hover:text-sky-800"
            >
              データ品質ダッシュボード
            </Link>
            {" "}から系列別に確認可能。
          </p>
        </MethodologySectionCard>

        <MethodologySectionCard section={sec(10)}>
          <p>
            EIC Data は各系列に 4 つのデータ品質シグナルを付与している。研究者・ジャーナリストが「この系列を今 引用しても大丈夫か」を 5 秒で判断できるよう、それぞれの読み解き方をここで整理する。
          </p>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            10.1 4 つのシグナル
          </h3>
          <QualitySignalsTable />

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            10.2 SLA 違反の 3 パターン（重要）
          </h3>
          <p className="mt-2">
            データ品質ダッシュボードで赤表示される「SLA 違反」は、必ずしも「データ不正取得」を意味しない。3 つのパターンを区別する必要がある:
          </p>
          <div className="mt-3 space-y-3">
            <div className="rounded border border-slate-200 bg-white p-3">
              <div className="text-[12px] font-semibold text-amber-700">
                A 型: 公的機関の公開遅延（仕様）
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-subink">
                METI 電力調査統計（4 ヶ月遅れ確定）、World Bank Pink Sheet（XLSX が PDF より 4〜6 ヶ月遅れ）など、機関側の公開サイクルが SLA より長い場合。
                <strong>パイプラインに非はない</strong>。SLA 値の調整で誤検知を解消（例: fuel 60 → 180 日）。
              </p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-3">
              <div className="text-[12px] font-semibold text-blue-700">
                B 型: 季節データの自然な不在
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-subink">
                JMA 最深積雪 9 地点のうち、関西 / 四国 / 九州は数年に 1 度しか雪が積もらない地点。「データの不在」ではなく「気象現象の不在」。
                <strong>
                  {" "}D-011 v2 で missing_policy: seasonal を導入予定
                </strong>
                。
              </p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-3">
              <div className="text-[12px] font-semibold text-rose-700">
                C 型: 本物のラグ（要対応）
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-subink">
                観測所からの値到着が一時的に遅れる、パイプラインの fetch ロジックバグなど、
                <strong>速やかに調査・修正すべき違反</strong>
                。通常は次回 Nightly Fetch で自動回復。
              </p>
            </div>
          </div>

          <h3 className="mt-5 text-[14px] font-semibold text-slate-900">
            10.3 警告（黄）と違反（赤）の使い分け
          </h3>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>緑 (healthy)</strong>: age ≤ SLA × 0.7、引用に最適
            </li>
            <li>
              <strong>黄 (warning)</strong>: SLA × 0.7 &lt; age ≤ SLA、SLA に近づいている
            </li>
            <li>
              <strong>赤 (violation)</strong>: age &gt; SLA、上記 3 パターンを区別して対応
            </li>
          </ul>

          <p className="mt-3 text-[12px] text-subink">
            詳細は{" "}
            <Link
              href="/data-quality"
              className="text-sky-700 underline hover:text-sky-800"
            >
              データ品質ダッシュボード
            </Link>
            {" "}を参照。本セクションは Phase B-C の MDX 移植時に独立した{" "}
            <code className="font-mono">/methodology/quality-signals</code>{" "}
            ページに昇格予定。
          </p>
        </MethodologySectionCard>
      </div>
    </Container>
  );
}

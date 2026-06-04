/**
 * N11 透明性ダッシュボード /usage-stats (Day 6 PM, 2026-05-17)
 *
 * 「何を集計しているか」を全部見せることが透明性の本質。
 * - 月次 counter (apiReq / csvDl / citeCopy) を表示
 * - 「個人特定情報は収集していない」を太字で明示
 * - /privacy へのリンクで詳細根拠を参照可能
 * - Server Component、JSON API (/api/usage-stats) は別途公開
 */

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { getUsageSnapshot } from "@/lib/usage-stats";

export const metadata: Metadata = {
  title: "利用統計 (透明性ダッシュボード) — EIC Data",
  description:
    "EIC Data が収集している利用統計を全て公開します。個人特定情報は一切収集していません。API リクエスト数 / CSV ダウンロード数 / 引用コピー数のみを月次集計しています。",
};

// 1 分 ISR (counter は in-memory + Lambda 単位なので過剰更新は意味なし)
export const revalidate = 60;

const NUM_FMT = new Intl.NumberFormat("ja-JP");

const BUCKET_META = {
  apiReq: {
    label: "API リクエスト数",
    source: "/api/catalog + /api/indicator/[id] の GET 回数",
    purpose: "公開 API がどの程度活用されているかの把握",
  },
  csvDl: {
    label: "CSV ダウンロード数",
    source: "ダウンロードボタン経由でクライアントから /api/event 報告",
    purpose: "どの系列が研究用途で使われているかの傾向把握",
  },
  citeCopy: {
    label: "引用コピー数",
    source: "引用フォーマットコピーボタン経由でクライアントから /api/event 報告",
    purpose: "学術引用 / 媒体取材での利用度を測る",
  },
} as const;

export default async function UsageStatsPage() {
  const snapshot = getUsageSnapshot();
  return (
    <Container size="wide" className="py-10">
      <header className="mb-8">
        <p className="text-xs text-faint uppercase tracking-wider">
          <Link href="/" className="hover:text-emerald-700">
            ホーム
          </Link>
          {" ／ 利用統計 (透明性)"}
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-ink leading-tight">
          利用統計 (透明性ダッシュボード)
        </h1>
        <p className="mt-3 text-base md:text-lg text-subink leading-relaxed">
          EIC Data が収集している利用統計を <strong className="text-ink">全て公開</strong>{" "}
          します。何を取っているか曖昧な公共データ基盤は信頼できないと考え、
          月次の集計値とその取得経路をここで明示します。
        </p>
        <p className="mt-2 text-xs text-faint">
          表示月: <strong>{snapshot.month}</strong> (Asia/Tokyo)
          ／ 集計開始: {new Date(snapshot.sinceIso).toISOString().slice(0, 19)}Z
          ／ JSON API: <Link href="/api/usage-stats" className="underline text-emerald-700">/api/usage-stats</Link>
        </p>
      </header>

      <section className="prose-section space-y-3">
        <h2 className="mt-6 text-2xl md:text-3xl font-semibold text-ink">
          1. 個人特定情報を取得していないこと
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-base md:text-lg text-subink leading-relaxed">
          <li>
            <strong className="text-ink">IP アドレス・メールアドレス・User-Agent は本ダッシュボードに保持しません</strong>
          </li>
          <li>本ページに掲載するのは「月次の累計回数」のみ</li>
          <li>rate-limit の IP 識別は別系統で揮発、ここの counter には流入しません</li>
          <li>
            詳細根拠は{" "}
            <Link href="/privacy" className="text-emerald-700 underline hover:text-emerald-900">
              プライバシーポリシー
            </Link>{" "}
            を参照
          </li>
        </ul>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          2. 今月の集計値 ({snapshot.month})
        </h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(BUCKET_META) as Array<keyof typeof BUCKET_META>).map((k) => {
            const meta = BUCKET_META[k];
            const value = snapshot.counts[k];
            return (
              <div
                key={k}
                className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="text-xs uppercase tracking-wider text-faint">
                  {meta.label}
                </div>
                <div className="mt-1 text-3xl font-bold text-ink tabular-nums">
                  {NUM_FMT.format(value)}
                </div>
                <div className="mt-2 text-xs text-subink">{meta.source}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          3. 各集計の目的
        </h2>
        <ul className="ml-6 list-disc space-y-2 text-base md:text-lg text-subink leading-relaxed">
          {(Object.keys(BUCKET_META) as Array<keyof typeof BUCKET_META>).map((k) => {
            const meta = BUCKET_META[k];
            return (
              <li key={k}>
                <strong className="text-ink">{meta.label}</strong>: {meta.purpose}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="prose-section space-y-3">
        <h2 className="mt-10 text-2xl md:text-3xl font-semibold text-ink">
          4. 集計方式の制限事項
        </h2>
        <p className="text-base md:text-lg leading-relaxed text-subink">
          現状は in-memory counter で Vercel の各 Lambda インスタンスごとに分離されており、
          数値は{" "}
          <strong className="text-ink">
            「サイトが温まっている間のおおよその下限値」
          </strong>
          として捉えてください。Phase D 第 1 期 (2026-05-20 以降) で Upstash KV に
          移行し、サイト全体の確定値を出せるようにします。それまでの間、persistent
          フラグは <code className="text-xs">false</code> を返します。
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3 text-[12px]">
        <Link href="/privacy" className="text-emerald-700 underline hover:text-emerald-900">
          ← プライバシーポリシーへ戻る
        </Link>
        <Link href="/terms" className="text-emerald-700 underline hover:text-emerald-900">
          利用規約 →
        </Link>
        <Link
          href="/citation-policy"
          className="text-emerald-700 underline hover:text-emerald-900"
        >
          引用規約 →
        </Link>
      </div>
    </Container>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { fetchCatalog } from "@/lib/catalog";
import { INSIGHTS } from "@/lib/insights";

// 新着・全ページ一覧（人間可読サイトマップ）。新 Insight の merge で
// INSIGHTS 配列が増えるとビルド時に自動反映される。1h ごとに再検証して
// 「直近30日」ウィンドウを現在時刻に追随させる。
export const revalidate = 3600;

const SITE_URL = "https://data.eic-jp.org";
const RECENT_DAYS = 30;
const DAY_MS = 86400000;

export const metadata: Metadata = {
  title: "新着・全ページ一覧 — EIC Data",
  description:
    "新しく公開・更新した記事と、サイトの全ページを URL 付きで一覧できる人間可読サイトマップ。新しい Insight の公開で自動更新されます。",
};

// 固定ページ（記事・系列・用語のような可変集合ではない恒常 URL）。
// ラベルはナビ表記に準拠。順序は要望書の列挙どおり。
const FIXED_PAGES: { href: string; label: string }[] = [
  { href: "/", label: "TOP（ホーム）" },
  { href: "/today", label: "朝刊" },
  { href: "/today/archive", label: "朝刊アーカイブ" },
  { href: "/watch", label: "マーケット" },
  { href: "/insight", label: "インサイト一覧" },
  { href: "/insight/map", label: "Insight マップ" },
  { href: "/insight/network", label: "Insight ネットワーク" },
  { href: "/map", label: "9 エリア地図" },
  { href: "/markets", label: "市場" },
  { href: "/catalog", label: "カタログ" },
  { href: "/compare", label: "系列比較" },
  { href: "/playground", label: "データ実験" },
  { href: "/cite", label: "引用ジェネレータ" },
  { href: "/data-quality", label: "データ品質" },
  { href: "/methodology", label: "方法論" },
  { href: "/glossary", label: "用語集" },
  { href: "/search", label: "検索" },
  { href: "/en", label: "English" },
];

function insightUrl(slug: string): string {
  return `${SITE_URL}/insight/${slug}`;
}

// 1 行 =「updated ｜ タイトル ｜ https://…/insight/<slug>」。
// URL はリンクであると同時に文字列としても見せる（コピー用途）。
function InsightRow({
  slug,
  title,
  updated,
}: {
  slug: string;
  title: string;
  updated: string;
}) {
  return (
    <li className="border-b border-slate-100 py-2 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm md:text-base">
        <time
          dateTime={updated}
          className="shrink-0 text-faint tabular-nums"
        >
          {updated}
        </time>
        <span className="text-faint" aria-hidden>
          ｜
        </span>
        <span className="text-ink">{title}</span>
      </div>
      <Link
        href={`/insight/${slug}`}
        className="mt-0.5 block break-all font-mono text-xs text-emerald-700 underline hover:text-emerald-900 md:text-sm"
      >
        {insightUrl(slug)}
      </Link>
    </li>
  );
}

export default async function WhatsNewPage() {
  const catalog = await fetchCatalog();

  // updated 降順（新しい順）。ISO 日付文字列なので辞書順比較で正しく並ぶ。
  const sorted = [...INSIGHTS].sort((a, b) =>
    b.updated.localeCompare(a.updated),
  );

  // 直近 RECENT_DAYS 日以内に updated された記事のみ（今日基準、JST）。
  const now = new Date();
  const recent = sorted.filter((i) => {
    const u = new Date(`${i.updated}T00:00:00+09:00`);
    if (Number.isNaN(u.getTime())) return false;
    return now.getTime() - u.getTime() <= RECENT_DAYS * DAY_MS;
  });

  return (
    <Container size="wide" className="py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wider text-faint">
          ホーム ／ 新着・全ページ一覧
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-ink md:text-3xl">
          新着・全ページ一覧 ／{" "}
          <code className="text-emerald-700">/whats-new</code>
        </h1>
        <p className="mt-3 text-base leading-relaxed text-subink md:text-lg">
          新しい記事とサイトの全ページを、URL付きで一覧できます（記事の追加で自動更新）。
        </p>
      </header>

      {/* b. 新着・更新（直近30日） */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-ink md:text-xl">
          🆕 新着・更新（直近{RECENT_DAYS}日）
        </h2>
        {recent.length === 0 ? (
          <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-subink">
            直近{RECENT_DAYS}日の新着はありません。
          </p>
        ) : (
          <ul className="mt-3">
            {recent.map((i) => (
              <InsightRow
                key={i.slug}
                slug={i.slug}
                title={i.title}
                updated={i.updated}
              />
            ))}
          </ul>
        )}
      </section>

      {/* c. 固定ページ */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-ink md:text-xl">
          📄 固定ページ（{FIXED_PAGES.length}）
        </h2>
        <ul className="mt-3">
          {FIXED_PAGES.map((p) => (
            <li
              key={p.href}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-slate-100 py-2 text-sm last:border-0 md:text-base"
            >
              <span className="text-ink">{p.label}</span>
              <span className="text-faint" aria-hidden>
                ｜
              </span>
              <Link
                href={p.href}
                className="break-all font-mono text-xs text-emerald-700 underline hover:text-emerald-900 md:text-sm"
              >
                {`${SITE_URL}${p.href}`}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* d. Insight 全記事 */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-ink md:text-xl">
          📚 Insight 全記事（{INSIGHTS.length}本）
        </h2>
        <ul className="mt-3">
          {sorted.map((i) => (
            <InsightRow
              key={i.slug}
              slug={i.slug}
              title={i.title}
              updated={i.updated}
            />
          ))}
        </ul>
      </section>

      {/* e. このほかの個別URL */}
      <section>
        <h2 className="text-lg font-semibold text-ink md:text-xl">
          🗂 このほかの個別URL
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-subink md:text-base">
          系列ページ（
          <strong className="text-ink tabular-nums">
            {catalog.indicator_count}
          </strong>
          本）は{" "}
          <Link
            href="/catalog"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            /catalog
          </Link>{" "}
          から、用語ページは{" "}
          <Link
            href="/glossary"
            className="text-emerald-700 underline hover:text-emerald-900"
          >
            /glossary
          </Link>{" "}
          から。機械可読の全URLは{" "}
          <a
            href="/sitemap.xml"
            className="font-mono text-emerald-700 underline hover:text-emerald-900"
          >
            /sitemap.xml
          </a>
          。
        </p>
      </section>
    </Container>
  );
}

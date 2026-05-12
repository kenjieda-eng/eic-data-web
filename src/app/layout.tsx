import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import MobileNav from "@/components/MobileNav";
import { fetchCatalog } from "@/lib/catalog";
import "./globals.css";

const SITE_URL = "https://data.eic-jp.org";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const GSC_VERIFICATION = "fO91QoZppqZzi-hvqHuPm5m_Cjdb5Lh4gmpAnynN_8c";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-jp",
  // optional: font-display: optional で FOUT 由来の CLS を排除。
  // 読み込みが遅い場合は OS 標準和文フォント (Hiragino / Yu Gothic / Meiryo) を使用。
  display: "optional",
  weight: ["400", "500", "700"],
});

const NAV_ITEMS = [
  { href: "/", label: "TOP" },
  { href: "/today", label: "朝刊" },
  { href: "/insight", label: "インサイト" },
  { href: "/insight/map", label: "マップ" },
  { href: "/catalog", label: "カタログ" },
  { href: "/data-quality", label: "データ品質" },
  { href: "/methodology", label: "方法論" },
  { href: "/glossary", label: "用語集" },
  { href: "/search", label: "検索" },
];

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await fetchCatalog();
  const title = "EIC Data — 日本のエネルギーと金融の引用インフラ";
  const description =
    "一般社団法人エネルギー情報センターが運営する、エネルギー・金融・マクロ経済の引用可能データ基盤。";
  return {
    metadataBase: new URL("https://data.eic-jp.org"),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "EIC Data",
      locale: "ja_JP",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    other: {
      "data-catalog-version": String(catalog.version),
      "data-catalog-schema": catalog.schema,
      "data-catalog-generated-at": catalog.generated_at,
      "data-indicator-count": String(catalog.indicator_count),
      "google-site-verification": GSC_VERIFICATION,
    },
  };
}

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EIC Data",
  url: SITE_URL,
  inLanguage: "ja",
  description:
    "一般社団法人エネルギー情報センターが運営する、エネルギー・金融・マクロ経済の引用可能データ基盤。",
  publisher: {
    "@type": "Organization",
    name: "一般社団法人エネルギー情報センター",
    url: "https://eic-jp.org/",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const revalidate = 86400;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const catalog = await fetchCatalog();

  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJp.variable}`}
    >
      <body className="bg-slate-50 text-slate-800 antialiased font-sans">
        {/* WebSite JSON-LD (構造化データ、サイト全体) */}
        <Script
          id="schema-website"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        {/* Google Analytics 4 (gtag.js) — production + GA_MEASUREMENT_ID 設定時のみ発火 */}
        {IS_PRODUCTION && GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', {
  anonymize_ip: true,
  send_page_view: true
});
`,
              }}
            />
          </>
        )}
        <header className="relative border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl md:max-w-5xl lg:max-w-7xl xl:max-w-[1320px] px-4 py-4 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-xl font-semibold text-emerald-700"
            >
              EIC Data
            </Link>
            <nav
              aria-label="グローバルナビ"
              className="hidden md:flex flex-wrap gap-4 text-sm"
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-slate-700 transition-colors hover:text-emerald-700 focus-visible:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <MobileNav items={NAV_ITEMS} />
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl md:max-w-5xl lg:max-w-7xl xl:max-w-[1320px] px-4 py-6 text-xs text-slate-500 space-y-1">
            <p>
              © 2026 一般社団法人エネルギー情報センター ／ CC BY 4.0 ／ catalog:{" "}
              {catalog.indicator_count} 系列
            </p>
            <p>
              schema {catalog.schema} ／ generated {catalog.generated_at}
            </p>
            <p className="space-x-2">
              <a
                href="https://eic-jp.org/"
                className="underline hover:text-emerald-700"
              >
                EIC 本体サイト
              </a>
              <span aria-hidden>／</span>
              <a
                href="https://pps-net.org/"
                className="underline hover:text-emerald-700"
              >
                姉妹: 新電力ネット
              </a>
              <span aria-hidden>／</span>
              <a
                href="https://github.com/kenjieda-eng/eic-data-pipeline"
                className="underline hover:text-emerald-700"
              >
                eic-data-pipeline
              </a>
              <span aria-hidden>／</span>
              <Link
                href="/privacy"
                className="underline hover:text-emerald-700"
              >
                プライバシーポリシー
              </Link>
              <span aria-hidden>／</span>
              <Link
                href="/terms"
                className="underline hover:text-emerald-700"
              >
                利用規約
              </Link>
              <span aria-hidden>／</span>
              <Link
                href="/citation-policy"
                className="underline hover:text-emerald-700"
              >
                引用規約
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

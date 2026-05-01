import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EIC Data — 日本のエネルギーと金融の引用インフラ",
  description:
    "一般社団法人エネルギー情報センターが運営する、エネルギー・金融・マクロ経済の引用可能データ基盤。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-800 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <h1 className="text-xl font-semibold text-emerald-700">EIC Data</h1>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500">
            © 2026 一般社団法人エネルギー情報センター ／ CC BY 4.0
          </div>
        </footer>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import InsightBreadcrumb from "@/components/InsightBreadcrumb";

/**
 * /insight 配下の共通レイアウト (SEO T2-2)
 *
 * Server Component。記事ページにだけパンくず + BreadcrumbList 構造化データを足す。
 * InsightBreadcrumb は slug が INSIGHTS に無いページ (一覧 /insight・/insight/map 等) では
 * null を返すため、それ以外の既存表示には一切影響しない。MDX は編集しない。
 */
export default function InsightLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <InsightBreadcrumb />
      {children}
    </>
  );
}

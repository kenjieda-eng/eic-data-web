/**
 * NewsletterSubscribeBox — N5 購読フォームの配置可能な wrapper
 *
 * Phase C Day 5 午後第 3 弾 (2026-05-16) で実装。
 * - TOP page (utmSource="top-hero")
 * - Insight 末尾 (utmSource="insight-footer", InsightNav の隣)
 * - その他 (任意の utm パラメータで再配置可能)
 *
 * 中身は src/components/NewsletterForm.tsx (午後タスク 3 で実装) を再利用、
 * UTM パラメータ + コピー文言の差し替えのみ。
 */

import NewsletterForm from "./NewsletterForm";

export interface NewsletterSubscribeBoxProps {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  /** 上部の見出しキャッチ (省略時は標準コピー) */
  heading?: string;
  /** サブテキスト (省略時は標準コピー) */
  subtext?: string;
}

export default function NewsletterSubscribeBox({
  utmSource = "top-hero",
  utmMedium = "web",
  utmCampaign = "weekly-newsletter",
  heading,
  subtext,
}: NewsletterSubscribeBoxProps) {
  return (
    <section
      aria-labelledby="newsletter-subscribe-heading"
      className="mt-12 rounded-md border border-emerald-100 bg-emerald-50/30 p-5"
    >
      {heading && (
        <h2
          id="newsletter-subscribe-heading"
          className="mb-1 text-lg font-semibold text-ink"
        >
          {heading}
        </h2>
      )}
      {subtext && (
        <p className="mb-3 text-sm text-subink">{subtext}</p>
      )}
      <NewsletterForm
        utmSource={utmSource}
        utmMedium={utmMedium}
        utmCampaign={utmCampaign}
      />
    </section>
  );
}

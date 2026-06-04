import type { MetadataRoute } from "next";
import { DOMAINS_DAY8 } from "./domain/data";
import { GLOSSARY_TERMS } from "./glossary/data";
import { fetchCatalog } from "@/lib/catalog";
import { INSIGHTS } from "@/lib/insights";
import { listMorningSummaryDates } from "@/lib/morning-summary";

const SITE_URL = "https://data.eic-jp.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const catalog = await fetchCatalog();
  const morningDates = listMorningSummaryDates();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/today`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE_URL}/watch`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/insight`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/insight/map`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/insight/network`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/markets`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${SITE_URL}/markets/balancing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/playground`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${SITE_URL}/data-quality`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/citation-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/usage-stats`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
    { url: `${SITE_URL}/cite`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/map`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${SITE_URL}/today/archive`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/editorial-calendar`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/pipeline-status`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
  ];

  const insightPages: MetadataRoute.Sitemap = INSIGHTS.map((i) => ({
    url: `${SITE_URL}/insight/${i.slug}`,
    lastModified: i.updated ? new Date(i.updated) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const catalogPages: MetadataRoute.Sitemap = catalog.indicators.map((ind) => ({
    url: `${SITE_URL}/catalog/${ind.id}`,
    lastModified: ind.updated_at ? new Date(ind.updated_at) : now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // SEO (2026-06-04): /embed/<id> は各ページに robots index:false (noindex) が
  // 入っているため sitemap から除外する。noindex ページを sitemap に載せず、
  // crawl budget を catalog / insight 本体へ集中させる (N8 の方針を更新)。

  const domainPages: MetadataRoute.Sitemap = DOMAINS_DAY8.map((d) => ({
    url: `${SITE_URL}/domain/${d.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const glossaryPages: MetadataRoute.Sitemap = GLOSSARY_TERMS.map((t) => ({
    url: `${SITE_URL}/glossary/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const todayPages: MetadataRoute.Sitemap = morningDates.map((d) => ({
    url: `${SITE_URL}/today/${d}`,
    lastModified: new Date(d),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...fixed,
    ...insightPages,
    ...catalogPages,
    ...domainPages,
    ...glossaryPages,
    ...todayPages,
  ];
}

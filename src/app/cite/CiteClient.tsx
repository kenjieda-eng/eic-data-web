"use client";

import { useDeferredValue, useMemo, useState } from "react";
import CitationButton from "@/components/CitationButton";
import {
  domainOf,
  type Indicator,
} from "@/lib/catalog";
import {
  bibFilename,
  CITE_GALLERY,
  filterIndicatorsForCite,
  LICENSE_TYPE_LABELS,
  SITE_CITATION,
  type CiteFilters,
  type LicenseType,
} from "@/lib/cite-helpers";
import {
  CITATION_FORMAT_LABELS,
  generateCitation,
  type CitationFormat,
  type CitationInput,
} from "@/lib/citation-formatter";
import { type Insight, searchInsights } from "@/lib/insights";

type Mode = "indicator" | "insight" | "site";

const MAX_VISIBLE_RESULTS = 50;

const MODE_LABELS: Record<Mode, { emoji: string; label: string; hint: string }> = {
  indicator: {
    emoji: "📊",
    label: "個別系列引用",
    hint: "catalog から選択",
  },
  insight: {
    emoji: "📝",
    label: "Insight 個別引用",
    hint: "INSIGHTS 41 本",
  },
  site: {
    emoji: "🌐",
    label: "サイト全体引用",
    hint: "EIC Data 全体",
  },
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "日次",
  weekly: "週次",
  monthly: "月次",
  quarterly: "四半期",
  annual: "年次",
  unknown: "不明",
};

function downloadCitationFile(citation: CitationInput, format: CitationFormat) {
  if (typeof window === "undefined") return;
  const text = generateCitation(citation, format);
  const filename = bibFilename(citation.slug, format);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DownloadBibButton({
  citation,
  format,
}: {
  citation: CitationInput;
  format: CitationFormat;
}) {
  const ext = format === "bibtex" ? ".bib" : ".txt";
  return (
    <button
      type="button"
      onClick={() => downloadCitationFile(citation, format)}
      className="inline-flex items-center gap-1 rounded-md border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
    >
      📥 {bibFilename(citation.slug, format)} ({ext}) DL
    </button>
  );
}

function CitationPane({
  citation,
}: {
  citation: CitationInput;
}) {
  return (
    <div className="space-y-3">
      <CitationButton citation={citation} />
      <div
        className="rounded-md border border-slate-200 bg-slate-50 p-3"
        aria-label="ダウンロード"
      >
        <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
          ファイルダウンロード
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DownloadBibButton citation={citation} format="bibtex" />
          <DownloadBibButton citation={citation} format="chicago" />
          <DownloadBibButton citation={citation} format="apa" />
        </div>
        <p className="mt-2 text-[11px] text-faint">
          BibTeX は <code>.bib</code> として LaTeX に直接インクルード可、
          Chicago / APA は参考用に <code>.txt</code> でダウンロード。
        </p>
      </div>
    </div>
  );
}

const CHIP =
  "inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full border border-slate-200 bg-white text-subink hover:border-emerald-500 hover:text-emerald-700 transition-colors";
const CHIP_ACTIVE =
  "inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full border border-emerald-500 bg-emerald-50 text-emerald-700";

function FilterChip({
  active,
  label,
  count,
  onToggle,
}: {
  active: boolean;
  label: string;
  count?: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={active ? CHIP_ACTIVE : CHIP}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="tabular-nums text-faint">{count}</span>
      )}
    </button>
  );
}

function IndicatorMode({
  indicators,
}: {
  indicators: Indicator[];
}) {
  const [filters, setFilters] = useState<CiteFilters>({
    query: "",
    domain: null,
    frequency: null,
    licenseType: null,
  });
  const deferredQuery = useDeferredValue(filters.query);
  const [selectedId, setSelectedId] = useState<string>(
    indicators[0]?.id ?? "",
  );

  const domainCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of indicators) m.set(i.domain, (m.get(i.domain) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [indicators]);

  const frequencyCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of indicators) {
      const k = i.frequency || "unknown";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [indicators]);

  const filtered = useMemo(
    () =>
      filterIndicatorsForCite(indicators, {
        ...filters,
        query: deferredQuery,
      }),
    [indicators, filters, deferredQuery],
  );

  const visible = filtered.slice(0, MAX_VISIBLE_RESULTS);
  const selected =
    indicators.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  const citation: CitationInput | null = selected
    ? {
        slug: selected.id,
        title: selected.name,
        kind: "indicator",
        sourceName: selected.source_name,
        sourceUrl: selected.source_url,
        license: selected.license,
      }
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="sr-only">系列を検索</span>
          <input
            type="search"
            value={filters.query}
            onChange={(e) =>
              setFilters((f) => ({ ...f, query: e.target.value }))
            }
            placeholder="id または名称で検索 (例: jepx, lng, 気温)"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-ink placeholder:text-faint focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            autoComplete="off"
          />
        </label>

        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            ドメイン
          </div>
          <div className="flex flex-wrap gap-2">
            {domainCounts.map(([d, count]) => {
              const meta = domainOf(d);
              return (
                <FilterChip
                  key={d}
                  active={filters.domain === d}
                  label={`${meta.emoji} ${meta.ja}`}
                  count={count}
                  onToggle={() =>
                    setFilters((f) => ({
                      ...f,
                      domain: f.domain === d ? null : d,
                    }))
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            頻度
          </div>
          <div className="flex flex-wrap gap-2">
            {frequencyCounts.map(([f, count]) => (
              <FilterChip
                key={f}
                active={filters.frequency === f}
                label={FREQUENCY_LABELS[f] ?? f}
                count={count}
                onToggle={() =>
                  setFilters((prev) => ({
                    ...prev,
                    frequency: prev.frequency === f ? null : f,
                  }))
                }
              />
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            ライセンス
          </div>
          <div className="flex flex-wrap gap-2">
            {(["spdx", "custom"] as LicenseType[]).map((lt) => (
              <FilterChip
                key={lt}
                active={filters.licenseType === lt}
                label={LICENSE_TYPE_LABELS[lt]}
                onToggle={() =>
                  setFilters((prev) => ({
                    ...prev,
                    licenseType: prev.licenseType === lt ? null : lt,
                  }))
                }
              />
            ))}
          </div>
        </div>

        <div className="mt-3 text-[12px] text-faint">
          表示中: <span className="tabular-nums text-ink">{visible.length}</span>{" "}
          / <span className="tabular-nums text-ink">{filtered.length}</span>{" "}
          (catalog 全{" "}
          <span className="tabular-nums text-ink">{indicators.length}</span> 系列)
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ul
          className="max-h-[28rem] overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100"
          aria-label="catalog 系列リスト"
        >
          {visible.length === 0 ? (
            <li className="p-4 text-sm text-subink">
              該当する系列がありません。フィルタを緩めてください。
            </li>
          ) : (
            visible.map((ind) => {
              const meta = domainOf(ind.domain);
              const active = ind.id === selected?.id;
              return (
                <li key={ind.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ind.id)}
                    aria-pressed={active}
                    className={`w-full text-left px-3 py-2 transition ${
                      active
                        ? "bg-emerald-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink truncate">
                        {ind.name}
                      </span>
                      <span className="text-[10px] text-faint">
                        {meta.emoji}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-faint font-mono truncate">
                      {ind.id}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div>
          {citation ? (
            <CitationPane citation={citation} />
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-subink">
              リストから系列を選択してください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightMode({
  insights,
}: {
  insights: Insight[];
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    insights[0]?.slug ?? "",
  );

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of insights) {
      for (const t of i.tags) m.set(t, (m.get(t) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [insights]);

  const filtered = useMemo(() => {
    const byQuery = searchInsights(insights, deferredQuery);
    if (!tag) return byQuery;
    return byQuery.filter((i) => i.tags.includes(tag));
  }, [insights, deferredQuery, tag]);

  const visible = filtered.slice(0, MAX_VISIBLE_RESULTS);
  const selected =
    insights.find((i) => i.slug === selectedSlug) ?? filtered[0] ?? null;

  const citation: CitationInput | null = selected
    ? {
        slug: selected.slug,
        title: selected.title,
        kind: "insight",
      }
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="sr-only">Insight を検索</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル / lede / タグ で検索 (例: 気温, LNG, USD/JPY)"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-ink placeholder:text-faint focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            autoComplete="off"
          />
        </label>

        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            タグ
          </div>
          <div className="flex flex-wrap gap-2">
            {tagCounts.slice(0, 24).map(([t, count]) => (
              <FilterChip
                key={t}
                active={tag === t}
                label={t}
                count={count}
                onToggle={() => setTag((prev) => (prev === t ? null : t))}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 text-[12px] text-faint">
          表示中: <span className="tabular-nums text-ink">{visible.length}</span>{" "}
          / <span className="tabular-nums text-ink">{filtered.length}</span>{" "}
          (Insight 全{" "}
          <span className="tabular-nums text-ink">{insights.length}</span> 本)
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ul
          className="max-h-[28rem] overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100"
          aria-label="Insight リスト"
        >
          {visible.length === 0 ? (
            <li className="p-4 text-sm text-subink">
              該当する Insight がありません。
            </li>
          ) : (
            visible.map((it) => {
              const active = it.slug === selected?.slug;
              return (
                <li key={it.slug}>
                  <button
                    type="button"
                    onClick={() => setSelectedSlug(it.slug)}
                    aria-pressed={active}
                    className={`w-full text-left px-3 py-2 transition ${
                      active
                        ? "bg-emerald-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-medium text-ink">
                      {it.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-faint font-mono truncate">
                      {it.slug}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div>
          {citation ? (
            <CitationPane citation={citation} />
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-subink">
              リストから Insight を選択してください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SiteMode() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-4">
        <h3 className="text-base md:text-lg font-semibold text-ink">
          🌐 EIC Data 全体を引用
        </h3>
        <p className="mt-2 text-sm md:text-base text-subink leading-relaxed">
          特定の系列や Insight ではなく、EIC Data という引用インフラ自体を
          参照する場合の固定フォーマット。slug:{" "}
          <code>{SITE_CITATION.slug}</code>、title:「
          {SITE_CITATION.title}」。
        </p>
      </div>
      <CitationPane citation={SITE_CITATION} />
    </div>
  );
}

function ModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <div role="tablist" aria-label="引用モード切替" className="flex flex-wrap gap-2">
      {(Object.keys(MODE_LABELS) as Mode[]).map((m) => {
        const selected = m === mode;
        const meta = MODE_LABELS[m];
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => setMode(m)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              selected
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 bg-white text-subink hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            <span aria-hidden className="mr-1">
              {meta.emoji}
            </span>
            {meta.label}
            <span
              className={`ml-2 text-[11px] ${
                selected ? "text-emerald-50" : "text-faint"
              }`}
            >
              {meta.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CiteGallery() {
  return (
    <section
      aria-label="引用例ギャラリー"
      className="mt-10 rounded-md border border-slate-200 bg-white p-4 md:p-6"
    >
      <h2 className="text-lg md:text-xl font-semibold text-ink">
        🖼️ 引用例ギャラリー
      </h2>
      <p className="mt-1 text-sm text-subink">
        執筆媒体ごとの使い分け例 (3 件)。タブ切替の参考に。
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {CITE_GALLERY.map((g) => (
          <article
            key={g.id}
            className="rounded-md border border-slate-200 bg-slate-50 p-4"
          >
            <div className="text-[11px] uppercase tracking-wider text-faint">
              {CITATION_FORMAT_LABELS[g.format]}
            </div>
            <h3 className="mt-1 text-base font-semibold text-ink">
              {g.scene}
            </h3>
            <p className="mt-0.5 text-xs text-subink">対象: {g.audience}</p>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-white border border-slate-200 p-2 text-[11px] md:text-xs text-ink font-mono">
              {g.sample}
            </pre>
            <p className="mt-2 text-[11px] text-subink leading-relaxed">
              {g.note}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function CiteClient({
  indicators,
  insights,
}: {
  indicators: Indicator[];
  insights: Insight[];
}) {
  const [mode, setMode] = useState<Mode>("indicator");

  return (
    <div className="space-y-6">
      <ModeToggle mode={mode} setMode={setMode} />

      <div>
        {mode === "indicator" && <IndicatorMode indicators={indicators} />}
        {mode === "insight" && <InsightMode insights={insights} />}
        {mode === "site" && <SiteMode />}
      </div>

      <CiteGallery />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  SEARCH_CATEGORY_LABELS,
  type SearchEntry,
  type SearchCategory,
  searchEntries,
  type SearchIndex,
} from "@/lib/search-index";

type TabKey = SearchCategory | "all";

const TAB_ORDER: TabKey[] = ["all", "indicator", "insight", "glossary"];

const CATEGORY_STYLES: Record<SearchCategory, string> = {
  indicator: "bg-emerald-50 text-emerald-700 border-emerald-200",
  insight: "bg-amber-50 text-amber-700 border-amber-200",
  glossary: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function SearchClient({ index }: { index: SearchIndex }) {
  const router = useRouter();
  const params = useSearchParams();

  const initialQuery = params.get("q") ?? "";
  const initialCategory = (params.get("category") as TabKey | null) ?? "all";

  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<TabKey>(
    TAB_ORDER.includes(initialCategory) ? initialCategory : "all",
  );

  const fullResult = useMemo(
    () => searchEntries(index, { query, category: null }),
    [index, query],
  );

  const visibleEntries = useMemo(() => {
    if (tab === "all") return fullResult.entries;
    return fullResult.entries.filter((e) => e.category === tab);
  }, [fullResult.entries, tab]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (tab !== "all") next.set("category", tab);
    router.replace(`/search${next.toString() ? `?${next.toString()}` : ""}`);
  }

  function selectTab(t: TabKey) {
    setTab(t);
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (t !== "all") next.set("category", t);
    router.replace(`/search${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label htmlFor="search-q" className="sr-only">
          検索キーワード
        </label>
        <input
          id="search-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="気温 / LNG / JEPX / CPI / FIT など..."
          autoComplete="off"
          className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-base md:text-lg text-ink shadow-sm focus:border-emerald-500 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-500"
        />
        <button
          type="submit"
          className="rounded-md bg-emerald-700 px-5 py-2 text-base font-medium text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          検索
        </button>
      </form>

      <div role="tablist" aria-label="カテゴリ" className="mt-6 flex flex-wrap gap-2">
        {TAB_ORDER.map((t) => {
          const count = fullResult.counts[t];
          const selected = t === tab;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(t)}
              className={`rounded-full border px-3 py-1 text-sm transition tabular-nums ${
                selected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-slate-300 bg-white text-subink hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {SEARCH_CATEGORY_LABELS[t]}{" "}
              <span className="ml-1 text-xs text-faint">{count}</span>
            </button>
          );
        })}
      </div>

      {visibleEntries.length === 0 ? (
        <div className="mt-10 rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-base text-subink">
          {query ? (
            <>
              「<span className="font-semibold text-ink">{query}</span>」に一致する項目はありませんでした。
              別のキーワードでお試しください。
            </>
          ) : (
            <>キーワードを入力すると、169 件のメタデータインデックスから横断検索できます。</>
          )}
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {visibleEntries.map((entry) => (
            <SearchResultRow key={`${entry.category}-${entry.id}`} entry={entry} query={query} />
          ))}
        </ul>
      )}

      {fullResult.truncated && (
        <p className="mt-3 text-xs text-faint">
          検索結果が多いため最初の 200 件のみ表示しています。キーワードで絞り込んでください。
        </p>
      )}
    </div>
  );
}

function SearchResultRow({ entry, query }: { entry: SearchEntry; query: string }) {
  return (
    <li className="px-4 py-4 transition hover:bg-emerald-50/40">
      <Link
        href={entry.url}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded border px-1.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[entry.category]}`}
          >
            {SEARCH_CATEGORY_LABELS[entry.category]}
          </span>
          <span className="text-base font-semibold text-ink">
            <HighlightedText text={entry.title} query={query} />
          </span>
          {entry.meta && (
            <span className="text-xs text-faint">／ {entry.meta}</span>
          )}
        </div>
        <p className="mt-1 text-sm md:text-base text-subink leading-relaxed">
          <HighlightedText text={entry.description} query={query} />
        </p>
        <p className="mt-1 text-xs text-faint">{entry.url}</p>
      </Link>
    </li>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const target = q.toLowerCase();
  const idx = lower.indexOf(target);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 px-0.5 text-ink">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

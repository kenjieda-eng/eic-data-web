"use client";

import { useMemo, useState } from "react";
import {
  CITATION_FORMAT_LABELS,
  type CitationFormat,
  type CitationInput,
  generateCitation,
} from "@/lib/citation-formatter";

const TAB_ORDER: CitationFormat[] = ["bibtex", "chicago", "apa"];

export default function CitationButton({
  citation,
  className = "",
}: {
  citation: CitationInput;
  className?: string;
}) {
  const [tab, setTab] = useState<CitationFormat>("bibtex");
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => generateCitation(citation, tab), [citation, tab]);

  async function handleCopy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // legacy fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      aria-label="引用フォーマット"
      className={`rounded-md border border-slate-200 bg-white p-4 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base md:text-lg font-semibold text-ink">
          📋 引用形式コピー
        </h3>
        <span className="text-xs text-faint">
          License: CC BY 4.0 ／ accessed_at は自動補完
        </span>
      </div>

      <div role="tablist" aria-label="引用フォーマット切替" className="mt-3 flex flex-wrap gap-2">
        {TAB_ORDER.map((t) => {
          const selected = t === tab;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                selected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-slate-300 bg-white text-subink hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {CITATION_FORMAT_LABELS[t]}
            </button>
          );
        })}
      </div>

      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-100 p-3 text-xs md:text-sm text-ink font-mono">
        {text}
      </pre>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          {copied ? "✓ コピーしました" : `${CITATION_FORMAT_LABELS[tab]} をコピー`}
        </button>
        <span className="text-xs text-faint">
          学術引用 + 媒体取材の出典として使用可。一次出典 (
          {citation.sourceName ? citation.sourceName : "本サイト"}) も併記推奨。
        </span>
      </div>
    </section>
  );
}

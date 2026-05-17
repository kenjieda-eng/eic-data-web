"use client";

import { useMemo, useState } from "react";

/**
 * N8 (Day 6, 2026-05-17): catalog 個別ページに置く「埋め込みコードコピー」UI。
 * 業界フロント (bess-net / pps-net 等) が iframe スニペットを 1 クリックで取得できる。
 *
 * - 表示は <details> で隠す (ページの主目的ではないので畳む)
 * - サイズプリセット (400x300 / 600x320) + プレビュー iframe
 * - <textarea readonly> + クリップボード API
 */
export default function EmbedCodeCopy({ indicatorId }: { indicatorId: string }) {
  const [size, setSize] = useState<"sm" | "md">("sm");
  const [copied, setCopied] = useState(false);
  const { width, height } = size === "sm" ? { width: 400, height: 300 } : { width: 600, height: 320 };

  const snippet = useMemo(
    () =>
      `<iframe src="https://data.eic-jp.org/embed/${indicatorId}" width="${width}" height="${height}" frameborder="0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="EIC Data: ${indicatorId}"></iframe>`,
    [indicatorId, width, height],
  );

  async function handleCopy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
      } else {
        const ta = document.createElement("textarea");
        ta.value = snippet;
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
    <details className="rounded-md border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-base md:text-lg font-semibold text-ink">
        🔗 自サイトに埋め込む (iframe)
      </summary>
      <div className="mt-3 space-y-3">
        <div role="radiogroup" aria-label="サイズ選択" className="flex flex-wrap gap-2">
          {(["sm", "md"] as const).map((s) => {
            const selected = s === size;
            const label = s === "sm" ? "コンパクト 400×300" : "標準 600×320";
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSize(s)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  selected
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-300 bg-white text-subink hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <textarea
          readOnly
          value={snippet}
          aria-label="埋め込みコード"
          className="w-full resize-none rounded bg-slate-100 p-3 font-mono text-xs text-ink"
          rows={3}
          onFocus={(e) => e.currentTarget.select()}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {copied ? "✓ コピーしました" : "コードをコピー"}
          </button>
          <span className="text-xs text-faint">
            License: CC BY 4.0 ／ 出典クレジット内蔵
          </span>
        </div>

        <div className="rounded border border-slate-200 bg-slate-50 p-2">
          <div className="mb-1 text-[11px] text-faint">プレビュー:</div>
          <iframe
            src={`/embed/${indicatorId}`}
            width={width}
            height={height}
            loading="lazy"
            title={`EIC Data embed preview: ${indicatorId}`}
            style={{ border: 0, maxWidth: "100%" }}
          />
        </div>
      </div>
    </details>
  );
}

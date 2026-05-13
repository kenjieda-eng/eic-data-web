"use client";

import { useEffect, useRef } from "react";

/**
 * Utterances コメント埋め込み (https://utteranc.es/) — Day 6 (5/13)
 *
 * GitHub Issues 連動の無料 OSS コメントシステム。Insight 詳細ページ末尾に配置し、
 * リーダー ⇔ エディトリアルの双方向対話を実現する。
 *
 * 設定:
 *   repo: kenjieda-eng/eic-data-web
 *   issue-term: pathname (URL path をキーに 1 ページ 1 Issue 自動作成)
 *   label: comment (Issues 一覧で識別)
 *   theme: github-light (本サイトの白基調と整合)
 *
 * EDA さん事前作業: Utterances GitHub App install (L-024 #13 規律、リン側で 7 ステップ手順案内)
 */

export interface UtterancesCommentsProps {
  repo?: string;
  issueTerm?: "pathname" | "url" | "title" | "og:title";
  label?: string;
  theme?:
    | "github-light"
    | "github-dark"
    | "preferred-color-scheme"
    | "github-dark-orange"
    | "icy-dark"
    | "dark-blue"
    | "photon-dark"
    | "boxy-light"
    | "gruvbox-dark";
  className?: string;
}

const DEFAULTS = {
  repo: "kenjieda-eng/eic-data-web",
  issueTerm: "pathname" as const,
  label: "comment",
  theme: "github-light" as const,
};

export default function UtterancesComments({
  repo = DEFAULTS.repo,
  issueTerm = DEFAULTS.issueTerm,
  label = DEFAULTS.label,
  theme = DEFAULTS.theme,
  className = "",
}: UtterancesCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 既存の script / iframe があれば一旦掃除 (re-render 時の重複防止)
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("repo", repo);
    script.setAttribute("issue-term", issueTerm);
    script.setAttribute("label", label);
    script.setAttribute("theme", theme);

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [repo, issueTerm, label, theme]);

  return (
    <section
      aria-label="リーダーコメント (Utterances 連動)"
      className={`mt-10 ${className}`.trim()}
    >
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base md:text-lg font-semibold text-ink">
            💬 リーダーコメント
          </h3>
          <span className="text-[11px] text-faint">
            GitHub Issues 連動 (
            <a
              href={`https://github.com/${repo}/issues?q=is:issue+label:${label}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900"
            >
              全コメント一覧
            </a>
            )
          </span>
        </div>
        <p className="mt-1 text-xs text-faint leading-relaxed">
          コメント投稿には GitHub アカウントが必要。投稿は{" "}
          <code>{repo}</code> リポジトリの Issue (label:{" "}
          <code>{label}</code>) として保存され、誰でも閲覧できます。
        </p>
        <div
          ref={containerRef}
          className="mt-3 min-h-[80px]"
          aria-live="polite"
          aria-busy="true"
        >
          {/* Utterances script がここに iframe を inject */}
          <p className="text-xs text-faint">コメント欄を読み込み中…</p>
        </div>
      </div>
    </section>
  );
}

/** テスト・他コンポーネントから参照可能な script 属性ビルダー */
export function buildUtterancesScriptAttrs(
  props: UtterancesCommentsProps = {},
): Record<string, string> {
  return {
    src: "https://utteranc.es/client.js",
    repo: props.repo ?? DEFAULTS.repo,
    "issue-term": props.issueTerm ?? DEFAULTS.issueTerm,
    label: props.label ?? DEFAULTS.label,
    theme: props.theme ?? DEFAULTS.theme,
    crossorigin: "anonymous",
    async: "true",
  };
}

export const UTTERANCES_DEFAULTS = DEFAULTS;

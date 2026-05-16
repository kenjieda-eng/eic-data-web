/**
 * /pipeline-status — N2 パイプライン稼働ダッシュボード
 *
 * Phase C Day 5 午後第 3 弾 (2026-05-16) で実装。
 * - eic-data-pipeline (kenjieda-eng/eic-data-pipeline) の GitHub Actions 実行履歴を表示
 * - 過去 30 件の workflow run、success/failure + 所要時間 + workflow 名
 * - ISR 1h (revalidate = 3600)、認証なし public API (rate limit 60/h で十分)
 *
 * GitHub Actions API:
 *   GET https://api.github.com/repos/kenjieda-eng/eic-data-pipeline/actions/runs?per_page=30
 *   → workflow_runs[]: { id, name, conclusion, created_at, updated_at, html_url, ... }
 */

import Container from "@/components/Container";

export const revalidate = 3600;

export const metadata = {
  title: "パイプライン稼働状況 | EIC Data",
  description:
    "eic-data-pipeline (Nightly Fetch) の GitHub Actions 実行履歴ダッシュボード。過去 30 件の workflow run 結果と所要時間を可視化、データ更新の透明性を担保。",
};

interface WorkflowRun {
  id: number;
  name: string | null;
  display_title?: string;
  conclusion: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_started_at?: string;
}

interface RunsResponse {
  workflow_runs: WorkflowRun[];
}

async function fetchRuns(): Promise<{ runs: WorkflowRun[]; error?: string }> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/kenjieda-eng/eic-data-pipeline/actions/runs?per_page=30",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) {
      return { runs: [], error: `GitHub API HTTP ${res.status}` };
    }
    const data = (await res.json()) as RunsResponse;
    return { runs: data.workflow_runs ?? [] };
  } catch (e) {
    return { runs: [], error: e instanceof Error ? e.message : String(e) };
  }
}

function durationSeconds(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
}

function formatDuration(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}m ${ss}s`;
}

function conclusionBadge(c: string | null): { label: string; className: string } {
  if (c === "success") {
    return {
      label: "✓ success",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  }
  if (c === "failure") {
    return {
      label: "✗ failure",
      className: "bg-rose-100 text-rose-800 border-rose-200",
    };
  }
  if (c === "cancelled") {
    return {
      label: "⊘ cancelled",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }
  return {
    label: c ?? "running",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  };
}

export default async function PipelineStatusPage() {
  const { runs, error } = await fetchRuns();
  const total = runs.length;
  const successes = runs.filter((r) => r.conclusion === "success").length;
  const failures = runs.filter((r) => r.conclusion === "failure").length;
  const successRate = total > 0 ? Math.round((successes / total) * 100) : 0;

  return (
    <Container size="wide" className="py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-emerald-700">PIPELINE</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-ink leading-tight">
          パイプライン稼働状況
        </h1>
        <p className="mt-3 text-sm md:text-base text-subink max-w-3xl">
          <a
            href="https://github.com/kenjieda-eng/eic-data-pipeline"
            className="text-emerald-700 underline hover:text-emerald-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            eic-data-pipeline
          </a>{" "}
          の GitHub Actions 実行履歴 (過去 {total} 件、ISR 1 時間更新)。Nightly Fetch によるデータ更新の透明性を担保。
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          ⚠️ GitHub API 取得失敗: {error} (rate limit 60/h で再試行待ち)
        </div>
      )}

      {total > 0 && (
        <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wider text-faint">
              直近 {total} 件
            </div>
            <div className="mt-1 text-2xl font-bold text-ink tabular-nums">
              {total}
            </div>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50/30 p-4">
            <div className="text-xs uppercase tracking-wider text-faint">
              成功率
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
              {successRate}%
            </div>
            <div className="text-xs text-subink">
              {successes} 成功 / {failures} 失敗
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wider text-faint">
              最新 run
            </div>
            <div className="mt-1 text-sm font-medium text-ink">
              {runs[0]?.created_at?.slice(0, 16).replace("T", " ") ?? "—"}
            </div>
          </div>
        </section>
      )}

      <ol className="space-y-2">
        {runs.map((r) => {
          const badge = conclusionBadge(r.conclusion);
          const dur = durationSeconds(
            r.run_started_at ?? r.created_at,
            r.updated_at,
          );
          return (
            <li
              key={r.id}
              className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <span
                className={`inline-flex items-center justify-center rounded border px-2 py-0.5 text-xs font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
              <a
                href={r.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm font-medium text-ink hover:text-emerald-700 hover:underline"
              >
                {r.display_title ?? r.name ?? `run #${r.id}`}
              </a>
              <span className="text-xs text-faint tabular-nums">
                {r.created_at.slice(0, 16).replace("T", " ")}
              </span>
              <span className="text-xs text-faint tabular-nums">
                {formatDuration(dur)}
              </span>
            </li>
          );
        })}
      </ol>

      <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-faint">
        <p>
          ※ データソース: GitHub REST API
          <code> /repos/kenjieda-eng/eic-data-pipeline/actions/runs</code>。
          Public repo のため認証不要 (rate limit 60/h)、ISR 1 時間で再取得。
          eic-data-web からの直接呼び出しでサーバ側集計、ブラウザ側リクエストなし。
        </p>
      </footer>
    </Container>
  );
}

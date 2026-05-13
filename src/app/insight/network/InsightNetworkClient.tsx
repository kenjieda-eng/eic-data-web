"use client";

import * as d3 from "d3";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  INSIGHT_DOMAIN_COLORS,
  INSIGHT_DOMAIN_LABEL_JA,
  insightEdgeWidth,
  insightNodeRadius,
  type InsightGraph,
  type InsightGraphEdge,
  type InsightGraphNode,
} from "@/lib/insight-graph";
import type { InsightDomain } from "@/lib/insight-validator";

const WIDTH = 960;
const HEIGHT = 640;

interface SimNode extends d3.SimulationNodeDatum, InsightGraphNode {}
interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  weight: number;
  kind: InsightGraphEdge["kind"];
  sharedTags: string[];
}

const DOMAIN_ORDER: ReadonlyArray<InsightDomain | "other"> = [
  "power",
  "weather",
  "fuel",
  "finance",
  "other",
];

const EDGE_KIND_LABEL: Record<InsightGraphEdge["kind"], string> = {
  indicator: "指標",
  tag: "タグ",
  region: "地域",
};

export default function InsightNetworkClient({
  graph,
}: {
  graph: InsightGraph;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    graph.nodes[0]?.slug ?? "",
  );

  const maxDegree = useMemo(
    () => Math.max(1, ...graph.nodes.map((n) => n.degree)),
    [graph.nodes],
  );
  const maxWeight = useMemo(
    () => Math.max(1, ...graph.edges.map((e) => e.weight)),
    [graph.edges],
  );

  const selected = useMemo(
    () => graph.nodes.find((n) => n.slug === selectedSlug) ?? null,
    [graph.nodes, selectedSlug],
  );

  /** 選択中ノードに接続するエッジ + 相手ノードを抽出 (サイドパネル用) */
  const selectedNeighbors = useMemo(() => {
    if (!selected) return [];
    return graph.edges
      .filter((e) => e.source === selected.slug || e.target === selected.slug)
      .map((e) => {
        const otherSlug = e.source === selected.slug ? e.target : e.source;
        const other = graph.nodes.find((n) => n.slug === otherSlug);
        return { edge: e, other };
      })
      .filter((x): x is { edge: InsightGraphEdge; other: InsightGraphNode } => !!x.other)
      .sort((a, b) => b.edge.weight - a.edge.weight)
      .slice(0, 8);
  }, [graph, selected]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const edges: SimEdge[] = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
      kind: e.kind,
      sharedTags: e.sharedTags,
    }));

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const root = svg.append("g").attr("class", "zoom-root");

    // エッジ (kind 別の薄い色分け)
    const edgeStroke: Record<InsightGraphEdge["kind"], string> = {
      indicator: "#94a3b8", // slate-400
      tag: "#cbd5e1", // slate-300
      region: "#e2e8f0", // slate-200
    };
    const linkGroup = root
      .append("g")
      .attr("class", "edges")
      .attr("fill", "none");
    const link = linkGroup
      .selectAll<SVGLineElement, SimEdge>("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d) => edgeStroke[d.kind])
      .attr("stroke-opacity", (d) => 0.35 + 0.4 * (d.weight / maxWeight))
      .attr("stroke-width", (d) => insightEdgeWidth(d.weight, maxWeight));

    // ノード
    const nodeGroup = root.append("g").attr("class", "nodes");
    const node = nodeGroup
      .selectAll<SVGGElement, SimNode>("g.node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-label", (d) => `${d.title} (${d.domainLabel})`)
      .on("click", (_, d) => setSelectedSlug(d.slug))
      .on("keydown", (event: KeyboardEvent, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setSelectedSlug(d.slug);
        }
      });

    node
      .append("circle")
      .attr("r", (d) => insightNodeRadius(d.degree, maxDegree))
      .attr("fill", (d) => INSIGHT_DOMAIN_COLORS[d.domain])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // ノードラベル: タイトル冒頭 12 字程度 (密度を考慮、ホバーで完全表示)
    node
      .append("title")
      .text((d) => `${d.title}\n${d.lede}`);
    node
      .append("text")
      .text((d) =>
        d.title.length > 14 ? `${d.title.slice(0, 13)}…` : d.title,
      )
      .attr("text-anchor", "middle")
      .attr("dy", (d) => insightNodeRadius(d.degree, maxDegree) + 11)
      .attr("font-size", 10)
      .attr("font-weight", 500)
      .attr("fill", "#1f2937")
      .attr("pointer-events", "none")
      .attr("paint-order", "stroke")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-opacity", 0.85);

    // Drag
    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    node.call(drag);

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        root.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    // Force simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimEdge>(edges)
          .id((d) => d.slug)
          .distance((d) => 160 - 30 * (d.weight / maxWeight))
          .strength((d) => 0.05 + 0.3 * (d.weight / maxWeight)),
      )
      .force("charge", d3.forceManyBody<SimNode>().strength(-220))
      .force("center", d3.forceCenter<SimNode>(WIDTH / 2, HEIGHT / 2))
      .force(
        "collision",
        d3
          .forceCollide<SimNode>()
          .radius((d) => insightNodeRadius(d.degree, maxDegree) + 8),
      );

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graph, maxDegree, maxWeight]);

  // 選択ノードハイライト
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    d3.select(svgEl)
      .selectAll<SVGCircleElement, SimNode>("g.node circle")
      .attr("stroke", (d) => (d.slug === selectedSlug ? "#047857" : "#fff"))
      .attr("stroke-width", (d) => (d.slug === selectedSlug ? 3 : 1.5));
  }, [selectedSlug]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      {/* SVG viewport */}
      <div
        className="rounded-md border border-slate-200 bg-white"
        style={{ overflow: "hidden" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          height={HEIGHT}
          role="img"
          aria-label={`Insight ${graph.nodes.length} 本の関連性ネットワーク`}
          style={{ background: "#fafafa" }}
        />
      </div>

      {/* サイドパネル */}
      <aside className="space-y-4">
        {/* 選択ノード詳細 */}
        <section
          aria-label="選択 Insight 詳細"
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-faint">
            選択中の Insight
          </div>
          {selected ? (
            <>
              <h2 className="mt-1 text-base font-semibold text-ink leading-snug">
                {selected.title}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-faint flex-wrap">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    background: INSIGHT_DOMAIN_COLORS[selected.domain],
                  }}
                  aria-hidden
                />
                <span>{selected.domainLabel}</span>
                <span aria-hidden>／</span>
                <span className="font-mono">{selected.slug}</span>
                <span aria-hidden>／</span>
                <span>関連 {selected.degree} 本</span>
              </div>
              <p className="mt-2 text-[13px] text-subink leading-relaxed">
                {selected.lede}
              </p>
              <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                {selected.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-subink"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <Link
                href={`/insight/${selected.slug}`}
                className="mt-3 inline-block text-[12px] text-emerald-700 underline hover:text-emerald-900"
              >
                Insight ページを開く →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-subink">
              ノードをクリックして詳細を表示。
            </p>
          )}
        </section>

        {/* 関連 Insight Top */}
        {selected && selectedNeighbors.length > 0 && (
          <section
            aria-label="関連 Insight"
            className="rounded-md border border-slate-200 bg-white p-4"
          >
            <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
              関連の強い Insight (weight 順 上位 {selectedNeighbors.length})
            </div>
            <ul className="space-y-1.5">
              {selectedNeighbors.map(({ edge, other }) => (
                <li key={other.slug} className="text-[12px]">
                  <button
                    type="button"
                    onClick={() => setSelectedSlug(other.slug)}
                    className="text-left hover:underline text-ink"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                      style={{
                        background: INSIGHT_DOMAIN_COLORS[other.domain],
                      }}
                      aria-hidden
                    />
                    {other.title.length > 28
                      ? `${other.title.slice(0, 27)}…`
                      : other.title}
                  </button>
                  <div className="ml-3.5 text-[10px] text-faint">
                    {EDGE_KIND_LABEL[edge.kind]} ／ w=
                    <span className="tabular-nums">{edge.weight.toFixed(1)}</span>
                    {edge.sharedTags.length > 0 && (
                      <span className="ml-1">
                        共通: {edge.sharedTags.slice(0, 3).join(", ")}
                        {edge.sharedTags.length > 3 ? "…" : ""}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 凡例 */}
        <section
          aria-label="ドメイン凡例"
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            ドメイン (主軸タグ)
          </div>
          <ul className="space-y-1.5">
            {DOMAIN_ORDER.map((d) => {
              const count = graph.nodes.filter((n) => n.domain === d).length;
              if (count === 0 && d !== "other") return null;
              return (
                <li key={d} className="flex items-center gap-2 text-[12px]">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: INSIGHT_DOMAIN_COLORS[d] }}
                    aria-hidden
                  />
                  <span className="text-ink">
                    {INSIGHT_DOMAIN_LABEL_JA[d]}
                  </span>
                  <span className="text-faint tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 操作説明 */}
        <section
          aria-label="操作"
          className="rounded-md border border-slate-200 bg-slate-50 p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            操作
          </div>
          <ul className="space-y-1 text-[12px] text-subink leading-relaxed">
            <li>
              <strong className="text-ink">クリック</strong>: ノード選択 → 詳細
              + 関連リスト
            </li>
            <li>
              <strong className="text-ink">ドラッグ</strong>:
              ノードを掴んで配置調整
            </li>
            <li>
              <strong className="text-ink">ホイール</strong>: ズーム (0.3× ～ 4×)
            </li>
            <li>
              <strong className="text-ink">ノードサイズ</strong>:
              関連エッジ数 (中心性)
            </li>
            <li>
              <strong className="text-ink">エッジ太さ</strong>:
              関連強度 (共通タグ / 指標 / 地域から自動計算)
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

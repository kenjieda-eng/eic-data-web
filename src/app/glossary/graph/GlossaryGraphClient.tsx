"use client";

import * as d3 from "d3";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import GlossaryText from "@/components/GlossaryText";
import {
  edgeWidth,
  GLOSSARY_CATEGORY_COLORS,
  nodeRadius,
  type GlossaryEdge,
  type GlossaryGraph,
  type GlossaryNode,
} from "@/lib/glossary-relations";

const WIDTH = 960;
const HEIGHT = 600;

interface SimNode extends d3.SimulationNodeDatum, GlossaryNode {}
interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  weight: number;
}

const CATEGORY_ORDER = [
  "basic",
  "regulation",
  "power",
  "fuel",
  "finance",
  "economy",
] as const;

const CATEGORY_LABEL_JA: Record<(typeof CATEGORY_ORDER)[number], string> = {
  basic: "基本",
  regulation: "制度",
  power: "電力",
  fuel: "燃料",
  finance: "金融・マクロ",
  economy: "経済",
};

export default function GlossaryGraphClient({
  graph,
}: {
  graph: GlossaryGraph;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    graph.nodes[0]?.slug ?? "",
  );

  const maxDegree = useMemo(
    () => Math.max(1, ...graph.nodes.map((n) => n.degree)),
    [graph.nodes],
  );

  // 選択ノードの詳細
  const selected = useMemo(
    () => graph.nodes.find((n) => n.slug === selectedSlug) ?? null,
    [graph.nodes, selectedSlug],
  );

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const edges: SimEdge[] = graph.edges.map((e: GlossaryEdge) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const root = svg.append("g").attr("class", "zoom-root");

    // エッジ
    const linkGroup = root
      .append("g")
      .attr("class", "edges")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-opacity", 0.7);
    const link = linkGroup
      .selectAll<SVGLineElement, SimEdge>("line")
      .data(edges)
      .join("line")
      .attr("stroke-width", (d) => edgeWidth(d.weight));

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
      .attr("aria-label", (d) => `${d.name} (${d.categoryLabel})`)
      .on("click", (_, d) => setSelectedSlug(d.slug))
      .on("keydown", (event: KeyboardEvent, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setSelectedSlug(d.slug);
        }
      });

    node
      .append("circle")
      .attr("r", (d) => nodeRadius(d.degree, maxDegree))
      .attr("fill", (d) => GLOSSARY_CATEGORY_COLORS[d.category])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    node
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius(d.degree, maxDegree) + 12)
      .attr("font-size", 11)
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
          .distance((d) => 120 - 60 * d.weight)
          .strength((d) => d.weight),
      )
      .force("charge", d3.forceManyBody<SimNode>().strength(-260))
      .force("center", d3.forceCenter<SimNode>(WIDTH / 2, HEIGHT / 2))
      .force(
        "collision",
        d3
          .forceCollide<SimNode>()
          .radius((d) => nodeRadius(d.degree, maxDegree) + 6),
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
  }, [graph, maxDegree]);

  // 選択ノードを highlight
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    d3.select(svgEl)
      .selectAll<SVGCircleElement, SimNode>("g.node circle")
      .attr("stroke", (d) => (d.slug === selectedSlug ? "#047857" : "#fff"))
      .attr("stroke-width", (d) => (d.slug === selectedSlug ? 3 : 1.5));
  }, [selectedSlug]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
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
          aria-label="用語集 35 項目の関連性ノードグラフ"
          style={{ background: "#fafafa" }}
        />
      </div>

      {/* サイドパネル: 詳細 + 凡例 + 操作 */}
      <aside className="space-y-4">
        {/* 詳細 */}
        <section
          aria-label="選択ノード詳細"
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-faint">
            選択中の用語
          </div>
          {selected ? (
            <>
              <h2 className="mt-1 text-base font-semibold text-ink">
                {selected.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-faint">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    background: GLOSSARY_CATEGORY_COLORS[selected.category],
                  }}
                  aria-hidden
                />
                <span>{selected.categoryLabel}</span>
                <span aria-hidden>／</span>
                <span className="font-mono">{selected.slug}</span>
                <span aria-hidden>／</span>
                <span>関連 {selected.degree} 本</span>
              </div>
              <p className="mt-3 text-[13px] text-ink leading-relaxed">
                <GlossaryText text={selected.description} />
              </p>
              <Link
                href={`/glossary/${selected.slug}`}
                className="mt-3 inline-block text-[12px] text-emerald-700 underline hover:text-emerald-900"
              >
                個別ページで関連 Insight を見る →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-subink">
              ノードをクリックして詳細を表示。
            </p>
          )}
        </section>

        {/* 凡例 */}
        <section
          aria-label="カテゴリ凡例"
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <div className="text-[11px] uppercase tracking-wider text-faint mb-2">
            カテゴリ
          </div>
          <ul className="space-y-1.5">
            {CATEGORY_ORDER.map((c) => (
              <li key={c} className="flex items-center gap-2 text-[12px]">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: GLOSSARY_CATEGORY_COLORS[c] }}
                  aria-hidden
                />
                <span className="text-ink">{CATEGORY_LABEL_JA[c]}</span>
                <span className="text-faint tabular-nums">
                  {graph.nodes.filter((n) => n.category === c).length}
                </span>
              </li>
            ))}
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
              <strong className="text-ink">クリック</strong>: ノード選択 →
              詳細表示
            </li>
            <li>
              <strong className="text-ink">ドラッグ</strong>: ノードを掴んで配置調整
            </li>
            <li>
              <strong className="text-ink">ホイール</strong>: ズーム
              (0.3× ～ 4×)
            </li>
            <li>
              <strong className="text-ink">関連数</strong>:
              ノードサイズで表現 (大きいほど中心的)
            </li>
            <li>
              <strong className="text-ink">関連強度</strong>:
              エッジの太さで表現 (太いほど強い)
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

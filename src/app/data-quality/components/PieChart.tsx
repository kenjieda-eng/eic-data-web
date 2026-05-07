interface PieDatum {
  label: string;
  count: number;
  emoji?: string;
  isSpdx?: boolean;
}

interface PieChartProps {
  title: string;
  description: string;
  data: PieDatum[];
  size?: number;
}

const PALETTE = [
  "#0ea5e9",
  "#16a34a",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#10b981",
  "#f97316",
  "#6366f1",
  "#06b6d4",
  "#94a3b8",
  "#fbbf24",
];

const SPDX_GREENS = ["#16a34a", "#22c55e", "#15803d", "#10b981", "#059669"];
const NON_SPDX_AMBERS = ["#f59e0b", "#fb923c", "#f97316", "#fbbf24", "#d97706"];

function pickFill(d: PieDatum, i: number): string {
  if (d.isSpdx === true) return SPDX_GREENS[i % SPDX_GREENS.length];
  if (d.isSpdx === false) return NON_SPDX_AMBERS[i % NON_SPDX_AMBERS.length];
  return PALETTE[i % PALETTE.length];
}

export default function PieChart({
  title,
  description,
  data,
  size = 220,
}: PieChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  const slices: { path: string; fill: string; pct: string; datum: PieDatum }[] =
    [];
  if (total > 0) {
    let acc = 0;
    data.forEach((d, i) => {
      const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += d.count;
      const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const path =
        data.length === 1
          ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
          : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      slices.push({
        path,
        fill: pickFill(d, i),
        pct: ((d.count / total) * 100).toFixed(1),
        datum: d,
      });
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5">
      <h3 className="text-[14px] font-semibold text-ink mb-2">{title}</h3>
      <p className="text-[11px] text-faint mb-3">{description}</p>
      {total === 0 ? (
        <p className="text-[12px] text-faint">データなし</p>
      ) : (
        <div className="flex items-start gap-4">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
            style={{ flexShrink: 0 }}
            role="img"
            aria-label={title}
          >
            {slices.map((s, i) => (
              <path
                key={i}
                d={s.path}
                fill={s.fill}
                stroke="#fff"
                strokeWidth={1.5}
              />
            ))}
          </svg>
          <ul className="flex-1 min-w-0 m-0 p-0 list-none">
            {slices.map((s, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-[11px] py-0.5"
              >
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    background: s.fill,
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <span className="text-subink truncate">
                  {s.datum.emoji ? `${s.datum.emoji} ` : ""}
                  {s.datum.label}
                </span>
                <span className="text-faint tabular-nums ml-auto whitespace-nowrap">
                  {s.datum.count} ({s.pct}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

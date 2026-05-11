"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface AxisItem {
  id: string;
  icon: string;
  title: string;
  count: number;
}

interface Props {
  axes: AxisItem[];
  unclassifiedCount: number;
  currentAxis: string | null;
}

export default function AxisFilterChips({
  axes,
  unclassifiedCount,
  currentAxis,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function buildHref(value: string | null): string {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (value) {
      next.set("axis", value);
    } else {
      next.delete("axis");
    }
    const qs = next.toString();
    return `/insight/map${qs ? `?${qs}` : ""}`;
  }

  function chip(
    value: string | null,
    icon: string | null,
    title: string,
    count: number,
    selected: boolean,
  ) {
    const href = buildHref(value);
    return (
      <Link
        key={value ?? "all"}
        href={href}
        prefetch={false}
        onClick={(e) => {
          e.preventDefault();
          router.replace(href, { scroll: false });
        }}
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition tabular-nums ${
          selected
            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
            : "border-slate-300 bg-white text-subink hover:border-emerald-300 hover:text-emerald-700"
        }`}
      >
        {icon && <span aria-hidden>{icon}</span>}
        <span>{title}</span>
        <span className="ml-1 text-xs text-faint">{count}</span>
      </Link>
    );
  }

  const total =
    axes.reduce((s, a) => s + a.count, 0) + unclassifiedCount;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-faint">
        axis
      </span>
      {chip(null, null, "全軸", total, !currentAxis)}
      {axes.map((a) => chip(a.id, a.icon, a.title, a.count, currentAxis === a.id))}
      {unclassifiedCount > 0 &&
        chip(
          "unclassified",
          "❓",
          "未分類",
          unclassifiedCount,
          currentAxis === "unclassified",
        )}
    </div>
  );
}

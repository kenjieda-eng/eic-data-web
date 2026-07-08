"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

export interface MobileNavItem {
  href: string;
  label: string;
}

export interface MobileNavGroup {
  label: string;
  items: MobileNavItem[];
}

export default function MobileNav({
  home,
  groups,
  search,
}: {
  home: MobileNavItem;
  groups: MobileNavGroup[];
  search: MobileNavItem;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass =
    "block rounded-md px-3 py-2 text-base text-ink hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500";

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-ink hover:border-emerald-500 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        <span className="sr-only">メニュー</span>
        <span aria-hidden className="text-lg leading-none">{open ? "✕" : "☰"}</span>
      </button>
      {open && (
        <div
          id="mobile-nav-panel"
          className="absolute left-0 right-0 top-full z-50 border-b border-slate-200 bg-white shadow-md"
        >
          {/* TOP →（群見出し + 群リンク）→ 検索。全16リンクを保持。 */}
          <ul className="mx-auto max-w-3xl px-4 py-3 space-y-1">
            <li>
              <Link
                href={home.href}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {home.label}
              </Link>
            </li>
            {groups.map((group) => (
              <Fragment key={group.label}>
                <li>
                  <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {group.label}
                  </p>
                </li>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={linkClass}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </Fragment>
            ))}
            <li>
              <Link
                href={search.href}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {search.label}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export interface MobileNavItem {
  href: string;
  label: string;
}

export default function MobileNav({ items }: { items: MobileNavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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
          <ul className="mx-auto max-w-3xl px-4 py-3 space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-base text-ink hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

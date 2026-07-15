"use client";

import { useEffect } from "react";

/**
 * グローバルナビの <details> ドロップダウンに「外側クリックで閉じる」「同時に1つだけ開く」
 * 挙動を後付けするだけの副作用専用クライアントコンポーネント（描画は null）。
 *
 * ナビのリンク描画自体は layout.tsx のサーバー描画のまま（初期 DOM に全リンク常在 → SEO 非退行）。
 * ここでは document / nav レベルにイベントを足して挙動だけを付与する。
 *
 * 設計上の要点:
 *  - 外側 pointerdown: クリック先を含まない開いた <details> を閉じる（クリック先の <details> は維持）。
 *  - toggle（capture）: ある <details> が開いたら同ナビ内の兄弟を閉じる（同時に1つだけ開く）。
 *  - focusout では閉じない → Tab / Enter でのキーボード開閉やリンクへのフォーカス移動を壊さない。
 */
export default function NavDropdownBehavior() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav-dropdowns]");
    if (!nav) return;

    const detailsList = () =>
      Array.from(nav.querySelectorAll<HTMLDetailsElement>("details"));

    // 外側クリック: クリック先を含まない開いた <details> を閉じる。
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      for (const d of detailsList()) {
        if (d.open && (!target || !d.contains(target))) {
          d.open = false;
        }
      }
    };

    // ある <details> が開いたら兄弟を閉じる（同時に1つだけ）。
    // toggle はバブリングしないため、ナビで capture フェーズに拾う。
    const onToggle = (e: Event) => {
      const opened = e.target as HTMLDetailsElement | null;
      if (!opened || !opened.open) return;
      for (const d of detailsList()) {
        if (d !== opened && d.open) d.open = false;
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    nav.addEventListener("toggle", onToggle, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      nav.removeEventListener("toggle", onToggle, true);
    };
  }, []);

  return null;
}

import type { ReactNode } from "react";

export type ContainerSize = "wide" | "data" | "prose" | "compact";

const SIZE_CLASSES: Record<ContainerSize, string> = {
  // 俯瞰系 (TOP / Insight 一覧 / catalog 一覧 / Insight マップ / データ品質 / ドメイン詳細)
  wide: "max-w-3xl md:max-w-5xl lg:max-w-7xl xl:max-w-[1320px]",
  // データ + 解説併記 (Insight 個別 / catalog 個別) — 既存デフォルト、後方互換
  data: "max-w-3xl md:max-w-5xl lg:max-w-6xl",
  // 本文系 (方法論)
  prose: "max-w-3xl md:max-w-4xl lg:max-w-5xl",
  // 用語集 (リンク密度高い)
  compact: "max-w-3xl md:max-w-4xl",
};

export default function Container({
  children,
  className = "",
  size = "data",
}: {
  children: ReactNode;
  className?: string;
  size?: ContainerSize;
}) {
  return (
    <div className={`mx-auto px-4 ${SIZE_CLASSES[size]} ${className}`.trim()}>
      {children}
    </div>
  );
}

import type { ReactNode } from "react";
import { BOX_COLOR_CLASS, type MethodologySection } from "../sections";

interface MethodologySectionProps {
  section: MethodologySection;
  children: ReactNode;
}

export default function MethodologySectionCard({
  section,
  children,
}: MethodologySectionProps) {
  return (
    <section
      id={section.id}
      className={`rounded-xl border p-5 scroll-mt-20 ${BOX_COLOR_CLASS[section.boxColor]}`}
    >
      <h2 className="text-lg font-semibold text-slate-900">
        {section.number}. {section.title}
      </h2>
      <div className="mt-2 text-[14px] leading-relaxed text-slate-800">
        {children}
      </div>
    </section>
  );
}

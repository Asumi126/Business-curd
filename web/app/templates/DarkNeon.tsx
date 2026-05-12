import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function DarkNeon({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm] overflow-hidden"
      style={{
        backgroundColor: "var(--c-bg, #020617)",
        color: "var(--c-fg, #22d3ee)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--c-accent, #a855f7) 50%, transparent), transparent 40%), radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--c-fg, #22d3ee) 40%, transparent), transparent 40%)",
          opacity: 0.5,
        }}
      />
      <div className="relative flex-1 flex flex-col justify-end min-w-0">
        <div
          data-role="company"
          className="text-[8pt] tracking-[0.22em] uppercase font-mono min-w-0"
          style={{ color: "var(--c-fg, #22d3ee)", textShadow: "0 0 8px color-mix(in srgb, var(--c-fg, #22d3ee) 60%, transparent)" }}
        >
          {d.company}
        </div>
        <div
          data-role="name"
          className="text-[20pt] font-bold leading-none tracking-tight mt-[1mm]"
          style={{ color: "color-mix(in srgb, var(--c-fg, #22d3ee) 30%, #ffffff)", textShadow: "0 0 12px color-mix(in srgb, var(--c-accent, #a855f7) 50%, transparent)" }}
        >
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7.5pt] tracking-[0.15em] font-mono mt-[0.5mm]" style={{ color: "var(--c-accent, #a855f7)" }}>
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[8pt] mt-[1.5mm]" style={{ color: "color-mix(in srgb, var(--c-accent, #a855f7) 60%, #ffffff)" }}>
          {d.title}
        </div>
      </div>
      <div data-role="contact" className="relative text-[7pt] leading-relaxed space-y-[0.3mm] mt-[2mm] font-mono min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #22d3ee) 80%, #ffffff)", opacity: 0.9 }}>
        {d.phone && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>&gt; </span>}{d.phone}</div>}
        {d.email && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>&gt; </span>}{d.email}</div>}
        {d.website && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>&gt; </span>}{d.website}</div>}
        {d.addressLine && <div className="min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && <span>&gt; </span>}{d.addressLine}</div>}
      </div>
    </div>
  );
}

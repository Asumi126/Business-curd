import { CardData } from "../lib/types";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function Architectural({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm] overflow-hidden"
      style={{
        backgroundColor: "var(--c-bg, #fbfaf6)",
        color: "var(--c-fg, #0a0a0a)",
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Menlo', monospace",
        backgroundImage:
          "linear-gradient(color-mix(in srgb, var(--c-fg, #0a0a0a) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--c-fg, #0a0a0a) 5%, transparent) 1px, transparent 1px)",
        backgroundSize: "5mm 5mm",
      }}
    >
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
          <line x1="40" y1="0" x2="40" y2="121" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
          <text x="2" y="38" fontSize="3" fontFamily="monospace" fill="currentColor" opacity="0.4">A.0</text>
          <text x="42" y="118" fontSize="3" fontFamily="monospace" fill="currentColor" opacity="0.4">B.0</text>
        </svg>
      )}
      <div className="absolute right-[3mm] top-[3mm] z-10">
        <Monogram data={d} size="11mm" bgColor="var(--c-fg, #0a0a0a)" fgColor="var(--c-bg, #fbfaf6)" />
      </div>
      <div className="relative flex-1 flex flex-col justify-end pl-[20mm] min-w-0">
        <div data-role="company" className="text-[6pt] tracking-[0.22em] uppercase mb-[1mm] min-w-0" style={{ color: "var(--c-muted, #737373)" }}>
          [{d.company.toUpperCase()}]
        </div>
        <div
          data-role="name"
          className="text-[18pt] font-medium leading-tight tracking-[-0.01em]"
          style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
        >
          {nameDisplay(d)}
        </div>
        <div className="text-[7pt] tracking-[0.25em] uppercase mt-[0.5mm] flex flex-wrap gap-x-[2mm]" style={{ opacity: 0.85 }}>
          <span data-role="nameEn">{d.nameEn}</span>
          {d.nameEn && d.title && <span aria-hidden>/</span>}
          <span data-role="title">{d.title}</span>
        </div>
      </div>
      <div data-role="contact" className="relative text-[6.5pt] tracking-wide leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.2mm] pl-[20mm] mt-[2mm] min-w-0" style={{ opacity: 0.85 }}>
        {d.phone && <div className="min-w-0">tel.{d.phone}</div>}
        {d.email && <div className="min-w-0">{d.email}</div>}
        {d.website && <div className="col-span-2 min-w-0">{d.website}</div>}
        {d.addressLine && <div className="col-span-2 min-w-0">{d.addressLine}</div>}
      </div>
    </div>
  );
}

import { CardData } from "../lib/types";
import { fallback, nameDisplay } from "./utils";

export function CorporateNavyBar({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        backgroundColor: "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #0f172a)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="h-[6mm]" style={{ backgroundColor: "var(--c-accent, #0f172a)" }} />
      <div className="flex-1 flex flex-col justify-between p-[6mm] min-w-0">
        <div className="min-w-0">
          <div data-role="company" className="text-[10pt] font-serif font-bold min-w-0" style={{ color: "var(--c-accent, #0f172a)" }}>
            {d.company}
          </div>
          {d.department && <div className="text-[7pt] mt-[0.5mm] min-w-0" style={{ color: "var(--c-muted, #737373)" }}>{d.department}</div>}
        </div>
        <div className="min-w-0">
          <div data-role="name" className="text-[18pt] font-serif font-bold leading-tight min-w-0">{nameDisplay(d)}</div>
          <div data-role="nameEn" className="text-[8pt] tracking-[0.15em] mt-[0.5mm] min-w-0" style={{ color: "var(--c-muted, #737373)" }}>{d.nameEn}</div>
          <div data-role="title" className="text-[8pt] mt-[1mm] font-semibold min-w-0" style={{ color: "var(--c-accent, #0f172a)" }}>{d.title}</div>
        </div>
        <div data-role="contact" className="text-[7pt] leading-relaxed space-y-[0.5mm] pt-[2mm] min-w-0" style={{ color: "var(--c-fg, #0f172a)", opacity: 0.85, borderTop: "1px solid color-mix(in srgb, var(--c-fg, #0f172a) 15%, transparent)" }}>
          <div className="flex flex-wrap gap-x-[3mm] gap-y-[0.3mm] min-w-0">
            {d.phone && <span className="min-w-0">T. {d.phone}</span>}
            {d.email && <span className="min-w-0">E. {d.email}</span>}
          </div>
          {d.website && <div className="min-w-0">W. {d.website}</div>}
          {d.addressLine && <div className="min-w-0">{d.addressLine}</div>}
        </div>
      </div>
      <div className="h-[2mm]" style={{ backgroundColor: "var(--c-accent, #0f172a)" }} />
    </div>
  );
}

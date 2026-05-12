import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function VerticalMinimal({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        backgroundColor: "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #171717)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div data-role="company" className="text-[6pt] tracking-[0.3em] uppercase mb-[2mm] min-w-0" style={{ color: "var(--c-muted, #a3a3a3)" }}>
        {d.company}
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div data-role="name" className="text-[22pt] font-light tracking-[-0.02em] leading-[0.95] min-w-0">{nameDisplay(d)}</div>
        <div className="mt-[1mm] h-px w-[10mm]" style={{ backgroundColor: "var(--c-fg, #171717)" }} />
        <div data-role="nameEn" className="text-[6pt] tracking-[0.2em] uppercase mt-[1mm] min-w-0" style={{ color: "var(--c-muted, #a3a3a3)" }}>
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7.5pt] mt-[1.5mm] min-w-0" style={{ opacity: 0.85 }}>{d.title}</div>
      </div>

      <div data-role="contact" className="text-[6.5pt] leading-[1.6] flex flex-col gap-[0.2mm] min-w-0" style={{ color: "var(--c-muted, #737373)" }}>
        {d.phone && <div data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.2mm" className="shrink-0" />{d.phone}</div>}
        {d.email && <div data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.2mm" className="shrink-0" />{d.email}</div>}
        {d.website && <div data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.2mm" className="shrink-0" />{d.website}</div>}
        {d.addressLine && <div data-role="address" className="flex items-start gap-[1mm] text-[6pt] min-w-0"><Icon kind="pin" size="2mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</div>}
      </div>
    </div>
  );
}

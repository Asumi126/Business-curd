import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function VerticalModern({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-between p-[6mm] text-center"
      style={{
        backgroundColor: "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #171717)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="w-full min-w-0">
        <div data-role="company" className="text-[7pt] tracking-[0.3em] uppercase font-medium min-w-0" style={{ color: "var(--c-accent, #2563eb)" }}>
          {d.company}
        </div>
        <div className="my-[2mm] h-px w-[10mm] mx-auto" style={{ backgroundColor: "var(--c-accent, #2563eb)" }} />
      </div>

      <div className="flex flex-col items-center w-full min-w-0">
        <div data-role="name" className="text-[20pt] font-light tracking-[-0.02em] leading-tight min-w-0 text-center">{nameDisplay(d)}</div>
        <div data-role="nameEn" className="text-[7pt] tracking-[0.2em] uppercase mt-[1mm] min-w-0 text-center" style={{ color: "var(--c-muted, #737373)" }}>
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[8pt] mt-[1.5mm] min-w-0" style={{ opacity: 0.85 }}>{d.title}</div>
      </div>

      <div data-role="contact" className="w-full text-[6.8pt] leading-[1.6] flex flex-col gap-[0.3mm] min-w-0" style={{ color: "var(--c-fg, #171717)", opacity: 0.85 }}>
        {d.phone && <div data-role="phone" className="flex items-center justify-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.3mm" className="shrink-0" />{d.phone}</div>}
        {d.email && <div data-role="email" className="flex items-center justify-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.3mm" className="shrink-0" />{d.email}</div>}
        {d.website && <div data-role="website" className="flex items-center justify-center gap-[1mm] min-w-0"><Icon kind="web" size="2.3mm" className="shrink-0" />{d.website}</div>}
        {d.addressLine && <div data-role="address" className="flex items-center justify-center gap-[1mm] text-[6.3pt] min-w-0"><Icon kind="pin" size="2.2mm" className="shrink-0" />{d.addressLine}</div>}
      </div>
    </div>
  );
}

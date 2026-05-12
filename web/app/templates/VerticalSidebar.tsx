import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function VerticalSidebar({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex"
      style={{
        backgroundColor: "var(--c-bg, #ffffff)",
        color: "var(--c-fg, #171717)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div
        className="w-[10mm] shrink-0 flex flex-col items-center justify-center p-[2mm] relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--c-accent, #1e3a8a) 0%, color-mix(in srgb, var(--c-accent, #1e3a8a) 70%, #000) 100%)",
        }}
      >
        <div
          data-role="company"
          className="text-[5.5pt] tracking-[0.25em] uppercase max-h-full overflow-hidden"
          style={{ color: "var(--c-bg, #ffffff)", writingMode: "vertical-rl" as const, opacity: 0.85 }}
        >
          {d.company}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between p-[5mm] min-w-0">
        <div data-role="title" className="text-[6.5pt] tracking-[0.25em] uppercase font-bold min-w-0" style={{ color: "var(--c-accent, #1e3a8a)" }}>
          {d.title}
        </div>
        <div className="min-w-0">
          <div data-role="name" className="text-[19pt] font-bold tracking-[-0.02em] leading-tight min-w-0">{nameDisplay(d)}</div>
          <div data-role="nameEn" className="text-[7pt] tracking-[0.16em] uppercase mt-[0.5mm] min-w-0" style={{ color: "var(--c-muted, #737373)" }}>
            {d.nameEn}
          </div>
        </div>
        <div data-role="contact" className="text-[6.5pt] leading-[1.6] flex flex-col gap-[0.3mm] min-w-0" style={{ opacity: 0.85 }}>
          {d.phone && <div data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.2mm" className="shrink-0" style={{ color: "var(--c-accent, #1e3a8a)" }} />{d.phone}</div>}
          {d.email && <div data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.2mm" className="shrink-0" style={{ color: "var(--c-accent, #1e3a8a)" }} />{d.email}</div>}
          {d.website && <div data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.2mm" className="shrink-0" style={{ color: "var(--c-accent, #1e3a8a)" }} />{d.website}</div>}
          {d.addressLine && <div data-role="address" className="flex items-start gap-[1mm] text-[6pt] min-w-0"><Icon kind="pin" size="2mm" className="shrink-0 mt-[0.4mm]" style={{ color: "var(--c-accent, #1e3a8a)" }} />{d.addressLine}</div>}
        </div>
      </div>
    </div>
  );
}

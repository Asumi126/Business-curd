import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function VerticalLuxe({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-between p-[6mm] text-center"
      style={{
        background:
          "radial-gradient(ellipse at top, color-mix(in srgb, var(--c-bg, #0a0a0a) 70%, #ffffff 5%) 0%, var(--c-bg, #0a0a0a) 80%)",
        color: "var(--c-fg, #d4af37)",
        fontFamily: "'Hiragino Mincho ProN', 'Times New Roman', serif",
      }}
    >
      <div
        className="absolute inset-[3mm] border-[0.4mm] pointer-events-none"
        style={{ borderColor: "color-mix(in srgb, var(--c-accent, #d4af37) 70%, transparent)" }}
      />
      <div
        className="absolute inset-[3.8mm] border-[0.15mm] pointer-events-none"
        style={{ borderColor: "color-mix(in srgb, var(--c-accent, #d4af37) 35%, transparent)" }}
      />

      <div className="relative flex flex-col items-center w-full min-w-0">
        <Monogram data={d} size="12mm" bgColor="var(--c-accent, #d4af37)" fgColor="var(--c-bg, #0a0a0a)" />
        <div data-role="company" className="text-[6.5pt] tracking-[0.3em] uppercase mt-[1.5mm] min-w-0 text-center" style={{ color: "var(--c-accent, #d4af37)" }}>
          {d.company}
        </div>
      </div>

      <div className="relative flex flex-col items-center w-full min-w-0">
        {!d.customization.fineAdjust.hideTemplateExtras && (
          <div className="my-[1mm] flex items-center gap-[1mm]">
            <span className="h-px w-[5mm] shrink-0" style={{ backgroundColor: "var(--c-accent, #d4af37)" }} />
            <span style={{ color: "var(--c-accent, #d4af37)" }}>◆</span>
            <span className="h-px w-[5mm] shrink-0" style={{ backgroundColor: "var(--c-accent, #d4af37)" }} />
          </div>
        )}
        <div data-role="name" className="text-[18pt] font-semibold leading-tight min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #d4af37) 30%, #ffffff)" }}>
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[6.5pt] tracking-[0.25em] uppercase mt-[0.5mm] min-w-0 text-center" style={{ color: "var(--c-fg, #d4af37)", opacity: 0.85 }}>
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7pt] italic mt-[1mm] min-w-0" style={{ color: "var(--c-fg, #d4af37)", opacity: 0.7 }}>{d.title}</div>
      </div>

      <div
        data-role="contact"
        className="relative text-[6pt] tracking-wider leading-[1.5] text-center flex flex-col items-center gap-[0.2mm] w-full min-w-0"
        style={{ color: "var(--c-fg, #d4af37)", opacity: 0.85, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
      >
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2mm" className="shrink-0" style={{ color: "var(--c-accent, #d4af37)" }} />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2mm" className="shrink-0" style={{ color: "var(--c-accent, #d4af37)" }} />{d.email}</span>}
        {d.website && <span data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2mm" className="shrink-0" style={{ color: "var(--c-accent, #d4af37)" }} />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="flex items-center gap-[1mm] min-w-0"><Icon kind="pin" size="2mm" className="shrink-0" style={{ color: "var(--c-accent, #d4af37)" }} />{d.addressLine}</span>}
      </div>
    </div>
  );
}

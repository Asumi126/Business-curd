import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function EmbossedGold({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        background:
          "radial-gradient(ellipse at top right, color-mix(in srgb, var(--c-bg, #0a0a0a) 70%, #ffffff 5%) 0%, var(--c-bg, #0a0a0a) 80%)",
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
      <div className="relative flex flex-col items-center text-center pt-[1mm] min-w-0">
        <Monogram data={d} size="10mm" bgColor="var(--c-accent, #d4af37)" fgColor="var(--c-bg, #0a0a0a)" />
        <div data-role="company" className="text-[6.5pt] tracking-[0.3em] uppercase mt-[0.5mm] min-w-0 max-w-full" style={{ color: "var(--c-accent, #d4af37)" }}>
          {d.company}
        </div>
        {!d.customization.fineAdjust.hideTemplateExtras && (
          <div className="my-[0.8mm] flex items-center gap-[1mm]">
            <span className="h-px w-[4mm]" style={{ backgroundColor: "var(--c-accent, #d4af37)" }} />
            <span className="text-[6pt]" style={{ color: "var(--c-accent, #d4af37)" }}>◆</span>
            <span className="h-px w-[4mm]" style={{ backgroundColor: "var(--c-accent, #d4af37)" }} />
          </div>
        )}
        <div data-role="name" className="text-[16pt] font-semibold leading-[1.05] min-w-0 max-w-full" style={{ color: "var(--c-fg, #d4af37)" }}>{nameDisplay(d)}</div>
        <div data-role="nameEn" className="text-[6.5pt] tracking-[0.25em] uppercase mt-[0.3mm] min-w-0 max-w-full" style={{ color: "var(--c-accent, #d4af37)", opacity: 0.85 }}>
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[6.5pt] italic mt-[0.5mm] min-w-0 max-w-full" style={{ color: "var(--c-fg, #d4af37)", opacity: 0.7 }}>{d.title}</div>
      </div>
      <div className="relative flex-1 flex items-end justify-center min-w-0">
        <div
          data-role="contact"
          className="text-[6pt] tracking-wide leading-[1.5] text-center flex flex-wrap justify-center gap-x-[3mm] gap-y-[0.3mm] max-w-full min-w-0 w-full"
          style={{ color: "var(--c-fg, #d4af37)", opacity: 0.85, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
        >
          {d.phone && (
            <span data-role="phone" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="phone" size="2mm" className="shrink-0" style={{ color: "var(--c-accent, #d4af37)" }} />
              {d.phone}
            </span>
          )}
          {d.email && (
            <span data-role="email" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="mail" size="2mm" className="shrink-0" style={{ color: "var(--c-accent, #d4af37)" }} />
              {d.email}
            </span>
          )}
          {d.website && (
            <span data-role="website" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="web" size="2mm" className="shrink-0" style={{ color: "var(--c-accent, #d4af37)" }} />
              {d.website}
            </span>
          )}
          {d.addressLine && (
            <span data-role="address" className="flex items-start gap-[1mm] min-w-0 basis-full justify-center">
              <Icon kind="pin" size="2mm" className="shrink-0 mt-[0.3mm]" style={{ color: "var(--c-accent, #d4af37)" }} />
              {d.addressLine}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

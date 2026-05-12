import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function WallStreet({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        background:
          "linear-gradient(180deg, var(--c-bg, #0a1628) 0%, color-mix(in srgb, var(--c-bg, #0a1628) 85%, #ffffff 5%) 100%)",
        color: "var(--c-fg, #fde68a)",
        fontFamily: "'Times New Roman', 'Hiragino Mincho ProN', serif",
      }}
    >
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <div
          className="absolute inset-[3mm] border pointer-events-none"
          style={{ borderColor: "color-mix(in srgb, var(--c-accent, #d4af37) 30%, transparent)" }}
        />
      )}
      <div className="relative flex items-start justify-between gap-[3mm]">
        <div className="min-w-0 flex-1">
          {!d.customization.fineAdjust.hideTemplateExtras && (
            /* Top decorative dot — pure visual, no text */
            <div className="flex items-center gap-[1mm] mb-[0.5mm]">
              <span
                className="w-[1.2mm] h-[1.2mm] rounded-full shrink-0"
                style={{ backgroundColor: "var(--c-accent, #d4af37)" }}
              />
              <span
                className="h-px w-[8mm] shrink-0"
                style={{ backgroundColor: "color-mix(in srgb, var(--c-accent, #d4af37) 60%, transparent)" }}
              />
            </div>
          )}
          <div data-role="company" className="text-[8.5pt] tracking-[0.2em] mt-[0.3mm] uppercase font-bold min-w-0">{d.company}</div>
        </div>
        <div className="shrink-0">
          <Monogram data={d} size="11mm" bgColor="var(--c-accent, #d4af37)" fgColor="var(--c-bg, #0a1628)" />
        </div>
      </div>
      {!d.customization.fineAdjust.hideTemplateExtras && (
        /* Decorative divider — pure line, no symbol */
        <div
          className="relative my-[1.5mm] h-px w-full"
          style={{
            background:
              "linear-gradient(to right, var(--c-accent, #d4af37), color-mix(in srgb, var(--c-accent, #d4af37) 30%, transparent), transparent)",
          }}
        />
      )}
      <div className="relative min-w-0">
        <div data-role="name" className="text-[16pt] font-semibold leading-tight min-w-0" style={{ color: "color-mix(in srgb, var(--c-fg, #fde68a) 30%, #ffffff)" }}>
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[6.5pt] tracking-[0.3em] uppercase mt-[0.3mm] min-w-0">{d.nameEn}</div>
        <div data-role="title" className="text-[7pt] italic mt-[0.5mm] min-w-0" style={{ opacity: 0.85 }}>{d.title}</div>
      </div>
      <div className="relative flex-1 flex items-end min-w-0">
        <div
          data-role="contact"
          className="w-full text-[6.2pt] tracking-wide leading-[1.5] grid grid-cols-1 gap-y-[0.2mm] min-w-0"
          style={{ opacity: 0.85, fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}
        >
          <div className="grid grid-cols-1 gap-y-[0.2mm] min-w-0">
            {d.phone && (
              <div data-role="phone" className="flex items-center gap-[1mm] min-w-0">
                <Icon kind="phone" size="2.2mm" className="shrink-0" />
                <span className="min-w-0">{d.phone}</span>
              </div>
            )}
            {d.email && (
              <div data-role="email" className="flex items-center gap-[1mm] min-w-0">
                <Icon kind="mail" size="2.2mm" className="shrink-0" />
                <span className="min-w-0">{d.email}</span>
              </div>
            )}
            {d.website && (
              <div data-role="website" className="flex items-center gap-[1mm] min-w-0">
                <Icon kind="web" size="2.2mm" className="shrink-0" />
                <span className="min-w-0">{d.website}</span>
              </div>
            )}
          </div>
          {d.addressLine && (
            <div data-role="address" className="flex items-start gap-[1mm] min-w-0">
              <Icon kind="pin" size="2.2mm" className="shrink-0 mt-[0.4mm]" />
              <span className="min-w-0">{d.addressLine}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

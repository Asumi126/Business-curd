import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function JapaneseWabi({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex p-[6mm]"
      style={{
        backgroundColor: "var(--c-bg, #f5f1e8)",
        color: "var(--c-fg, #171717)",
        backgroundImage:
          "radial-gradient(ellipse at top right, color-mix(in srgb, var(--c-accent, #7c2d12) 8%, transparent), transparent 60%), radial-gradient(ellipse at bottom left, color-mix(in srgb, var(--c-fg, #171717) 4%, transparent), transparent 70%)",
        fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
      }}
    >
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-[3mm]">
          <div className="min-w-0 flex-1">
            <div data-role="company" className="text-[7pt] tracking-[0.25em] min-w-0" style={{ color: "var(--c-accent, #7c2d12)" }}>
              {d.company}
            </div>
            {d.department && (
              <div className="text-[6.5pt] tracking-[0.2em] mt-[0.5mm] min-w-0" style={{ color: "var(--c-muted, #737373)" }}>
                {d.department}
              </div>
            )}
          </div>
          <Monogram data={d} size="10mm" bgColor="var(--c-accent, #7c2d12)" fgColor="var(--c-bg, #f5f1e8)" />
        </div>
        <div className="min-w-0">
          <div data-role="name" className="text-[18pt] tracking-[0.08em] leading-tight min-w-0">{nameDisplay(d)}</div>
          <div data-role="nameEn" className="text-[7pt] tracking-[0.2em] mt-[0.5mm] min-w-0" style={{ color: "var(--c-muted, #a3a3a3)" }}>
            {d.nameEn}
          </div>
          <div data-role="title" className="text-[7.5pt] tracking-wider mt-[1mm] min-w-0" style={{ opacity: 0.85 }}>{d.title}</div>
        </div>
        <div
          data-role="contact"
          className="text-[6.5pt] tracking-wide leading-[1.5] grid gap-y-[0.2mm] pt-[1.2mm]"
          style={{
            color: "var(--c-fg, #171717)",
            opacity: 0.85,
            borderTop: "1px solid color-mix(in srgb, var(--c-accent, #7c2d12) 25%, transparent)",
            fontFamily: "'Helvetica Neue', system-ui, sans-serif",
          }}
        >
          {d.phone && (
            <div data-role="phone" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="phone" size="2.3mm" className="shrink-0" style={{ color: "var(--c-accent, #7c2d12)" }} />
              <span className="min-w-0">{d.phone}</span>
            </div>
          )}
          {d.email && (
            <div data-role="email" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="mail" size="2.3mm" className="shrink-0" style={{ color: "var(--c-accent, #7c2d12)" }} />
              <span className="min-w-0">{d.email}</span>
            </div>
          )}
          {d.addressLine && (
            <div data-role="address" className="flex items-start gap-[1mm] min-w-0">
              <Icon kind="pin" size="2.3mm" className="shrink-0 mt-[0.3mm]" style={{ color: "var(--c-accent, #7c2d12)" }} />
              <span className="min-w-0">{d.addressLine}</span>
            </div>
          )}
          {d.website && (
            <div data-role="website" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="web" size="2.3mm" className="shrink-0" style={{ color: "var(--c-accent, #7c2d12)" }} />
              <span className="min-w-0">{d.website}</span>
            </div>
          )}
        </div>
      </div>
      <div className="w-[5mm] flex flex-col items-end justify-start ml-[3mm]">
        <div className="w-[1px] h-full" style={{ backgroundColor: "color-mix(in srgb, var(--c-accent, #7c2d12) 30%, transparent)" }} />
      </div>
    </div>
  );
}

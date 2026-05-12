import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function CorporateBlue({ data }: { data: CardData }) {
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
        className="w-[20mm] flex flex-col items-center justify-center p-[3mm] relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--c-accent, #1e3a8a) 75%, #000), var(--c-accent, #1e3a8a) 60%, color-mix(in srgb, var(--c-accent, #1e3a8a) 80%, #fff) 100%)",
        }}
      >
        <div className="absolute -bottom-[15mm] -left-[15mm] w-[35mm] h-[35mm] rounded-full bg-white/[0.06]" />
        <div className="absolute -top-[10mm] -right-[10mm] w-[25mm] h-[25mm] rounded-full bg-white/[0.04]" />
        <Monogram data={d} size="14mm" bgColor="#ffffff" fgColor="var(--c-accent, #1e3a8a)" />
      </div>
      <div className="flex-1 flex flex-col justify-center pl-[7mm] pr-[6mm] py-[5mm] min-w-0">
        <div
          data-role="company"
          className="text-[7pt] tracking-[0.3em] font-bold uppercase min-w-0"
          style={{ color: "var(--c-accent, #1e3a8a)" }}
        >
          {d.company}
        </div>
        {d.department && (
          <div className="text-[6.5pt] mt-[0.5mm] tracking-wider min-w-0" style={{ color: "var(--c-muted, #737373)" }}>
            {d.department}
          </div>
        )}
        <div data-role="name" className="text-[16pt] font-bold tracking-[-0.02em] leading-tight mt-[1.5mm] min-w-0">
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7pt] tracking-[0.2em] mt-[0.5mm] uppercase min-w-0" style={{ color: "var(--c-muted, #a3a3a3)" }}>
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[8pt] mt-[1.5mm] min-w-0" style={{ opacity: 0.85 }}>{d.title}</div>
        <div data-role="contact" className="mt-[2mm] text-[6.8pt] leading-relaxed grid gap-y-[0.4mm] min-w-0" style={{ color: "var(--c-fg, #171717)", opacity: 0.85 }}>
          {d.phone && (
            <div data-role="phone" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="phone" size="2.4mm" className="shrink-0" style={{ color: "var(--c-accent, #1e3a8a)" }} />
              {d.phone}
            </div>
          )}
          {d.email && (
            <div data-role="email" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="mail" size="2.4mm" className="shrink-0" style={{ color: "var(--c-accent, #1e3a8a)" }} />
              {d.email}
            </div>
          )}
          {d.website && (
            <div data-role="website" className="flex items-center gap-[1mm] min-w-0">
              <Icon kind="web" size="2.4mm" className="shrink-0" style={{ color: "var(--c-accent, #1e3a8a)" }} />
              {d.website}
            </div>
          )}
          {d.addressLine && (
            <div data-role="address" className="flex items-start gap-[1mm] min-w-0">
              <Icon kind="pin" size="2.4mm" className="shrink-0 mt-[0.4mm]" style={{ color: "var(--c-accent, #1e3a8a)" }} />
              {d.addressLine}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

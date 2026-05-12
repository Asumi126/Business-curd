import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { fallback, nameDisplay } from "./utils";

export function ModernGradientBlue({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6mm]"
      style={{
        background:
          "linear-gradient(135deg, var(--c-bg, #1e3a8a) 0%, color-mix(in srgb, var(--c-bg, #1e3a8a) 60%, var(--c-accent, #06b6d4) 40%) 45%, var(--c-accent, #06b6d4) 100%)",
        color: "var(--c-fg, #ffffff)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="absolute -top-[10mm] -right-[10mm] w-[35mm] h-[35mm] rounded-full bg-white/10 blur-md" />
      <div className="absolute -bottom-[15mm] -left-[5mm] w-[40mm] h-[40mm] rounded-full bg-white/5 blur-md" />
      <div className="relative flex-1 flex flex-col justify-end min-w-0">
        <div data-role="company" className="text-[8pt] tracking-[0.22em] uppercase min-w-0" style={{ opacity: 0.85 }}>{d.company}</div>
        <div data-role="name" className="text-[19pt] font-bold tracking-tight leading-tight min-w-0">{nameDisplay(d)}</div>
        <div data-role="nameEn" className="text-[8pt] tracking-[0.12em] mt-[0.5mm] min-w-0" style={{ opacity: 0.75 }}>{d.nameEn}</div>
        <div data-role="title" className="text-[8pt] mt-[1mm] min-w-0" style={{ opacity: 0.9 }}>{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.5mm] mt-[2mm] min-w-0" style={{ opacity: 0.85 }}>
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}

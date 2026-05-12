import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function SunsetGradient({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm] overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--c-bg, #f59e0b) 0%, color-mix(in srgb, var(--c-bg, #f59e0b) 50%, var(--c-accent, #8b5cf6) 50%) 50%, var(--c-accent, #8b5cf6) 100%)",
        color: "var(--c-fg, #ffffff)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="absolute top-[-15mm] right-[-15mm] w-[55mm] h-[55mm] rounded-full bg-white/25 blur-[1mm]" />
      <div className="absolute bottom-[-15mm] left-[-10mm] w-[50mm] h-[50mm] rounded-full bg-white/20 blur-[1mm]" />
      <div className="absolute right-[5mm] top-[5mm] z-10">
        <Monogram data={d} size="12mm" bgColor="var(--c-fg, #ffffff)" fgColor="var(--c-accent, #ec4899)" />
      </div>
      <div className="relative flex-1 flex flex-col justify-end pr-[14mm] min-w-0">
        <div data-role="company" className="text-[7.5pt] tracking-[0.25em] uppercase font-light min-w-0" style={{ opacity: 0.9 }}>
          {d.company}
        </div>
        <div data-role="name" className="text-[20pt] font-bold leading-tight tracking-[-0.02em] mt-[1mm] min-w-0">{nameDisplay(d)}</div>
        <div data-role="nameEn" className="text-[7.5pt] tracking-[0.18em] italic mt-[0.5mm] min-w-0" style={{ opacity: 0.85 }}>
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[7.5pt] mt-[1.5mm] min-w-0" style={{ opacity: 0.95 }}>{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] leading-relaxed mt-[2.5mm] flex flex-wrap gap-x-[3mm] gap-y-[0.4mm] min-w-0" style={{ opacity: 0.95 }}>
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="flex items-center gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0" />{d.addressLine}</span>}
      </div>
    </div>
  );
}

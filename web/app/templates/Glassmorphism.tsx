import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function Glassmorphism({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm] overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, #0c4a6e 0%, #6366f1 50%, #ec4899 100%)",
        fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <>
          <div className="absolute -top-[10mm] -right-[5mm] w-[40mm] h-[40mm] rounded-full bg-pink-300/40 blur-[2mm]" />
          <div className="absolute -bottom-[15mm] -left-[10mm] w-[50mm] h-[50mm] rounded-full bg-cyan-300/30 blur-[2mm]" />
        </>
      )}
      <div className="relative flex-1 flex flex-col justify-end">
        <div
          className="rounded-[2mm] p-[5mm] backdrop-blur-md"
          style={{
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.35)",
          }}
        >
          <div className="flex items-start justify-between gap-[3mm] min-w-0">
            <div className="flex-1 min-w-0">
              <div data-role="company" className="text-[7pt] tracking-[0.22em] uppercase font-medium opacity-90 min-w-0">
                {d.company}
              </div>
              <div data-role="name" className="text-[19pt] font-bold leading-tight tracking-[-0.02em] mt-[1mm] min-w-0">
                {nameDisplay(d)}
              </div>
              <div data-role="nameEn" className="text-[7pt] tracking-[0.15em] mt-[0.5mm] opacity-85 uppercase min-w-0">
                {d.nameEn}
              </div>
              <div data-role="title" className="text-[8pt] mt-[1mm] opacity-90 min-w-0">{d.title}</div>
            </div>
            <div className="shrink-0">
              <Monogram data={d} size="13mm" bgColor="#ffffff" fgColor="#1e3a8a" />
            </div>
          </div>
          <div data-role="contact" className="mt-[2mm] pt-[1.5mm] border-t border-white/30 text-[6.5pt] flex flex-wrap gap-x-[3mm] gap-y-[0.4mm] opacity-90 min-w-0">
            {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.3mm" className="shrink-0" />{d.phone}</span>}
            {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.3mm" className="shrink-0" />{d.email}</span>}
            {d.website && <span data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.3mm" className="shrink-0" />{d.website}</span>}
            {d.addressLine && <span data-role="address" className="flex items-start gap-[1mm] min-w-0 basis-full"><Icon kind="pin" size="2.3mm" className="shrink-0 mt-[0.3mm]" />{d.addressLine}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

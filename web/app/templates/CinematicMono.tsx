import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function CinematicMono({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-neutral-950 text-neutral-100 flex flex-col p-[7mm] overflow-hidden" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
          <defs>
            <radialGradient id="cine-grad" cx="20%" cy="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="200" height="121" fill="url(#cine-grad)" />
          <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
          <line x1="0" y1="101" x2="200" y2="101" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
        </svg>
      )}
      <div className="relative flex items-center justify-between gap-[2mm] text-[6.5pt] tracking-[0.22em] uppercase text-neutral-500 min-w-0">
        {!d.customization.fineAdjust.hideTemplateExtras && <span className="shrink-0">SCENE 01</span>}
        <span data-role="company" className="min-w-0 truncate text-center flex-1">{d.company}</span>
        {!d.customization.fineAdjust.hideTemplateExtras && <span className="shrink-0">TAKE 01</span>}
      </div>
      <div className="relative flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-[4mm] min-w-0">
          <Monogram data={d} size="14mm" bgColor="#fafafa" fgColor="#0a0a0a" forceStyle="square" />
          <div className="flex-1 min-w-0">
            <div data-role={d.nameEn ? "nameEn" : "name"} className="text-[24pt] font-bold leading-[0.92] tracking-[-0.04em] uppercase">
              {d.nameEn || d.nameJa}
            </div>
            <div data-role="name" className="text-[10pt] mt-[0.5mm] tracking-[0.05em]">{nameDisplay(d)}</div>
            <div data-role="title" className="text-[7pt] tracking-[0.25em] mt-[0.5mm] text-neutral-400 uppercase">
              {d.title}
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex items-end justify-between gap-[2mm] text-[6.5pt] tracking-wider text-neutral-400 min-w-0">
        <div data-role="contact" className="flex flex-wrap gap-x-[3mm] gap-y-[0.4mm] min-w-0 flex-1">
          {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.4mm" className="shrink-0" />{d.phone}</span>}
          {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.4mm" className="shrink-0" />{d.email}</span>}
          {d.addressLine && <span data-role="address" className="flex items-start gap-[1mm] min-w-0 basis-full"><Icon kind="pin" size="2.4mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
        </div>
        {!d.customization.fineAdjust.hideTemplateExtras && <span className="tracking-[0.3em] uppercase text-neutral-500 shrink-0">END</span>}
      </div>
    </div>
  );
}

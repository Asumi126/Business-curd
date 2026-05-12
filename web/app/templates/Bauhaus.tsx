import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function Bauhaus({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-[#faf3e0] text-neutral-900 flex flex-col" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
          <circle cx="155" cy="20" r="14" fill="#dc2626" />
          <rect x="0" y="80" width="40" height="41" fill="#1d4ed8" />
          <path d="M180 75 L200 75 L200 121 Z" fill="#fbbf24" />
          <line x1="0" y1="40" x2="200" y2="40" stroke="#0a0a0a" strokeWidth="0.4" />
        </svg>
      )}
      <div className="relative flex-1 flex flex-col justify-center p-[7mm] mt-[8mm] pr-[18mm] min-w-0">
        <div className="absolute top-[5mm] right-[5mm]">
          <Monogram data={d} size="11mm" bgColor="#0a0a0a" fgColor="#faf3e0" forceStyle="square" />
        </div>
        <div data-role="company" className="text-[8pt] tracking-[0.22em] uppercase font-bold min-w-0">{d.company}</div>
        <div data-role="name" className="text-[22pt] font-black tracking-[-0.04em] leading-[0.92] mt-[1mm] min-w-0">
          {nameDisplay(d)}
        </div>
        <div className="text-[7pt] tracking-[0.2em] uppercase text-neutral-700 mt-[0.5mm] font-bold flex flex-wrap gap-x-[2mm] min-w-0">
          <span data-role="nameEn">{d.nameEn}</span>
          {d.nameEn && d.title && !d.customization.fineAdjust.hideTemplateExtras && <span aria-hidden>—</span>}
          <span data-role="title">{d.title}</span>
        </div>
      </div>
      <div data-role="contact" className="relative px-[7mm] pb-[6mm] text-[7pt] font-medium leading-relaxed flex flex-wrap gap-x-[3mm] gap-y-[0.6mm] min-w-0">
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="flex items-start gap-[1mm] min-w-0 basis-full"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}

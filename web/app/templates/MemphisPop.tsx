import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function MemphisPop({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div className="absolute inset-0 bg-[#fffbeb] text-neutral-900 flex flex-col p-[7mm] overflow-hidden" style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif" }}>
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
          <circle cx="20" cy="20" r="9" fill="#06b6d4" />
          <rect x="170" y="8" width="22" height="22" fill="#ef4444" transform="rotate(15 181 19)" />
          <path d="M180 90 L195 105 L165 105 Z" fill="#fbbf24" />
          <g stroke="#0f172a" strokeWidth="0.7" fill="none">
            <path d="M165 50 Q175 60 165 70 Q155 60 165 50 Z" />
            <circle cx="35" cy="100" r="6" />
          </g>
          <g fill="#0f172a">
            <circle cx="6" cy="60" r="1.4" />
            <circle cx="12" cy="60" r="1.4" />
            <circle cx="18" cy="60" r="1.4" />
            <circle cx="24" cy="60" r="1.4" />
            <circle cx="30" cy="60" r="1.4" />
          </g>
        </svg>
      )}
      <div className="absolute right-[4mm] top-[4mm] z-10">
        <Monogram data={d} size="11mm" bgColor="#ec4899" fgColor="#fff" forceStyle="circle" />
      </div>
      <div className="relative flex-1 flex flex-col justify-center mt-[12mm] pr-[14mm] min-w-0">
        <div data-role="company" className="text-[8pt] tracking-[0.22em] text-[#ef4444] uppercase font-extrabold min-w-0">
          {d.company}
        </div>
        <div data-role="name" className="text-[22pt] font-black leading-tight tracking-[-0.03em] mt-[1mm] min-w-0">
          {nameDisplay(d)}
        </div>
        <div data-role="nameEn" className="text-[7pt] tracking-[0.15em] text-[#06b6d4] mt-[0.5mm] font-bold uppercase min-w-0">
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[8pt] mt-[1mm] text-[#0f172a] font-bold min-w-0">{d.title}</div>
      </div>
      <div data-role="contact" className="relative text-[7pt] font-medium leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.4mm] min-w-0">
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.5mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.5mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.5mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.5mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}

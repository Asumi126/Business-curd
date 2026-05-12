import { CardData } from "../lib/types";
import { Icon } from "../lib/icons";
import { Monogram } from "../components/Monogram";
import { fallback, nameDisplay } from "./utils";

export function HandDrawn({ data }: { data: CardData }) {
  const d = fallback(data);
  return (
    <div
      className="absolute inset-0 flex flex-col p-[7mm] text-neutral-800"
      style={{
        backgroundColor: "#fefdf8",
        fontFamily: "'Caveat', 'Comic Sans MS', 'Marker Felt', cursive",
      }}
    >
      {!d.customization.fineAdjust.hideTemplateExtras && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 121" preserveAspectRatio="none">
          <rect x="3" y="3" width="194" height="115" rx="3" fill="none" stroke="#27272a" strokeWidth="0.4" strokeDasharray="2 2" />
          <path d="M14 22 Q 50 18, 90 22 T 180 22" stroke="#f97316" strokeWidth="0.7" fill="none" strokeLinecap="round" />
          <path d="M30 80 Q 60 84, 100 80 T 170 80" stroke="#0ea5e9" strokeWidth="0.7" fill="none" strokeLinecap="round" />
          <circle cx="178" cy="14" r="3" fill="#f97316" />
          <circle cx="170" cy="14" r="2" fill="#0ea5e9" />
          <circle cx="186" cy="100" r="1.5" fill="#0ea5e9" />
        </svg>
      )}
      <div className="absolute right-[5mm] top-[5mm] z-10">
        <Monogram data={d} size="12mm" bgColor="#f97316" fgColor="#fefdf8" forceStyle="circle" />
      </div>
      <div className="relative flex-1 flex flex-col justify-center mt-[6mm] pr-[14mm] min-w-0">
        <div data-role="company" className="text-[10pt] text-[#f97316] min-w-0" style={{ fontFamily: "'Hiragino Sans', system-ui, sans-serif", fontWeight: 700 }}>
          {d.company}
        </div>
        <div data-role="name" className="text-[22pt] font-bold leading-tight mt-[1mm] min-w-0">{nameDisplay(d)}</div>
        <div data-role="nameEn" className="text-[8pt] text-[#0ea5e9] mt-[0.5mm] min-w-0" style={{ fontFamily: "'Hiragino Sans', system-ui, sans-serif" }}>
          {d.nameEn}
        </div>
        <div data-role="title" className="text-[9pt] mt-[1mm] text-neutral-700 min-w-0">{!d.customization.fineAdjust.hideTemplateExtras && "— "}{d.title}{!d.customization.fineAdjust.hideTemplateExtras && " —"}</div>
      </div>
      <div data-role="contact" className="relative text-[8pt] leading-relaxed grid grid-cols-2 gap-x-[3mm] gap-y-[0.4mm] min-w-0" style={{ fontFamily: "'Hiragino Sans', system-ui, sans-serif" }}>
        {d.phone && <span data-role="phone" className="flex items-center gap-[1mm] min-w-0"><Icon kind="phone" size="2.6mm" className="shrink-0" />{d.phone}</span>}
        {d.email && <span data-role="email" className="flex items-center gap-[1mm] min-w-0"><Icon kind="mail" size="2.6mm" className="shrink-0" />{d.email}</span>}
        {d.website && <span data-role="website" className="col-span-2 flex items-center gap-[1mm] min-w-0"><Icon kind="web" size="2.6mm" className="shrink-0" />{d.website}</span>}
        {d.addressLine && <span data-role="address" className="col-span-2 flex items-start gap-[1mm] min-w-0"><Icon kind="pin" size="2.6mm" className="shrink-0 mt-[0.4mm]" />{d.addressLine}</span>}
      </div>
    </div>
  );
}
